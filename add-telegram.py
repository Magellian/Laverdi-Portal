#!/usr/bin/env python3
"""Add Telegram channel config to a user's OpenClaw instance"""
import json, os, subprocess

# Find user config by user ID prefix
USER_ID_PREFIX = "0ee506e0"
BOT_TOKEN = "8142302245:AAFsGmW9aEuwa1Or44rvYYIJcjdF895Cj50"

user_dir = "/var/lib/laverdi/users"
uid = None
for u in os.listdir(user_dir):
    if u.startswith(USER_ID_PREFIX):
        uid = u
        break

if not uid:
    print(f"User {USER_ID_PREFIX} not found")
    exit(1)

config_path = os.path.join(user_dir, uid, ".openclaw", "openclaw.json")
with open(config_path) as f:
    c = json.load(f)

# Add Telegram channel config
c.setdefault("channels", {})["telegram"] = {
    "token": BOT_TOKEN,
    "dmPolicy": "pairing",
    "groupPolicy": "closed"
}

with open(config_path, 'w') as f:
    json.dump(c, f, indent=2)

print(f"✓ Telegram configured for user {uid[:12]}")
print(f"  Bot token: {BOT_TOKEN[:20]}...")
print(f"  DM policy: pairing")
print(f"  Restarting container...")

# Find and restart the container
result = subprocess.run(
    ["docker", "ps", "--filter", f"label=laverdi.user_id={uid}", "--format", "{{.Names}}"],
    capture_output=True, text=True
)
container = result.stdout.strip()
if container:
    subprocess.run(["docker", "restart", container])
    print(f"✓ Restarted {container}")
else:
    print("No running container found - config saved, restart manually")
