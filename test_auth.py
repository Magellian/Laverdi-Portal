import requests

project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"

# From the original task specification
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

print(f"[*] Service role key length: {len(service_role_key)}")
print(f"[*] First 50 chars: {service_role_key[:50]}")
print(f"[*] Last 50 chars: {service_role_key[-50:]}")

# Verify JWT structure
parts = service_role_key.split('.')
print(f"[*] JWT parts: {len(parts)}")

if len(parts) == 3:
    print(f"[+] Valid JWT structure")

headers = {
    "Authorization": f"Bearer {service_role_key}",
    "apikey": service_role_key,
    "Content-Type": "application/json"
}

print("\n[*] Testing authentication...")

try:
    response = requests.get(
        f"{project_url}/rest/v1/channels?limit=0",
        headers=headers
    )
    print(f"[*] Status: {response.status_code}")
    print(f"[*] Response: {response.text[:300]}")
except Exception as e:
    print(f"[-] Error: {e}")
