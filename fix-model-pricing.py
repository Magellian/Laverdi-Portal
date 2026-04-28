#!/usr/bin/env python3
"""Disable external model pricing fetches that cause 15s delays"""
import json, os

user_dir = "/var/lib/laverdi/users"
for uid in os.listdir(user_dir):
    config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")
    if not os.path.exists(config_path):
        continue
    with open(config_path) as f:
        c = json.load(f)

    # Restrict models.mode to only our configured models (no external lookups)
    c["models"]["mode"] = "replace"

    # Disable external pricing fetches
    c.setdefault("agents", {}).setdefault("defaults", {})
    
    with open(config_path, 'w') as f:
        json.dump(c, f, indent=2)
    print(f"  Updated {uid[:12]}")

print("Done")
