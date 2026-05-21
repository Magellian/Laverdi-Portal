#!/usr/bin/env python3
import requests
import json
import uuid

serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

headers = {
    "apikey": serviceKey,
    "Authorization": f"Bearer {serviceKey}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Test different field combinations
test_user_id = str(uuid.uuid4())

tests = [
    {"user_id": test_user_id},
    {"user_id": test_user_id, "enabled": True},
    {"user_id": test_user_id, "config": {"test": "value"}},
    {"user_id": test_user_id, "platform": "telegram"},  # Maybe it uses 'platform' instead of 'channel_name'
]

for i, payload in enumerate(tests):
    print(f"\nTest {i+1}: {list(payload.keys())}")
    resp = requests.post(
        "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/channels",
        headers=headers,
        json=payload
    )
    print(f"  Status: {resp.status_code}")
    if resp.status_code in (200, 201):
        print(f"  ✅ SUCCESS! Inserted record")
        result = resp.json()
        if isinstance(result, list) and len(result) > 0:
            print(f"  Record has columns: {list(result[0].keys())}")
            # Try to delete it
            rec_id = result[0].get('id')
            if rec_id:
                del_resp = requests.delete(
                    f"https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/channels?id=eq.{rec_id}",
                    headers=headers
                )
                print(f"  Cleaned up test record")
    else:
        error = resp.json()
        print(f"  ❌ Error: {error.get('message', error)}")
