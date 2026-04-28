#!/usr/bin/env python3
import json, sys, os

config_path = "/root/.openclaw/.openclaw/openclaw.json"
port = os.environ.get("PORT", "9000")

with open(config_path) as f:
    c = json.load(f)

origins = c.setdefault("gateway", {}).setdefault("controlUi", {}).setdefault("allowedOrigins", [])
new_origins = [
    f"http://64.23.142.154:{port}",
    "https://laverdi.tech",
    "http://localhost:18789",
    "http://127.0.0.1:18789"
]
for o in new_origins:
    if o not in origins:
        origins.append(o)

with open(config_path, "w") as f:
    json.dump(c, f, indent=2)

print(f"Updated allowedOrigins: {origins}")
