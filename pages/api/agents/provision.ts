/**
 * pages/api/agents/provision.ts
 * Provision a new OpenClaw agent for user
 * POST /api/agents/provision - Create new agent
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  createUserDroplet,
  storeDropletInfo,
} from "../../../lib/droplet-provisioner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type ResponseData = {
  success: boolean;
  data?: {
    agentId: string;
    agentName: string;
    dropletId: number;
    ipAddress: string;
    status: string;
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }

  const userId = userData.user.id;
  const { agentName = "default" } = req.body;

  try {
    // Get user tier
    const { data: userData2 } = await supabase
      .from("users")
      .select("tier, email, api_key")
      .eq("id", userId)
      .single();

    if (!userData2) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const tier = userData2.tier;

    // Check agent limit based on tier
    const { data: existingAgents } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", userId)
      .is("deleted_at", null);

    const agentLimit = {
      free: 1,    // Free tier: 1 agent
      starter: 3, // Starter: 3 agents
      pro: 10,    // Pro: 10 agents
    }[tier as string] || 1;

    if ((existingAgents?.length || 0) >= agentLimit) {
      return res.status(403).json({
        success: false,
        error: `Agent limit reached for ${tier} tier (${agentLimit} max)`,
      });
    }

    // Create droplet
    const droplet = await createUserDroplet({
      userId,
      tier: tier as "starter" | "pro",
      email: userData2.email,
      apiKey: userData2.api_key,
    });

    // Store droplet info
    await storeDropletInfo(
      userId,
      droplet.dropletId,
      droplet.ipAddress,
      tier as "starter" | "pro"
    );

    // Create agent record linked to droplet
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .insert({
        user_id: userId,
        name: agentName,
        droplet_id: droplet.dropletId,
        is_primary: (existingAgents?.length || 0) === 0, // First agent is primary
        is_active: true,
      })
      .select("id")
      .single();

    if (agentError || !agentData) {
      throw new Error(`Failed to create agent: ${agentError?.message}`);
    }

    // Log audit
    await supabase.from("agent_audit_log").insert({
      user_id: userId,
      agent_id: agentData.id,
      action: "provision",
      details: { droplet_id: droplet.dropletId, tier },
    });

    return res.status(201).json({
      success: true,
      data: {
        agentId: agentData.id,
        agentName,
        dropletId: droplet.dropletId,
        ipAddress: droplet.ipAddress,
        status: droplet.status,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error provisioning agent:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to provision agent",
    });
  }
}
