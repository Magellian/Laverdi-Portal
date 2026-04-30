/**
 * lib/models.ts
 * Model configuration for Laverdi Portal tiers
 * Uses DigitalOcean Gradient AI Platform models via serverless inference
 * 
 * Models available per tier - users select from available options
 * Credit cost calculated based on actual token usage + our 3.5x markup
 */

import { getTierConfig as getTierConfigFromPricing } from "./do-gradient-pricing";

export type TierType = "free" | "starter" | "pro";

export function getModelsForTier(tier: string) {
  const config = getTierConfigFromPricing(tier);
  return {
    tier,
    monthlyCredits: config.monthlyCredits,
    models: config.models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      costPerMTok: m.costPerMTok,
    })),
    defaultModel: config.models[0]?.id || "anthropic-haiku-4.5",
  };
}

export const getTierConfig = (tier: TierType) => {
  return getTierConfigFromPricing(tier);
};

export const getPrimaryModel = (tier: TierType): string => {
  return getTierConfig(tier).models[0]?.id || "anthropic-haiku-4.5";
};

export const getMonthlyCallLimit = (tier: TierType): number => {
  return getTierConfig(tier).monthlyCredits;
};
