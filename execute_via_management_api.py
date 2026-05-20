import requests
import json

# Supabase credentials
project_ref = "dcvrkpgvxqdcboostkpz"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

# Read SQL from file
with open('C:\\Users\\chris\\.openclaw\\workspace\\migration.sql', 'r') as f:
    sql = f.read()

# Supabase Management API endpoint for database queries
# Note: The Management API uses a different endpoint and requires an access token
# We'll need to use the REST API with a workaround

print("[*] Testing Supabase API endpoints...")

# Try using the Supabase JS/Python SDK approach:
# Create a temporary RPC function that executes SQL
# But first, let's check what tables/functions already exist

headers = {
    "Authorization": f"Bearer {service_role_key}",
    "apikey": service_role_key,
    "Content-Type": "application/json"
}

project_url = f"https://{project_ref}.supabase.co"

# Check if we can query information schema
print("\n[*] Checking existing schema...")
try:
    # Try to list tables
    response = requests.get(
        f"{project_url}/rest/v1/information_schema.tables?table_schema=eq.public",
        headers=headers
    )
    print(f"[*] GET tables: {response.status_code}")
    if response.status_code == 200:
        tables = response.json()
        print(f"[+] Found {len(tables)} tables")
        for table in tables:
            print(f"    - {table.get('table_name')}")
except Exception as e:
    print(f"[-] Error listing tables: {e}")

# The most reliable way is to use a database trigger or stored procedure
# But since we can't create those without SQL execution...
# Let's try using the Supabase SQL Editor via direct HTTP POST

print("\n[*] Attempting direct SQL execution via Supabase SQL Editor API...")

# The Supabase CLI uses this endpoint for linked databases
endpoint = f"https://api.supabase.com/platform/v1/projects/{project_ref}/database/query"

print(f"[*] Endpoint: {endpoint}")

# We need an access token, not a service role key
# Let's try a different approach using the REST API with batched requests

print("\n[*] Attempting to execute SQL using table operations...")

# Since we can't execute raw SQL via REST API directly,
# we'll need to either:
# 1. Use the CLI with proper authentication
# 2. Use a custom RPC function (which requires SQL first - circular dependency)
# 3. Use direct psql connection (requires postgres password)
# 4. Use the dashboard (manual)

print("\n[!] REST API limitations:")
print("    - No raw SQL execution endpoint")
print("    - RPC requires pre-existing functions")
print("    - Need Management API token or direct DB access")

print("\n[*] Recommended approaches:")
print("    1. Use Supabase Dashboard SQL Editor")
print("    2. Use Supabase CLI with access token (supabase login)")
print("    3. Use direct psql: psql postgresql://postgres:PASSWORD@dcvrkpgvxqdcboostkpz.supabase.co:5432/postgres")

# Let's try one more thing - check if there's a helper function already in the database
print("\n[*] Checking for existing helper functions...")

try:
    response = requests.get(
        f"{project_url}/rest/v1/information_schema.routines?routine_schema=eq.public",
        headers=headers
    )
    print(f"[*] GET routines: {response.status_code}")
    if response.status_code == 200:
        routines = response.json()
        print(f"[+] Found {len(routines)} routines")
        for routine in routines:
            print(f"    - {routine.get('routine_name')}")
except Exception as e:
    print(f"[-] Error: {e}")
