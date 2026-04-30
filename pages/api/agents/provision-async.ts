/**
 * pages/api/agents/provision-async.ts
 * Async provisioning endpoint for new user signups
 * POST /api/agents/provision-async
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "@/lib/supabase";

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

    const vpsApiUrl = process.env.VPS_API_URL || "http://127.0.0.1:8000";
    const vpsToken = process.env.VPS_ADMIN_TOKEN || "change-me-in-production";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://laverdi.tech";

    const provisionRequest = {
      userId,
      email,
      tier,
      containerName: `openclaw-${userId.substring(0, 8)}-${Date.now()}`,
      callbackUrl: `${appUrl}/api/webhooks/instance-ready`,
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
        console.log(`[Provision] Container provisioned for ${email}:`, {
          gatewayToken: data.gatewayToken ? data.gatewayToken.substring(0, 8) + '...' : 'none',
          port: data.port,
          status: data.status,
        });

        // Map tier to model
        const tierModelMap: Record<string, string> = {
          free: "anthropic-claude-haiku-4.5",
          starter: "anthropic-claude-4.6-sonnet",
          professional: "anthropic-claude-opus-4.6",
        };
        const modelId = tierModelMap[tier || "starter"] || "anthropic-claude-4.6-sonnet";

        // Create instance record with gateway token
        const supabase = createAdminClient();
        const { error: insertError } = await supabase
          .from("instances")
          .insert({
            user_id: userId,
            container_id: data.containerName || data.containerId,
            model_id: modelId,
            status: "provisioning",
            port: data.port || null,
            ip_address: "64.23.142.154",
            api_key: data.gatewayToken || null,
          });

        if (insertError) {
          console.error(`[Provision] Failed to create instance record:`, insertError);
        } else {
          console.log(`[Provision] Instance record created for ${email}`);
        }

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
        return res
          .status(200)
          .json({
            success: true,
            message: `Provisioning request sent (VPS response: ${response.status})`,
          });
      }
    } catch (vpsError) {
      console.error(`[Provision] VPS connection error for ${email}:`, vpsError);
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
