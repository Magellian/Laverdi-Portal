/**
 * pages/api/agents/index.ts
 * List user's agents and shared credit pool stats
 * GET /api/agents - List all agents with shared credit info
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface Agent {
  id: string;
  name: string;
  description?: string;
  isPrimary: boolean;
  isActive: boolean;
  ipAddress: string;
  port: number;
  status: string;
  endpoint: string;
  createdAt: string;
}

interface SharedCreditPool {
  tier: string;
  monthlyLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  agentCount: number;
  resetDate: string;
}

type ResponseData = {
  success: boolean;
  data?: {
    agents: Agent[];
    creditPool: SharedCreditPool;
    agentLimit: number;
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
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

  try {
    // Get user tier
    const { data: userData2 } = await supabase
      .from("users")
      .select("tier")
      .eq("id", userId)
      .single();

    const tier = userData2?.tier || "free";

    // Get agents
    const { data: agentsData, error: agentsError } = await supabase
      .from("user_agents")
      .select("id, name, description, is_primary, is_active, ip_address, port, status, created_at")
      .eq("user_id", userId);

    if (agentsError) throw agentsError;

    const agents: Agent[] = (agentsData || []).map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      isPrimary: agent.is_primary,
      isActive: agent.is_active,
      ipAddress: agent.ip_address,
      port: agent.port,
      status: agent.status,
      endpoint: `http://${agent.ip_address}:${agent.port}`,
      createdAt: agent.created_at,
    }));

    // Get shared credit pool stats
    const { data: creditData, error: creditError } = await supabase
      .from("user_shared_credit_pool")
      .select(
        "monthly_limit, credits_used, credits_remaining, agent_count, reset_date"
      )
      .eq("user_id", userId)
      .single();

    if (creditError && creditError.code !== "PGRST116") {
      throw creditError;
    }

    const creditPool: SharedCreditPool = {
      tier,
      monthlyLimit: creditData?.monthly_limit || 100,
      creditsUsed: creditData?.credits_used || 0,
      creditsRemaining: creditData?.credits_remaining || 100,
      agentCount: creditData?.agent_count || 0,
      resetDate: creditData?.reset_date || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    };

    const agentLimits: Record<string, number> = { free: 1, starter: 3, pro: 10 };
    const agentLimit = agentLimits[tier] || 1;

    return res.status(200).json({
      success: true,
      data: {
        agents,
        creditPool,
        agentLimit,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching agents:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch agents",
    });
  }
}
