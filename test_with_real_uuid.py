#!/usr/bin/env python3
import requests
import json
import uuid

# Use your real user ID (from the database earlier)
real_user_id = "4593b36f-90c6-44a2-93d1-ba8e8be52a1c"  # chrislaverdiere@gmail.com

test_cases = [
    {
        "name": "Telegram",
        "payload": {
            "userId": real_user_id,
            "channels": {
                "telegram": {"botToken": "123456:INVALID_TEST"}
            }
        }
    },
    {
        "name": "Discord",
        "payload": {
            "userId": real_user_id,
            "channels": {
                "discord": {"botToken": "INVALID_DISCORD_TOKEN"}
            }
        }
    },
    {
        "name": "Slack",
        "payload": {
            "userId": real_user_id,
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
            "userId": real_user_id,
            "channels": {
                "signal": {"phoneNumber": "+12025551234"}
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
