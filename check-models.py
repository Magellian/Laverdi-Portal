#!/usr/bin/env python3
import json, urllib.request, subprocess

# Get Anthropic key
result = subprocess.run(
    ["docker", "exec", "laverdi-command-center", "printenv", "ANTHROPIC_API_KEY"],
    capture_output=True, text=True
)
key = result.stdout.strip()

req = urllib.request.Request(
    "https://api.anthropic.com/v1/models",
    headers={
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
    }
)
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    models = [m["id"] for m in data.get("data", [])]
    print("Anthropic models available:")
    for m in sorted(models):
        if "haiku" in m.lower() or "sonnet" in m.lower() or "opus" in m.lower():
            print(f"  {m}")
except Exception as e:
    print(f"Error: {e}")
