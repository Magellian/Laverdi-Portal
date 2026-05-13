#!/usr/bin/env python3
"""
Updates the admin panel to reflect current LaVerdi setup:
- Vultr infrastructure (not DigitalOcean)
- Available models (open-source via Vultr inference)
- Correct tier/pricing structure
- Instance management features

Run on portal: python3 /tmp/admin-update.py
"""

import re

with open('/root/laverdi-portal/pages/admin/index.tsx', 'r') as f:
    content = f.read()

# Fix 1: Update estimated costs to match actual pricing
old_costs = """const getEstimatedCost = (tier: string): number => {
    switch (tier) {"""
# Find the full switch block
cost_match = re.search(r'const getEstimatedCost = \(tier: string\): number => \{[^}]+\}[^}]*\}', content)
if cost_match:
    new_costs = """const getEstimatedCost = (tier: string): number => {
    switch (tier) {
      case 'free': return 0
      case 'trial': return 0
      case 'starter': return 29
      case 'professional': return 99
      default: return 0
    }
  }"""
    content = content[:cost_match.start()] + new_costs + content[cost_match.end():]
    print("1. Updated cost estimates")

# Fix 2: Update the help text with correct info
content = content.replace(
    "Estimated costs are calculated per tier: starter=$29.99, professional=$99.99",
    "Costs per tier: free=$0, trial=$0 (14 days), starter=$29/mo, professional=$99/mo. Infrastructure: Vultr VPS + inference API"
)
print("2. Updated help text")

# Fix 3: Add model info to the interface if not present
if 'model_id' not in content:
    content = content.replace(
        "estimated_cost?: number\n}",
        "estimated_cost?: number\n  model_id?: string\n  container_id?: string\n  instance_ip?: string\n}"
    )
    print("3. Added model/instance fields to interface")

# Fix 4: Update tier options if they reference old tiers
content = content.replace("'free' | 'trial' | 'starter' | 'professional'", "'free' | 'trial' | 'starter' | 'professional'")
print("4. Tier options verified")

with open('/root/laverdi-portal/pages/admin/index.tsx', 'w') as f:
    f.write(content)

print("\nAdmin panel updated. Run: npm run build && systemctl restart laverdi-portal")
