/**
 * pages/api/call.ts
 * Main API endpoint for making AI calls
 * 
 * Authenticates user, checks rate limits, routes to appropriate model
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  getPrimaryModel,
  getMonthlyCallLimit,
  type TierType,
} from "../../lib/models";
import { checkTrialStatus, formatTrialWarning } from "../../lib/trial-check";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type ResponseData = {
  success: boolean;
  data?: {
    result: string;
    model: string;
    tokensUsed: number;
  };
  error?: string;
  remaining?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { message, apiKey } = req.body;

  if (!message || !apiKey) {
    return res
      .status(400)
      .json({ success: false, error: "Missing message or apiKey" });
  }

  try {
    // 1. Validate API key and get user tier
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("user_id, tier")
      .eq("key", apiKey)
      .single();

    if (keyError || !keyData) {
      return res.status(401).json({ success: false, error: "Invalid API key" });
    }

    const userId = keyData.user_id;
    const tier = keyData.tier as TierType;

    // 1.5. Check trial status
    const trialCheck = await checkTrialStatus(userId, apiKey);
    if (!trialCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: `${trialCheck.reason === 'Trial expired' ? 'Your trial has ended. Upgrade to Starter to continue.' : 'Access denied'}`,
      });
    }

    // Add trial warning header if trial is expiring soon
    let warningHeader = '';
    if (trialCheck.reason === 'trial_active' && trialCheck.days_remaining !== undefined) {
      warningHeader = formatTrialWarning(trialCheck.days_remaining);
    }

    // 2. Check usage limits for this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("call_count")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString())
      .single();

    const callsUsedThisMonth = usageData?.call_count || 0;
    const callLimit = getMonthlyCallLimit(tier);

    if (callsUsedThisMonth >= callLimit) {
      return res.status(429).json({
        success: false,
        error: `Call limit reached. Upgrade to ${tier === "free" ? "Starter" : "Pro"} for more calls.`,
        remaining: 0,
      });
    }

    // 3. Route to appropriate model
    // Use deepseek-r1-distill-llama-70b for all tiers (updated model mapping)
    let primaryModel = "deepseek-r1-distill-llama-70b";

    let result: string;
    let modelUsed = primaryModel;
    let tokensUsed = 0;

    try {
      // Call DO Serverless Inference API
      const doGradientResponse = await fetch(
        "https://inference.do-ai.run/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.DO_GRADIENT_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: primaryModel,
            messages: [{ role: "user", content: message }],
            max_completion_tokens: 2048,
          }),
        }
      );

      if (!doGradientResponse.ok) {
        throw new Error(`DO Gradient API error: ${doGradientResponse.status}`);
      }

      const doData = await doGradientResponse.json();
      result = doData.choices[0].message.content;
      tokensUsed = (doData.usage?.prompt_tokens || 0) + (doData.usage?.completion_tokens || 0);
    } catch (error) {
      console.error("Model error:", error);
      throw error;
    }

    // 4. Log usage
    await supabase.from("usage_logs").insert({
      user_id: userId,
      call_count: 1,
      token_count: tokensUsed,
      created_at: new Date().toISOString(),
    });

    // 5. Return response
    return res.status(200).json({
      success: true,
      data: {
        result,
        model: modelUsed,
        tokensUsed,
      },
      remaining: callLimit - (callsUsedThisMonth + 1),
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
