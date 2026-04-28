#!/usr/bin/env python3
import json

uid = "dbcc2f03-5da2-4072-ba0f-6324df14f4fd"
config_path = f"/var/lib/laverdi/users/{uid}/.openclaw/openclaw.json"

with open(config_path) as f:
    c = json.load(f)

# Add trusted proxies for nginx
c["gateway"]["trustedProxies"] = ["172.16.0.0/12", "10.0.0.0/8", "127.0.0.1"]

with open(config_path, 'w') as f:
    json.dump(c, f, indent=2)

print("Added trustedProxies to config")
print(f"Model: {c['agents']['defaults']['model']['primary']}")
