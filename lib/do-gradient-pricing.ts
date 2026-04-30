/**
 * lib/do-gradient-pricing.ts
 * DigitalOcean Gradient AI Platform pricing & model access
 * 
 * We resell DO Gradient models with markup
 * Tier determines which models + monthly credit allocation
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  costPerMTok: number; // Cost per million tokens (DO pricing)
  ourMarkup: number; // Multiplier (e.g., 3.5x)
  maxContextTokens: number;
  maxOutputTokens: number;
}

export interface TierConfig {
  tier: string;
  monthlyCredits: number;
  models: ModelInfo[];
  dropletSize: string;
  maxAgents: number;
  description: string;
}

// DigitalOcean Gradient pricing (as of 2026-04-16)
// Source: https://docs.digitalocean.com/products/gradient-ai-platform/details/pricing/
const DO_PRICING = {
  // Anthropic models (via DO Gradient)
  "anthropic-haiku-4.5": { costPerMTok: 0.08, name: "Claude Haiku 4.5" },
  "anthropic-sonnet-4.6": { costPerMTok: 0.30, name: "Claude Sonnet 4.6" },
  "anthropic-opus-4.6": { costPerMTok: 3.0, name: "Claude Opus 4.6" },
  "anthropic-opus-4.7": { costPerMTok: 3.0, name: "Claude Opus 4.7" },
  
  // OpenAI models (via DO Gradient)
  "openai-gpt-5.4": { costPerMTok: 0.40, name: "GPT-5.4" },
  "openai-gpt-5.4-mini": { costPerMTok: 0.15, name: "GPT-5.4 Mini" },
  "openai-gpt-4o": { costPerMTok: 0.15, name: "GPT-4o" },
  "openai-gpt-4o-mini": { costPerMTok: 0.05, name: "GPT-4o Mini" },
  
  // Google models (via DO Gradient)
  "google-gemini-2.0-pro": { costPerMTok: 0.20, name: "Gemini 2.0 Pro" },
  "google-gemini-2.0-flash": { costPerMTok: 0.10, name: "Gemini 2.0 Flash" },
  
  // Open source (via DO Gradient)
  "meta-llama-3.3-70b": { costPerMTok: 0.09, name: "Llama 3.3 70B" },
  "deepseek-r1-distill-llama-70b": { costPerMTok: 0.05, name: "DeepSeek R1 Distill" },
};

// Our markup: we charge users 3-4x DO's cost for margin
const OUR_MARKUP = 3.5;

/**
 * Get models available for a tier
 */
export const TIER_MODELS: Record<string, TierConfig> = {
  free: {
    tier: "free",
    monthlyCredits: 100,
    dropletSize: "s-1vcpu-2gb",
    maxAgents: 1,
    description: "Get started with basic AI",
    models: [
      {
        id: "deepseek-r1-distill-llama-70b",
        name: "DeepSeek R1 Distill",
        provider: "DeepSeek",
        costPerMTok: DO_PRICING["deepseek-r1-distill-llama-70b"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 32768,
        maxOutputTokens: 4096,
      },
    ],
  },
  
  starter: {
    tier: "starter",
    monthlyCredits: 1000,
    dropletSize: "s-1vcpu-2gb",
    maxAgents: 3,
    description: "Build production agents",
    models: [
      {
        id: "anthropic-haiku-4.5",
        name: "Claude Haiku 4.5",
        provider: "Anthropic",
        costPerMTok: DO_PRICING["anthropic-haiku-4.5"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 200000,
        maxOutputTokens: 64000,
      },
      {
        id: "anthropic-sonnet-4.6",
        name: "Claude Sonnet 4.6",
        provider: "Anthropic",
        costPerMTok: DO_PRICING["anthropic-sonnet-4.6"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 64000,
      },
      {
        id: "openai-gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        costPerMTok: DO_PRICING["openai-gpt-4o-mini"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 128000,
        maxOutputTokens: 4096,
      },
      {
        id: "google-gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        provider: "Google",
        costPerMTok: DO_PRICING["google-gemini-2.0-flash"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 4096,
      },
    ],
  },
  
  pro: {
    tier: "pro",
    monthlyCredits: 5000,
    dropletSize: "s-2vcpu-4gb",
    maxAgents: 10,
    description: "Enterprise AI automation",
    models: [
      // All Haiku variants
      {
        id: "anthropic-haiku-4.5",
        name: "Claude Haiku 4.5",
        provider: "Anthropic",
        costPerMTok: DO_PRICING["anthropic-haiku-4.5"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 200000,
        maxOutputTokens: 64000,
      },
      // All Sonnet variants
      {
        id: "anthropic-sonnet-4.6",
        name: "Claude Sonnet 4.6",
        provider: "Anthropic",
        costPerMTok: DO_PRICING["anthropic-sonnet-4.6"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 64000,
      },
      {
        id: "anthropic-sonnet-4.5",
        name: "Claude Sonnet 4.5",
        provider: "Anthropic",
        costPerMTok: DO_PRICING["anthropic-sonnet-4.6"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 64000,
      },
      // All Opus variants
      {
        id: "anthropic-opus-4.7",
        name: "Claude Opus 4.7",
        provider: "Anthropic",
        costPerMTok: DO_PRICING["anthropic-opus-4.7"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 128000,
      },
      {
        id: "anthropic-opus-4.6",
        name: "Claude Opus 4.6",
        provider: "Anthropic",
        costPerMTok: DO_PRICING["anthropic-opus-4.6"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 128000,
      },
      // OpenAI models
      {
        id: "openai-gpt-5.4",
        name: "GPT-5.4",
        provider: "OpenAI",
        costPerMTok: DO_PRICING["openai-gpt-5.4"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 128000,
      },
      {
        id: "openai-gpt-4o",
        name: "GPT-4o",
        provider: "OpenAI",
        costPerMTok: DO_PRICING["openai-gpt-4o"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 128000,
        maxOutputTokens: 4096,
      },
      // Google models
      {
        id: "google-gemini-2.0-pro",
        name: "Gemini 2.0 Pro",
        provider: "Google",
        costPerMTok: DO_PRICING["google-gemini-2.0-pro"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 4096,
      },
      {
        id: "google-gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        provider: "Google",
        costPerMTok: DO_PRICING["google-gemini-2.0-flash"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 1000000,
        maxOutputTokens: 4096,
      },
      // Open source
      {
        id: "meta-llama-3.3-70b",
        name: "Llama 3.3 70B",
        provider: "Meta",
        costPerMTok: DO_PRICING["meta-llama-3.3-70b"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 8000,
        maxOutputTokens: 2048,
      },
      {
        id: "deepseek-r1-distill-llama-70b",
        name: "DeepSeek R1 Distill",
        provider: "DeepSeek",
        costPerMTok: DO_PRICING["deepseek-r1-distill-llama-70b"].costPerMTok * OUR_MARKUP,
        ourMarkup: OUR_MARKUP,
        maxContextTokens: 32768,
        maxOutputTokens: 4096,
      },
    ],
  },
};

/**
 * Get tier config
 */
export function getTierConfig(tier: string): TierConfig {
  return TIER_MODELS[tier] || TIER_MODELS.free;
}

/**
 * Calculate credit cost for a model call
 * credits = (tokens * costPerMTok) / 1,000,000
 */
export function calculateCredits(
  modelId: string,
  tokenCount: number,
  tier: string
): number {
  const tierConfig = getTierConfig(tier);
  const model = tierConfig.models.find((m) => m.id === modelId);
  
  if (!model) {
    console.warn(`Model ${modelId} not available in ${tier} tier, defaulting to 0.001`);
    return (tokenCount * 0.001) / 1000000;
  }
  
  return (tokenCount * model.costPerMTok) / 1000000;
}

/**
 * Check if model is available in tier
 */
export function isModelAvailable(modelId: string, tier: string): boolean {
  const tierConfig = getTierConfig(tier);
  return tierConfig.models.some((m) => m.id === modelId);
}

/**
 * Get default model for tier
 */
export function getDefaultModel(tier: string): string {
  const tierConfig = getTierConfig(tier);
  return tierConfig.models[0]?.id || "anthropic-haiku-4.5";
}

/**
 * Get models by provider
 */
export function getModelsByProvider(tier: string, provider: string): ModelInfo[] {
  const tierConfig = getTierConfig(tier);
  return tierConfig.models.filter((m) => m.provider === provider);
}
