/**
 * pages/api/droplet/info.ts
 * Returns user's provisioned OpenClaw instance connection details
 * GET /api/droplet/info - returns droplet IP, port, status
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type ResponseData = {
  success: boolean;
  data?: {
    dropletId: number;
    ipAddress: string;
    port: number;
    status: "provisioning" | "active" | "error";
    endpoint: string;
    websocketUrl: string;
    apiKey: string;
    tier: string;
    createdAt: string;
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

  // Get user from Authorization header or session
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  // Verify token and get user
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }

  const userId = userData.user.id;

  try {
    // Get droplet info
    const { data: dropletData, error: dropletError } = await supabase
      .from("user_droplets")
      .select(
        "droplet_id, ip_address, tier, status, created_at, gateway_port"
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (dropletError || !dropletData) {
      return res.status(404).json({
        success: false,
        error:
          "No active droplet found. Upgrade to Starter or Pro to provision an agent.",
      });
    }

    // Get user API key
    const { data: userData2 } = await supabase
      .from("users")
      .select("api_key, tier")
      .eq("id", userId)
      .single();

    const port = dropletData.gateway_port || 18789;
    const endpoint = `http://${dropletData.ip_address}:${port}`;
    const websocketUrl = `ws://${dropletData.ip_address}:${port}`;

    return res.status(200).json({
      success: true,
      data: {
        dropletId: dropletData.droplet_id,
        ipAddress: dropletData.ip_address,
        port,
        status: dropletData.status as "provisioning" | "active" | "error",
        endpoint,
        websocketUrl,
        apiKey: userData2?.api_key || "",
        tier: dropletData.tier,
        createdAt: dropletData.created_at,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error getting droplet info:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve droplet information",
    });
  }
}
