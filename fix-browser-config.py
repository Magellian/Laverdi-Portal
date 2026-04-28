#!/usr/bin/env python3
"""Configure OpenClaw browser plugin to find Chromium with correct flags"""
import json, os, glob

# Fix all user configs
user_dir = "/var/lib/laverdi/users"
for uid in os.listdir(user_dir):
    config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")
    if not os.path.exists(config_path):
        continue
    
    with open(config_path) as f:
        c = json.load(f)
    
    # Add browser configuration
    c["browser"] = {
        "enabled": True,
        "headless": True,
        "profiles": {
            "openclaw": {
                "type": "cdp",
                "binary": "/usr/bin/chromium-browser",
                "args": [
                    "--no-sandbox",
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--disable-software-rasterizer",
                    "--headless"
                ]
            }
        }
    }
    
    # Make sure browser plugin is enabled
    c.setdefault("plugins", {}).setdefault("entries", {})
    c["plugins"]["entries"]["browser"] = {"enabled": True}
    
    with open(config_path, 'w') as f:
        json.dump(c, f, indent=2)
    
    print(f"✓ Updated config for user {uid[:12]}")

print("\nDone. Restart containers to pick up changes.")
