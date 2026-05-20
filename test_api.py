#!/usr/bin/env python3
"""Test the /api/configure-channels endpoint"""

import requests
import json

url = "http://laverdi-command-center:8000/api/configure-channels"
headers = {
    "Authorization": "Bearer laverdi-admin-api-2026",
    "Content-Type": "application/json"
}

payload = {
    "userId": "test-user-123",
    "channels": {
        "telegram": {
            "botToken": "123456:INVALID_TOKEN_FOR_TESTING"
        }
    }
}

print("Sending request...")
print(json.dumps(payload, indent=2))

try:
    resp = requests.post(url, json=payload, headers=headers, timeout=10)
    print(f"\nResponse Status: {resp.status_code}")
    print(f"Response Body:")
    print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print(f"ERROR: {e}")
