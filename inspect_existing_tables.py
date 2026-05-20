import requests
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a2B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

headers = {
    "Authorization": f"Bearer {service_role_key}",
    "apikey": service_role_key,
    "Content-Type": "application/json"
}

print("[*] Inspecting existing 'channel_signal' table structure...")

try:
    # Try to get schema info for the existing table
    response = requests.get(
        f"{project_url}/rest/v1/channel_signal?limit=1",
        headers=headers
    )
    
    print(f"[*] Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("[+] Table exists and is accessible")
        
        # Get table structure from response headers
        # The table structure isn't in headers, but we can check the data
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            sample = data[0]
            print(f"[+] Sample row structure: {sample.keys()}")
        else:
            print("[*] Table is empty, but schema exists")
            
        # Also try to list all tables via OpenAPI schema
        schema_response = requests.get(
            f"{project_url}/rest/v1/?apikey={service_role_key}",
            headers=headers
        )
        if schema_response.status_code == 200:
            schema_data = schema_response.json()
            print(f"\n[*] Schema info available")
            if 'paths' in schema_data:
                tables = [p for p in schema_data['paths'].keys() if not p.startswith('/rpc')]
                print(f"[+] Available tables/endpoints ({len(tables)}):")
                for table in sorted(tables):
                    print(f"    - {table}")
            
    else:
        print(f"[-] Error: {response.status_code}")
        print(f"    {response.text[:200]}")
        
except Exception as e:
    print(f"[-] Error: {e}")
    import traceback
    traceback.print_exc()

print("\n[*] Checking for any database management endpoints...")

# Check for admin/management endpoints
test_endpoints = [
    "/rest/v1/",
    "/graphql/v1",
    "/auth/v1",
    "/storage/v1",
]

for endpoint in test_endpoints:
    try:
        response = requests.get(f"{project_url}{endpoint}", headers=headers, timeout=5)
        if response.status_code < 500:
            print(f"[+] {endpoint}: {response.status_code}")
    except:
        pass
