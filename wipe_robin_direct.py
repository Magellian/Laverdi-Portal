#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
robin_email = "rcoleman0624@gmail.com"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[WIPE] Robin's Account Removal (Direct Supabase Access)")
    print(f"Email: {robin_email}\n")
    
    # Query Supabase using psql (local access via portal server)
    print("[1] Looking up Robin's account via SQL...")
    stdin, stdout, stderr = client.exec_command(f"""PGPASSWORD=postgres psql -h dcvrkpgvxqdcboostkpz.supabase.co -U postgres -d postgres -c "SELECT id, email, status FROM auth.users WHERE email = '{robin_email}';" 2>/dev/null""")
    
    user_lookup = stdout.read().decode()
    print(user_lookup)
    
    # Try a different approach - query the users table
    print("\n[2] Checking portal users table...")
    stdin, stdout, stderr = client.exec_command(f"""curl -s "http://localhost:3000/api/admin/users" 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f\\\"ID: {{u['id']}} | Email: {{u['email']}} | Status: {{u.get('status', 'N/A')}}\\\") for u in data if u.get('email') == '{robin_email}']" 2>/dev/null || echo "Endpoint may not exist"  """)
    
    admin_lookup = stdout.read().decode()
    print(admin_lookup)
    
    print("\n[3] Querying Supabase tables directly for Robin...")
    # Use a simple approach - query via SQL on the portal server
    stdin, stdout, stderr = client.exec_command(f"""cat << 'EOSQL' | psql -h dcvrkpgvxqdcboostkpz.supabase.co -U postgres -d postgres
SELECT 
  u.id as user_id,
  u.email,
  u.created_at,
  i.id as instance_id,
  i.ip_address,
  i.container_id
FROM public.users u
LEFT JOIN public.instances i ON u.id = i.user_id
WHERE u.email = '{robin_email}';
EOSQL
""")
    
    sql_result = stdout.read().decode()
    print(sql_result)
    
    # Extract IDs from output if found
    if "rcoleman0624@gmail.com" in sql_result or "robin" in sql_result.lower():
        print("\n[FOUND] Robin's account exists")
        print("\n[4] Extracting IDs from SQL output...")
        lines = sql_result.split('\n')
        robin_id = None
        instance_id = None
        
        for line in lines:
            if 'rcoleman0624' in line or robin_email in line:
                # Try to extract UUIDs
                parts = line.split('|')
                if len(parts) >= 2:
                    robin_id = parts[0].strip()
                    if len(parts) >= 4:
                        instance_id = parts[3].strip() if parts[3].strip() != '' else None
                    break
        
        if robin_id:
            print(f"[OK] User ID: {robin_id}")
            if instance_id:
                print(f"[OK] Instance ID: {instance_id}")
                
                # Terminate Vultr instance
                print(f"\n[5] Terminating Vultr instance...")
                stdin, stdout, stderr = client.exec_command(f"""curl -s -X DELETE -H "Authorization: Bearer $VULTR_API_KEY" \\
                  https://api.vultr.com/v2/instances/{instance_id} 2>/dev/null && echo "[OK] Deleted" || echo "[WARN] Failed" """)
                
                term = stdout.read().decode()
                print(term.strip())
        else:
            print("[WARN] Could not extract user ID from SQL output")
            print("[INFO] SQL result:", sql_result[:300])
    else:
        print("\n[NOT FOUND] Robin not in database")
        print("[INFO] Check spelling or provide correct email")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
