#!/usr/bin/env python3
import json

uid = "dbcc2f03-5da2-4072-ba0f-6324df14f4fd"
config_path = f"/var/lib/laverdi/users/{uid}/.openclaw/openclaw.json"

with open(config_path) as f:
    c = json.load(f)

entries = c.setdefault('plugins', {}).setdefault('entries', {})
entries['acpx'] = {'enabled': False}
entries['bluebubbles'] = {'enabled': False}

with open(config_path, 'w') as f:
    json.dump(c, f, indent=2)

print("Disabled acpx and bluebubbles")
print(f"Active plugins will be: browser, device-pair, talk-voice")
