import requests

url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
key = "REDACTED_SUPABASE_SERVICE_ROLE_KEY"

headers = {
    "apikey": key,
    "Authorization": "Bearer " + key,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

data = {
    "user_id": "f9a35823-2578-40ff-b477-bf8c58e97e03",
    "container_id": "openclaw-f9a35823-1777016614534",
    "model_id": "anthropic-claude-4.6-sonnet",
    "status": "running",
    "port": 9002,
    "ip_address": "http://64.23.142.154:9002",
}

r = requests.post(url + "/rest/v1/instances", headers=headers, json=data)
print("Status:", r.status_code)
print("Response:", r.text[:500])
