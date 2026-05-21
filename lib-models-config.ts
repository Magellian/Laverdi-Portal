// lib/models.ts
// Model configuration by user tier
// Deployed: 2026-05-20

export interface ModelConfig {
  model: string | null;
  maxTokens: number | null;
  rateLimitPerMonth: number | null;
  displayName: string;
  comingSoon?: boolean;
  costPer1M?: number;
}

export const MODEL_CONFIG: Record<string, ModelConfig> = {
  trial: {
    model: 'deepseek-v3',
    maxTokens: 1000,
    rateLimitPerMonth: 1000,
    displayName: 'DeepSeek V3',
    costPer1M: 0.275,
  },
  starter: {
    model: 'deepseek-v3',
    maxTokens: 2000,
    rateLimitPerMonth: 10000,
    displayName: 'DeepSeek V3',
    costPer1M: 0.275,
  },
  professional: {
    model: 'deepseek-r1-distill-llama-70b',
    maxTokens: 4000,
    rateLimitPerMonth: 50000,
    displayName: 'DeepSeek R1 (Reasoning)',
    costPer1M: 1.0,
  },
  agency: {
    model: 'qwen2.5-72b-instruct',
    maxTokens: 4000,
    rateLimitPerMonth: 100000,
    displayName: 'Qwen 2.5-72B (Advanced)',
    costPer1M: 0.5,
  },
  enterprise: {
    model: null,
    maxTokens: null,
    rateLimitPerMonth: null,
    displayName: 'Enterprise (Coming Soon)',
    comingSoon: true,
    costPer1M: 3.0, // Placeholder for when available
  },
};

/**
 * Get model configuration for a specific tier
 * @param userTier - User's subscription tier
 * @returns Model configuration object
 */
export function getModelConfig(userTier: string): ModelConfig {
  return MODEL_CONFIG[userTier?.toLowerCase()] || MODEL_CONFIG.trial;
}

/**
 * Get model name for API calls
 * @param userTier - User's subscription tier
 * @returns Model name string, or null if coming soon
 * @throws Error if tier is enterprise (coming soon)
 */
export function getModelForTier(userTier: string): string {
  const config = getModelConfig(userTier);

  if (config.comingSoon) {
    throw new Error(
      `${config.displayName} is not yet available. ` +
      `Please contact support or upgrade to Agency tier.`
    );
  }

  if (!config.model) {
    throw new Error(`No model configured for tier: ${userTier}`);
  }

  return config.model;
}

/**
 * Get display-friendly tier information
 */
export function getTierInfo(userTier: string) {
  const config = getModelConfig(userTier);
  return {
    tier: userTier?.toLowerCase() || 'trial',
    model: config.displayName,
    maxTokens: config.maxTokens,
    maxRequestsPerMonth: config.rateLimitPerMonth,
    isComingSoon: config.comingSoon || false,
  };
}

/**
 * Calculate cost for a request
 * @param tier - User's subscription tier
 * @param tokensUsed - Number of tokens used
 * @returns Cost in USD
 */
export function calculateRequestCost(tier: string, tokensUsed: number): number {
  const config = getModelConfig(tier);
  if (!config.costPer1M) return 0;
  return (tokensUsed / 1_000_000) * config.costPer1M;
}

/**
 * Get all tiers with their configurations (for UI display)
 */
export function getAllTiers() {
  return Object.entries(MODEL_CONFIG).map(([tier, config]) => ({
    id: tier,
    ...config,
  }));
}
