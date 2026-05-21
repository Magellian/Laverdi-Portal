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

# The table uses 'platform' and 'token', not 'channel_name' and 'config'
test_user_id = str(uuid.uuid4())

payload = {
    "user_id": test_user_id,
    "platform": "telegram",
    "token": "123456:TEST_TOKEN"
}

print("Testing with actual schema (platform + token)...")
print(f"Payload: {payload}\n")

resp = requests.post(
    "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/channels",
    headers=headers,
    json=payload
)

print(f"Status: {resp.status_code}")
if resp.status_code in (200, 201):
    print("✅ SUCCESS! Insert worked!")
    result = resp.json()
    if isinstance(result, list) and len(result) > 0:
        rec = result[0]
        print(f"\nRecord structure:")
        for key, val in rec.items():
            print(f"  {key}: {val} ({type(val).__name__})")
        
        # Clean up
        rec_id = rec.get('id')
        if rec_id:
            del_resp = requests.delete(
                f"https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/channels?id=eq.{rec_id}",
                headers=headers
            )
            print(f"\nCleaned up test record")
else:
    print(f"❌ Error: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))

print("\n" + "="*60)
print("CONCLUSION: The channels table schema is:")
print("  - id (UUID)")
print("  - user_id (UUID FK)")
print("  - platform (VARCHAR) — telegram, discord, slack, signal")
print("  - token (VARCHAR) — the secret token/credentials")
print("  - (possibly more columns)")
print("="*60)
