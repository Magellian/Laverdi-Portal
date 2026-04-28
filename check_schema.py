import requests

url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
key = "REDACTED_SUPABASE_SERVICE_ROLE_KEY"

headers = {
    "apikey": key,
    "Authorization": "Bearer " + key,
}

# Check instances table columns
r = requests.get(url + "/rest/v1/instances?select=*&limit=1", headers=headers)
print("Status:", r.status_code)
print("Response:", r.text[:500])

# Also try to get column info via RPC
r2 = requests.get(url + "/rest/v1/instances?select=*&limit=0", headers=headers)
print("\nHeaders:", dict(r2.headers).get("Content-Range", "none"))
print("Empty response:", r2.text[:200])
