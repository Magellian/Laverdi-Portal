#!/usr/bin/env python3
import requests
import json

payload = {
    "userId": "test-user-123",
    "channels": {
        "telegram": {
            "botToken": "123456:INVALID_TEST_TOKEN"
        }
    }
}

headers = {
    "Authorization": "Bearer laverdi-admin-api-2026",
    "Content-Type": "application/json"
}

resp = requests.post('http://localhost:8000/api/configure-channels', json=payload, headers=headers)
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))
