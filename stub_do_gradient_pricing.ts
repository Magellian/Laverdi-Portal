// STUB: do-gradient-pricing.ts
// Placeholder while transitioning to Vultr-only infrastructure
// TODO: Remove this file after updating imports in:
//   - pages/api/models/available.ts
//   - pages/api/usage/stats.ts

export function getTierConfig(tier: string) {
  return {
    free: { maxInstances: 1, monthlyCredits: 50000 },
    starter: { maxInstances: 3, monthlyCredits: 500000 },
    pro: { maxInstances: 10, monthlyCredits: 2000000 }
  }[tier] || { maxInstances: 1, monthlyCredits: 50000 };
}

export function calculateCredits(model: string, tokens: number): number {
  // Stub implementation - returns approximate credits
  const costPerMToken = { 'claude-haiku': 0.08, 'claude-sonnet': 3, 'claude-opus': 15 }[model] || 1;
  return (tokens / 1000000) * costPerMToken;
}
