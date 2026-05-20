import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Read the migration SQL
with open('C:\\Users\\chris\\.openclaw\\workspace\\migration.sql', 'r') as f:
    sql = f.read()

print("[*] SQL to execute:")
print(sql)
print("\n" + "="*80 + "\n")

# Try using psycopg2 to connect directly to Supabase
try:
    import psycopg2
    from psycopg2 import sql as sql_module
    
    print("[*] Using psycopg2 to connect to Supabase...")
    
    # Supabase connection string
    # Format: postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
    # For Supabase with service role: postgres://postgres:[password]@[host]:5432/postgres
    
    # Extract project reference
    project_ref = "dcvrkpgvxqdcboostkpz"
    
    # Supabase uses: {project_ref}.supabase.co
    host = f"{project_ref}.supabase.co"
    port = 5432
    database = "postgres"
    user = "postgres"
    
    # For Supabase, the password is typically the postgres password from project settings
    # We need to use the service role JWT, but psycopg2 requires actual postgres credentials
    # This approach won't work without the actual postgres password
    
    print("[-] Cannot connect with service role JWT alone")
    print("[!] Need postgres user credentials for direct connection")
    
except ImportError:
    print("[-] psycopg2 not installed")

# Alternative: Use Supabase Python client's internal connection
print("\n[*] Attempting alternative approach using supabase-py...")

try:
    from supabase import create_client
    import json
    import base64
    
    project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
    service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"
    
    # Decode the JWT to check details
    parts = service_role_key.split('.')
    # Add padding if needed
    payload = parts[1] + '=' * (4 - len(parts[1]) % 4)
    decoded = json.loads(base64.urlsafe_b64decode(payload))
    print(f"[+] Service role JWT decoded: role={decoded.get('role')}")
    
    # Create client
    client = create_client(project_url, service_role_key)
    print("[+] Supabase client created")
    
    # Try to check the internal connection pool
    print("[*] Checking client capabilities...")
    print(f"[*] Client attributes: {dir(client)}")
    
except Exception as e:
    print(f"[-] Error: {e}")
    import traceback
    traceback.print_exc()
