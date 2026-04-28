#!/usr/bin/env python3
"""Fix model IDs in user config and Command Center to use correct Anthropic model names"""
import json, os

# Correct model ID mapping
MODEL_FIXES = {
    "anthropic/claude-haiku-4.5": "anthropic/claude-haiku-4-5-20251001",
    "claude-haiku-4.5": "claude-haiku-4-5-20251001",
}

# Fix all user configs
user_dir = "/var/lib/laverdi/users"
for uid in os.listdir(user_dir):
    config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")
    if not os.path.exists(config_path):
        continue
    
    with open(config_path) as f:
        raw = f.read()
    
    changed = False
    for old, new in MODEL_FIXES.items():
        if old in raw:
            raw = raw.replace(old, new)
            changed = True
    
    if changed:
        with open(config_path, 'w') as f:
            f.write(raw)
        print(f"  Fixed model IDs for user {uid[:12]}")

print("\nDone. Restart containers to pick up changes.")
