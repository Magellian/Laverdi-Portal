/**
 * pages/api/usage/stats.ts
 * Get user's monthly credit usage and breakdown by model
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Credit cost per model (you can adjust these)
// Import DO Gradient pricing
import { getTierConfig, calculateCredits } from "../../../lib/do-gradient-pricing";

interface UsageStats {
  tier: string;
  monthlyCredits: number;
  creditsUsed: number;
  creditsRemaining: number;
  percentageUsed: number;
  resetDate: string;
  modelUsage: Array<{
    model: string;
    creditsUsed: number;
    callCount: number;
  }>;
}

type ResponseData = {
  success: boolean;
  data?: UsageStats;
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
    // Get user tier and shared credit pool stats
    const { data: creditData, error: creditError } = await supabase
      .from("user_shared_credit_pool")
      .select(
        "tier, monthly_limit, credits_used, credits_remaining, agent_count, reset_date"
      )
      .eq("user_id", userId)
      .single();

    if (creditError && creditError.code !== "PGRST116") {
      throw creditError;
    }

    const tier = creditData?.tier || "free";
    const tierConfig = getTierConfig(tier);
    const monthlyCredits = creditData?.monthly_limit || tierConfig.monthlyCredits;

    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data: usageData } = await supabase
      .from("usage_logs")
      .select("model, token_count, created_at")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", now.toISOString());

    // Calculate credits used by model using DO Gradient pricing
    const modelUsageMap: Record<
      string,
      { creditsUsed: number; callCount: number }
    > = {};
    let totalCreditsUsed = 0;

    (usageData || []).forEach((log: any) => {
      const model = log.model || "unknown";
      const tokenCount = log.token_count || 0;
      const creditsUsed = calculateCredits(model, tokenCount, tier);

      if (!modelUsageMap[model]) {
        modelUsageMap[model] = { creditsUsed: 0, callCount: 0 };
      }

      modelUsageMap[model].creditsUsed += creditsUsed;
      modelUsageMap[model].callCount += 1;
      totalCreditsUsed += creditsUsed;
    });

    const modelUsage = Object.entries(modelUsageMap).map(([model, usage]) => ({
      model,
      creditsUsed: usage.creditsUsed,
      callCount: usage.callCount,
    }));

    const creditsRemaining = Math.max(0, monthlyCredits - totalCreditsUsed);
    const percentageUsed =
      monthlyCredits > 0 ? (totalCreditsUsed / monthlyCredits) * 100 : 0;

    const stats: UsageStats = {
      tier,
      monthlyCredits,
      creditsUsed: totalCreditsUsed,
      creditsRemaining,
      percentageUsed,
      resetDate: resetDate.toISOString(),
      modelUsage: modelUsage.sort(
        (a, b) => b.creditsUsed - a.creditsUsed
      ),
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching usage stats:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch usage statistics",
    });
  }
}
