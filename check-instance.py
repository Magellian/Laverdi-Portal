#!/usr/bin/env python3
import json, os, subprocess

uid = "dbcc2f03-5da2-4072-ba0f-6324df14f4fd"
config_path = f"/var/lib/laverdi/users/{uid}/.openclaw/openclaw.json"

with open(config_path) as f:
    c = json.load(f)

print(f"Primary model: {c['agents']['defaults']['model']['primary']}")
print(f"Fallbacks: {c['agents']['defaults']['model'].get('fallbacks', [])}")
print(f"Bind: {c['gateway']['bind']}")
plugins = c.get('plugins', {}).get('entries', {})
print(f"Plugins: {list(plugins.keys())}")
for p, v in plugins.items():
    print(f"  {p}: enabled={v.get('enabled', 'default')}")

# Check container logs for errors
container = "openclaw-dbcc2f03-1777311546887"
print(f"\n--- Last 15 log lines ---")
os.system(f"docker logs {container} --tail 15 2>&1")
