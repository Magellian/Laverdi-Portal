#!/usr/bin/env python3
"""Approve Telegram pairing via the gateway WebSocket API"""
import json, subprocess, urllib.request

# Get gateway token from config
uid = "0ee506e0-82df-464c-8909-47c4333f4f95"
config_path = f"/var/lib/laverdi/users/{uid}/.openclaw/openclaw.json"

with open(config_path) as f:
    c = json.load(f)

token = c["gateway"]["auth"]["token"]
port = 9000
code = "CJZZETK9"

# Use openclaw CLI with gateway URL
result = subprocess.run(
    ["docker", "exec", "openclaw-0ee506e0-1777330808209",
     "openclaw", "pairing", "list", "telegram",
     "--url", f"ws://127.0.0.1:18789",
     "--token", token],
    capture_output=True, text=True, timeout=10
)
print("LIST stdout:", result.stdout)
print("LIST stderr:", result.stderr)

result2 = subprocess.run(
    ["docker", "exec", "openclaw-0ee506e0-1777330808209",
     "openclaw", "pairing", "approve", "telegram", code,
     "--url", f"ws://127.0.0.1:18789",
     "--token", token],
    capture_output=True, text=True, timeout=10
)
print("APPROVE stdout:", result2.stdout)
print("APPROVE stderr:", result2.stderr)
print(f"Exit code: {result2.returncode}")
