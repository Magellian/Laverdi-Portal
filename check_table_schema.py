#!/usr/bin/env python3
import requests
import json

serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

headers = {
    "apikey": serviceKey,
    "Authorization": f"Bearer {serviceKey}",
    "Content-Type": "application/json"
}

# Try to query information_schema
resp = requests.get(
    "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/information_schema.columns?table_name=eq.channels",
    headers=headers
)

print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    cols = resp.json()
    print(f"Columns in 'channels' table:")
    for col in cols:
        print(f"  - {col.get('column_name')} ({col.get('data_type')})")
else:
    print(f"Error: {json.dumps(resp.json(), indent=2)}")

# Also try just listing with minimal payload
print("\nTrying simple insert with only user_id...")
resp2 = requests.post(
    "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/channels",
    headers=headers,
    json={"user_id": "test"}
)
print(f"Status: {resp2.status_code}")
print(f"Response: {json.dumps(resp2.json(), indent=2)}")
