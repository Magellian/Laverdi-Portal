/**
 * pages/api/integrations/[id]/setup.ts
 * Get platform-specific setup instructions and webhook details
 * GET - Get setup info for integration
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface SetupInfo {
  platform: string;
  webhookUrl: string;
  setupSteps: string[];
  config: {
    key: string;
    label: string;
    type: "text" | "password" | "url";
    required: boolean;
  }[];
  status: string;
  testStatus?: "pending" | "success" | "failed";
}

type ResponseData = {
  success: boolean;
  data?: SetupInfo;
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
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Invalid integration ID" });
  }

  try {
    // Get integration
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("id, platform, status, config")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (intError || !integration) {
      return res.status(404).json({
        success: false,
        error: "Integration not found",
      });
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${integration.platform}/${id}`;
    const setupInfo = getSetupInfo(
      integration.platform,
      webhookUrl,
      integration.status
    );

    return res.status(200).json({ success: true, data: setupInfo });
  } catch (err) {
    const error = err as Error;
    console.error("Error getting setup info:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to get setup information",
    });
  }
}

function getSetupInfo(platform: string, webhookUrl: string, status: string): SetupInfo {
  const setupGuides: Record<string, SetupInfo> = {
    telegram: {
      platform: "telegram",
      webhookUrl,
      setupSteps: [
        "1. Create a Telegram bot via @BotFather",
        "2. Copy the bot token",
        "3. Paste token above and save",
        "4. Find your chat ID (message the bot and check /api/telegram/webhook)",
        "5. Set webhook with: /setwebhook " + webhookUrl,
      ],
      config: [
        {
          key: "botToken",
          label: "Bot Token",
          type: "password",
          required: true,
        },
        {
          key: "chatId",
          label: "Chat ID",
          type: "text",
          required: true,
        },
      ],
      status,
    },
    discord: {
      platform: "discord",
      webhookUrl,
      setupSteps: [
        "1. Create Discord bot at discord.com/developers/applications",
        "2. Enable 'Message Content Intent'",
        "3. Copy bot token",
        "4. Paste token and save",
        "5. In Discord server: /invite to add bot",
        "6. Webhook URL will auto-configure for channel",
      ],
      config: [
        {
          key: "botToken",
          label: "Bot Token",
          type: "password",
          required: true,
        },
        {
          key: "serverId",
          label: "Server ID",
          type: "text",
          required: false,
        },
        {
          key: "channelId",
          label: "Channel ID",
          type: "text",
          required: false,
        },
      ],
      status,
    },
    whatsapp: {
      platform: "whatsapp",
      webhookUrl,
      setupSteps: [
        "1. Sign up for WhatsApp Business API at developers.facebook.com",
        "2. Create app and get Phone Number ID",
        "3. Generate access token",
        "4. Paste phone number and token",
        "5. Set webhook URL in WhatsApp settings",
        "6. Subscribe to 'messages' webhook events",
      ],
      config: [
        {
          key: "phoneNumber",
          label: "Phone Number ID",
          type: "text",
          required: true,
        },
        {
          key: "accessToken",
          label: "Access Token",
          type: "password",
          required: true,
        },
      ],
      status,
    },
    slack: {
      platform: "slack",
      webhookUrl,
      setupSteps: [
        "1. Create app at api.slack.com/apps",
        "2. Enable Event Subscriptions",
        "3. Set Request URL to: " + webhookUrl,
        "4. Subscribe to app_mention and message.im events",
        "5. Copy bot token and signing secret",
        "6. Paste credentials and save",
      ],
      config: [
        {
          key: "botToken",
          label: "Bot Token (xoxb-...)",
          type: "password",
          required: true,
        },
        {
          key: "signingSecret",
          label: "Signing Secret",
          type: "password",
          required: true,
        },
      ],
      status,
    },
    email: {
      platform: "email",
      webhookUrl,
      setupSteps: [
        "1. Set up SendGrid account",
        "2. Create API key",
        "3. Configure parse webhook",
        "4. Set webhook URL to: " + webhookUrl,
        "5. Configure email address",
        "6. Test by sending email",
      ],
      config: [
        {
          key: "email",
          label: "Email Address",
          type: "text",
          required: true,
        },
        {
          key: "sendgridKey",
          label: "SendGrid API Key",
          type: "password",
          required: true,
        },
      ],
      status,
    },
  };

  return (
    setupGuides[platform] || {
      platform,
      webhookUrl,
      setupSteps: [],
      config: [],
      status,
    }
  );
}
