#!/usr/bin/env python3
import json, os, subprocess

USER_ID_PREFIX = "0ee506e0"
BOT_TOKEN = "8142302245:AAFsGmW9aEuwa1Or44rvYYIJcjdF895Cj50"

user_dir = "/var/lib/laverdi/users"
uid = next(u for u in os.listdir(user_dir) if u.startswith(USER_ID_PREFIX))
config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")

with open(config_path) as f:
    c = json.load(f)

# Fix Telegram config with correct schema values
c["channels"]["telegram"] = {
    "token": BOT_TOKEN,
    "dmPolicy": "pairing",
    "groupPolicy": "disabled"
}

with open(config_path, 'w') as f:
    json.dump(c, f, indent=2)

print(f"✓ Fixed Telegram config for {uid[:12]}")

result = subprocess.run(
    ["docker", "ps", "--filter", f"label=laverdi.user_id={uid}", "--format", "{{.Names}}"],
    capture_output=True, text=True
)
container = result.stdout.strip()
if container:
    subprocess.run(["docker", "restart", container])
    print(f"✓ Restarted {container}")
