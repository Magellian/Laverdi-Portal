#!/usr/bin/env python3
"""Fix 1: Change default signup tier from 'starter' to 'trial' (Haiku)
   Fix 2: Update provision-async tier model map and default"""

# Fix create-profile.ts
path1 = '/root/laverdi-portal/pages/api/auth/create-profile.ts'
with open(path1, 'r') as f:
    content = f.read()

content = content.replace(
    "tier: 'starter',  // Trial users start on starter tier",
    "tier: 'trial',  // Trial users start on trial tier (Haiku 4.5)"
)

with open(path1, 'w') as f:
    f.write(content)
print("✓ create-profile.ts: tier changed to 'trial'")

# Fix provision-async.ts
path2 = '/root/laverdi-portal/pages/api/agents/provision-async.ts'
with open(path2, 'r') as f:
    content = f.read()

# Fix tier model map and default
content = content.replace(
    '''const tierModelMap: Record<string, string> = {
          free: "anthropic-claude-haiku-4.5",
          starter: "anthropic-claude-4.6-sonnet",
          professional: "anthropic-claude-opus-4.6",
        };
        const modelId = tierModelMap[tier || "starter"] || "anthropic-claude-4.6-sonnet";''',
    '''const tierModelMap: Record<string, string> = {
          free: "anthropic-claude-haiku-4.5",
          trial: "anthropic-claude-haiku-4.5",
          starter: "anthropic-claude-4.6-sonnet",
          professional: "anthropic-claude-opus-4.6",
        };
        const modelId = tierModelMap[tier || "trial"] || "anthropic-claude-haiku-4.5";'''
)

with open(path2, 'w') as f:
    f.write(content)
print("✓ provision-async.ts: added trial tier, default changed to trial/haiku")
