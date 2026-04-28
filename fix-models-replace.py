#!/usr/bin/env python3
"""Set models.mode to 'replace' to prevent slow external model lookups"""
import json, os

user_dir = "/var/lib/laverdi/users"
for uid in os.listdir(user_dir):
    config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")
    if not os.path.exists(config_path):
        continue
    with open(config_path) as f:
        c = json.load(f)

    c.setdefault("models", {})["mode"] = "replace"
    
    with open(config_path, 'w') as f:
        json.dump(c, f, indent=2)
    print(f"  Set models.mode=replace for {uid[:12]}")

print("Done. Restart containers.")
