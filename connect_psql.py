import subprocess
import os

project_ref = "dcvrkpgvxqdcboostkpz"
host = f"{project_ref}.supabase.co"
port = 5432
user = "postgres"

# Read the SQL file
with open('C:\\Users\\chris\\.openclaw\\workspace\\migration.sql', 'r') as f:
    sql = f.read()

print("[*] Attempting direct PostgreSQL connection via psql...")
print(f"[*] Host: {host}")
print(f"[*] Port: {port}")
print(f"[*] User: {user}")

# For Supabase projects, we typically need the postgres password
# This is different from the JWT service role key
# Let's try to use a password from environment variable first

password = os.environ.get('SUPABASE_DB_PASSWORD', '')

if not password:
    print("[-] SUPABASE_DB_PASSWORD not set in environment")
    print("[!] The postgres user password is required for direct connection")
    print("[*] This password is available in Supabase dashboard under Project Settings > Database > Connection info")
    
    # Try connecting without password (might work if ~/.pgpass is configured)
    print("\n[*] Attempting connection without password...")
    
    # Create temporary .pgpass file
    pgpass_path = os.path.expanduser("~/.pgpass")
    # Note: We can't proceed without the actual password
    
    print("[!] Cannot proceed without the postgres user password")
    print("[*] Would need to manually enter or provide SUPABASE_DB_PASSWORD environment variable")
else:
    print(f"[+] Using password from SUPABASE_DB_PASSWORD")
    
    # Set up environment
    env = os.environ.copy()
    env['PGPASSWORD'] = password
    env['PGOPTIONS'] = '-c statement_timeout=30000'
    
    try:
        # Execute SQL via psql
        print("\n[*] Executing SQL...")
        
        cmd = [
            'psql',
            f'postgresql://{user}@{host}:{port}/postgres',
            '-f', 'C:\\Users\\chris\\.openclaw\\workspace\\migration.sql',
            '-v', 'ON_ERROR_STOP=1'
        ]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        
        print(f"[*] Return code: {result.returncode}")
        print(f"\n[+] Output:\n{result.stdout}")
        if result.stderr:
            print(f"\n[!] Stderr:\n{result.stderr}")
        
        if result.returncode == 0:
            print("\n[SUCCESS] SQL executed successfully!")
        else:
            print("\n[ERROR] SQL execution failed")
            
    except FileNotFoundError:
        print("[-] psql not found. Install PostgreSQL client tools.")
    except Exception as e:
        print(f"[-] Error: {e}")
