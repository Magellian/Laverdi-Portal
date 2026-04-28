#!/usr/bin/env python3
"""Fix the dashboard token meter to show correct daily token limits per tier"""

path = '/root/laverdi-portal/pages/dashboard/index.tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix 1: Update tier limits to match actual daily token caps
content = content.replace(
    """const TIER_CALL_LIMITS: Record<string, number> = {
  free: 100,
  trial: 500,
  starter: 5000,
  professional: 20000,
  enterprise: 100000,
}""",
    """// Daily token limits per tier (matches Command Center TIER_CONFIG)
const TIER_TOKEN_LIMITS: Record<string, number> = {
  free: 50000,        // 50K tokens/day
  trial: 50000,       // 50K tokens/day (Haiku 4.5)
  starter: 500000,    // 500K tokens/day (Sonnet 4.6)
  professional: 2000000, // 2M tokens/day (Opus 4.6)
  enterprise: 5000000,   // 5M tokens/day
}

// Friendly names for tier models
const TIER_MODEL_NAMES: Record<string, string> = {
  free: 'Haiku 4.5',
  trial: 'Haiku 4.5',
  starter: 'Sonnet 4.6',
  professional: 'Opus 4.6',
  enterprise: 'Opus 4.6',
}"""
)

# Fix 2: Update the usage calculation to use new constant name
content = content.replace(
    """const callLimit =
            activeUser.monthly_call_limit ??
            TIER_CALL_LIMITS[activeUser.tier] ??
            100""",
    """const callLimit =
            activeUser.monthly_call_limit ??
            TIER_TOKEN_LIMITS[activeUser.tier] ??
            50000"""
)

# Fix 3: Update the usage card header and labels
content = content.replace(
    '<h2 className="text-2xl font-bold mb-6">Token Usage</h2>',
    '<h2 className="text-2xl font-bold mb-6">Daily Token Usage</h2>'
)

content = content.replace(
    '<span className="text-gray-700 font-semibold">API Requests</span>',
    '<span className="text-gray-700 font-semibold">Tokens Used Today</span>'
)

# Fix 4: Change "monthly quota" to "daily allowance"
content = content.replace(
    """{Math.round(usagePercent)}% of monthly quota used""",
    """{Math.round(usagePercent)}% of daily token allowance used"""
)

# Fix 5: Update the limit warning messages
content = content.replace(
    'You are near your monthly limit.',
    'You are near your daily token limit.'
)

content = content.replace(
    'Approaching your monthly limit.',
    'Approaching your daily token limit.'
)

with open(path, 'w') as f:
    f.write(content)

print("✓ Dashboard token meter updated:")
print("  - Tier limits: free/trial=50K, starter=500K, pro=2M")
print("  - Labels: 'Daily Token Usage', 'Tokens Used Today'")
print("  - Added tier model name mapping")
