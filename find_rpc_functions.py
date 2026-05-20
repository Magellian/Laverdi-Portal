import requests
import json

project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

headers = {
    "Authorization": f"Bearer {service_role_key}",
    "apikey": service_role_key,
    "Content-Type": "application/json"
}

print("[*] Attempting to discover RPC functions...")

# Try to get OpenAPI schema which lists all available endpoints including RPC
try:
    response = requests.get(
        f"{project_url}/rest/v1/?apikey={service_role_key}",
        headers=headers
    )
    
    print(f"[*] Schema endpoint status: {response.status_code}")
    
    if response.status_code == 200:
        schema = response.json()
        
        # Look for RPC endpoints
        if 'paths' in schema:
            rpc_endpoints = [p for p in schema['paths'].keys() if '/rpc/' in p]
            print(f"\n[+] Found {len(rpc_endpoints)} RPC functions:")
            for endpoint in sorted(rpc_endpoints):
                print(f"    - {endpoint}")
        
        # Try to extract more info
        print(f"\n[*] Schema info:")
        print(f"    - Has 'paths': {'paths' in schema}")
        print(f"    - Has 'definitions': {'definitions' in schema}")
        print(f"    - Has 'components': {'components' in schema}")
        
        # Save schema for inspection
        with open('C:\\Users\\chris\\.openclaw\\workspace\\openapi_schema.json', 'w') as f:
            json.dump(schema, f, indent=2)
        print(f"\n[+] Schema saved to openapi_schema.json")
        
    else:
        print(f"[-] Failed: {response.status_code}")
        print(f"    {response.text[:300]}")
        
except Exception as e:
    print(f"[-] Error: {e}")
    import traceback
    traceback.print_exc()

# Also try GraphQL introspection
print("\n" + "="*80)
print("[*] Attempting GraphQL introspection for functions...")

graphql_query = """
{
  __schema {
    mutationRoot: queryType {
      name
      fields {
        name
        description
      }
    }
  }
}
"""

try:
    response = requests.post(
        f"{project_url}/graphql/v1",
        headers=headers,
        json={"query": graphql_query}
    )
    
    print(f"[*] GraphQL status: {response.status_code}")
    if response.status_code < 400:
        print(f"    {response.text[:500]}")
        
except Exception as e:
    print(f"[!] GraphQL not available: {e}")
