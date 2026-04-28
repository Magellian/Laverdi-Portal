import requests

url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
key = "REDACTED_SUPABASE_SERVICE_ROLE_KEY"

headers = {
    "apikey": key,
    "Authorization": "Bearer " + key,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# Update status to running
r = requests.patch(
    url + "/rest/v1/instances?user_id=eq.f9a35823-2578-40ff-b477-bf8c58e97e03",
    headers=headers,
    json={"status": "ready", "ip_address": "http://64.23.142.154:9002"}
)
print("Status:", r.status_code)
print("Response:", r.text[:300])
