/**
 * pages/api/models/available.ts
 * List available models for user's tier
 * GET /api/models/available
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { getTierConfig } from "../../../lib/do-gradient-pricing";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  costPerMTok: number;
  maxContextTokens: number;
  maxOutputTokens: number;
}

interface Response {
  success: boolean;
  data?: {
    tier: string;
    monthlyCredits: number;
    models: ModelOption[];
    defaultModel: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
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
    const tierConfig = getTierConfig(tier);

    const models: ModelOption[] = tierConfig.models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      costPerMTok: m.costPerMTok,
      maxContextTokens: m.maxContextTokens,
      maxOutputTokens: m.maxOutputTokens,
    }));

    return res.status(200).json({
      success: true,
      data: {
        tier,
        monthlyCredits: tierConfig.monthlyCredits,
        models,
        defaultModel: tierConfig.models[0]?.id || "anthropic-haiku-4.5",
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching models:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch available models",
    });
  }
}
