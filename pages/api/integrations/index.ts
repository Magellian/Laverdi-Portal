/**
 * pages/api/integrations/index.ts
 * Manage communication channel integrations (Telegram, Discord, WhatsApp, etc.)
 * GET - List integrations, POST - Add integration
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface Integration {
  id: string;
  agentId: string;
  platform: string;
  status: "active" | "inactive" | "error";
  config: {
    botToken?: string;
    webhookUrl?: string;
    chatId?: string;
    serverId?: string;
  };
  connectedAt: string;
  lastActivity?: string;
  isActive: boolean;
}

type ResponseData = {
  success: boolean;
  data?: Integration[] | Integration;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
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

  if (req.method === "GET") {
    return handleGet(userId, res);
  } else if (req.method === "POST") {
    return handlePost(userId, req.body, res);
  } else {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
}

async function handleGet(
  userId: string,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { data, error } = await supabase
      .from("integrations")
      .select(
        "id, agent_id, platform, status, config, connected_at, last_activity, is_active"
      )
      .eq("user_id", userId)
      .order("connected_at", { ascending: false });

    if (error) throw error;

    const integrations: Integration[] = (data || []).map((int: any) => ({
      id: int.id,
      agentId: int.agent_id,
      platform: int.platform,
      status: int.status,
      config: int.config || {},
      connectedAt: int.connected_at,
      lastActivity: int.last_activity,
      isActive: int.is_active,
    }));

    return res.status(200).json({ success: true, data: integrations });
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching integrations:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch integrations",
    });
  }
}

async function handlePost(
  userId: string,
  body: any,
  res: NextApiResponse<ResponseData>
) {
  const { agentId, platform, config } = body;

  if (!agentId || !platform || !config) {
    return res.status(400).json({
      success: false,
      error: "Missing agentId, platform, or config",
    });
  }

  try {
    // Verify agent ownership
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", agentId)
      .eq("user_id", userId)
      .single();

    if (agentError || !agentData) {
      return res.status(403).json({
        success: false,
        error: "Agent not found or unauthorized",
      });
    }

    // Validate config based on platform
    if (!validatePlatformConfig(platform, config)) {
      return res.status(400).json({
        success: false,
        error: `Invalid config for ${platform}`,
      });
    }

    // Create integration
    const { data: intData, error: intError } = await supabase
      .from("integrations")
      .insert({
        user_id: userId,
        agent_id: agentId,
        platform,
        config,
        status: "inactive", // Webhook needs to be set up first
        is_active: false,
      })
      .select("id, agent_id, platform, status, config, connected_at")
      .single();

    if (intError) throw intError;

    const integration: Integration = {
      id: intData.id,
      agentId: intData.agent_id,
      platform: intData.platform,
      status: intData.status,
      config: intData.config || {},
      connectedAt: intData.connected_at,
      isActive: false,
    };

    return res.status(201).json({ success: true, data: integration });
  } catch (err) {
    const error = err as Error;
    console.error("Error creating integration:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create integration",
    });
  }
}

function validatePlatformConfig(platform: string, config: any): boolean {
  switch (platform) {
    case "telegram":
      return !!config.botToken && !!config.chatId;
    case "discord":
      return !!config.botToken && (!!config.serverId || !!config.channelId);
    case "whatsapp":
      return !!config.phoneNumber && !!config.accessToken;
    case "slack":
      return !!config.botToken && !!config.signingSecret;
    case "email":
      return !!config.email;
    default:
      return false;
  }
}
