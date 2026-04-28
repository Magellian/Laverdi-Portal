#!/usr/bin/env python3
import json, os

user_dir = "/var/lib/laverdi/users"
for uid in os.listdir(user_dir):
    config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")
    if not os.path.exists(config_path):
        print(f"No config for {uid[:12]}")
        continue
    with open(config_path) as f:
        c = json.load(f)
    plugins = c.get("plugins", {}).get("entries", {})
    model = c.get("agents", {}).get("defaults", {}).get("model", {}).get("primary", "?")
    print(f"User: {uid[:12]}")
    print(f"  Model: {model}")
    print(f"  Plugins:")
    for k, v in plugins.items():
        print(f"    {k}: enabled={v.get('enabled', 'default')}")
