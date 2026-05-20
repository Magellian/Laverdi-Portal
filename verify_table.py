import requests
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

headers = {
    "Authorization": f"Bearer {service_role_key}",
    "apikey": service_role_key,
    "Content-Type": "application/json"
}

print("[*] Attempting to check if 'channels' table exists...")

try:
    # Try direct endpoint
    response = requests.get(
        f"{project_url}/rest/v1/channels?limit=0",
        headers=headers
    )
    
    print(f"[*] Status Code: {response.status_code}")
    print(f"[*] Response: {response.text[:200]}")
    
    if response.status_code == 200:
        print("\n[SUCCESS] Table 'channels' already exists!")
        print("[+] Can read from channels table")
    elif response.status_code == 404:
        print("\n[*] Table does not exist (404)")
        print("[-] Need to create it")
    elif response.status_code == 401 or response.status_code == 403:
        print("\n[-] Authentication/Permission error")
    else:
        print(f"\n[!] Unexpected status: {response.status_code}")
        
except Exception as e:
    print(f"[-] Error: {e}")

# Also try to see if we can create the table via insert
print("\n[*] Alternative: Try creating via POST (if table doesn't exist)...")

# This won't work either, but let's document the limitation
print("[!] REST API POST for new tables requires table to exist first")
print("[!] Cannot use REST API to CREATE tables - only to manipulate data")

print("\n" + "="*80)
print("[SUMMARY OF FINDINGS]")
print("="*80)
print("""
The Supabase REST API has fundamental limitations:
1. No raw SQL execution endpoint
2. Cannot CREATE tables via REST API
3. Can only SELECT/INSERT/UPDATE/DELETE on existing tables
4. RPC calls require pre-existing stored functions

To create the channels table, we need ONE of:
- Direct psql connection with postgres password
- Supabase CLI login + supabase link (requires SUPABASE_ACCESS_TOKEN)
- Manual creation via Supabase dashboard SQL Editor
- A pre-existing RPC function for schema management

The service role JWT key we have is for:
- Reading/writing data via REST API (only)
- NOT for schema management or raw SQL execution
""")
