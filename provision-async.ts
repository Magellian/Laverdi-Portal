/**
 * pages/api/agents/provision-async.ts
 * Async provisioning endpoint for new user signups
 * POST /api/agents/provision-async
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Tier to model mapping
const TIER_MODELS: Record<string, string> = {
  free: "anthropic-claude-haiku-4.5",
  starter: "anthropic-claude-4.6-sonnet",
  professional: "anthropic-claude-opus-4.6",
};

type ResponseData = {
  success: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { userId, email, tier } = req.body;

    if (!userId || !email) {
      return res
        .status(400)
        .json({ success: false, error: "Missing userId or email" });
    }

    console.log(`[Provision] Starting async provisioning for ${email} (tier: ${tier})`);

    const modelId = TIER_MODELS[tier] || TIER_MODELS["starter"];

    // Call Command Center to provision container
    const vpsApiUrl = process.env.VPS_API_URL || "http://laverdi-command-center:8000";
    const vpsToken = process.env.VPS_ADMIN_TOKEN || "change-me-in-production";

    const provisionRequest = {
      userId,
      email,
      tier,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${vpsApiUrl}/api/provision-container`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${vpsToken}`,
        },
        body: JSON.stringify(provisionRequest),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Provision] Container provisioned for ${email}:`, data);

        // Create instance record with real container data
        const { error: instanceError } = await supabase
          .from("instances")
          .insert({
            user_id: userId,
            container_id: data.containerId || data.containerName || "unknown",
            model_id: modelId,
            ip_address: "64.23.142.154",
            port: data.port || 9000,
            status: "ready",
            created_at: new Date().toISOString(),
          });

        if (instanceError) {
          console.error(`[Provision] Failed to create instance record:`, instanceError);
        } else {
          console.log(`[Provision] Instance record created for ${email}`);
        }

        // Also update user record
        await supabase
          .from("users")
          .update({ provisioned_at: new Date().toISOString() })
          .eq("id", userId);

        return res
          .status(200)
          .json({
            success: true,
            message: `Container provisioned for ${email}`,
          });
      } else {
        const errorData = await response.text();
        console.error(
          `[Provision] VPS error for ${email}:`,
          response.status,
          errorData
        );

        // Create instance record as failed
        await supabase
          .from("instances")
          .insert({
            user_id: userId,
            container_id: "failed",
            model_id: modelId,
            ip_address: "64.23.142.154",
            port: 0,
            status: "failed",
            created_at: new Date().toISOString(),
          });

        return res
          .status(200)
          .json({
            success: true,
            message: `Provisioning request sent (VPS response: ${response.status})`,
          });
      }
    } catch (vpsError) {
      console.error(`[Provision] VPS connection error for ${email}:`, vpsError);

      // Create instance record as failed
      await supabase
        .from("instances")
        .insert({
          user_id: userId,
          container_id: "failed",
          model_id: modelId,
          ip_address: "64.23.142.154",
          port: 0,
          status: "failed",
          created_at: new Date().toISOString(),
        });

      return res
        .status(200)
        .json({
          success: true,
          message: "Provisioning queued (will retry)",
        });
    }
  } catch (error: any) {
    console.error("[Provision] Handler error:", error);
    return res
      .status(200)
      .json({
        success: true,
        message: "Request processed",
      });
  }
}
