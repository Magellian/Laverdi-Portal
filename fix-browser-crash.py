#!/usr/bin/env python3
"""Remove invalid browser config that crashes the gateway.
The browser plugin auto-detects Chromium via CHROME_BIN env var."""
import json, os

user_dir = "/var/lib/laverdi/users"
for uid in os.listdir(user_dir):
    config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")
    if not os.path.exists(config_path):
        continue
    
    with open(config_path) as f:
        c = json.load(f)
    
    # Remove the invalid browser config block
    if "browser" in c:
        del c["browser"]
        print(f"  Removed browser config from {uid[:12]}")
    
    with open(config_path, 'w') as f:
        json.dump(c, f, indent=2)

print("Done. Gateway will auto-detect Chromium via CHROME_BIN env var.")
