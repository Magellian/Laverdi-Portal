#!/usr/bin/env python3
import requests
import json

test_cases = [
    {
        "name": "Telegram",
        "payload": {
            "userId": "test-user-123",
            "channels": {
                "telegram": {"botToken": "123456:INVALID_TEST"}
            }
        }
    },
    {
        "name": "Discord",
        "payload": {
            "userId": "test-user-123",
            "channels": {
                "discord": {"botToken": "INVALID_DISCORD_TOKEN"}
            }
        }
    },
    {
        "name": "Slack",
        "payload": {
            "userId": "test-user-123",
            "channels": {
                "slack": {
                    "botToken": "xoxb-INVALID",
                    "appToken": "xapp-INVALID"
                }
            }
        }
    },
    {
        "name": "Signal",
        "payload": {
            "userId": "test-user-123",
            "channels": {
                "signal": {"phoneNumber": "+1234567890"}
            }
        }
    }
]

headers = {
    "Authorization": "Bearer laverdi-admin-api-2026",
    "Content-Type": "application/json"
}

for test in test_cases:
    print(f"\n{'='*60}")
    print(f"Testing: {test['name']}")
    print(f"{'='*60}")
    
    resp = requests.post(
        'http://localhost:8000/api/configure-channels',
        json=test['payload'],
        headers=headers
    )
    print(f"Status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
