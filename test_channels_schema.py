#!/usr/bin/env python3
import requests
import json

serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

headers = {
    "apikey": serviceKey,
    "Authorization": f"Bearer {serviceKey}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Try to insert a record
payload = {
    "user_id": "test-user-123",
    "channel_name": "telegram",
    "enabled": True,
    "config": {"token": "test"},
    "connected": True
}

print("Testing insert with full payload...")
resp = requests.post(
    "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/channels",
    headers=headers,
    json=payload
)

print(f"Status: {resp.status_code}")
print(f"Response: {json.dumps(resp.json(), indent=2)}")
