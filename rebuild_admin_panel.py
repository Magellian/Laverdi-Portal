#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[REBUILD] Admin Panel - Full Diagnostic\n")
    
    # Get full admin UI
    print("[1] Fetching admin/index.tsx (full file)...")
    stdin, stdout, stderr = client.exec_command("wc -l /root/laverdi-portal/pages/admin/index.tsx")
    linecount = stdout.read().decode().strip()
    print(f"    File size: {linecount}\n")
    
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/pages/admin/index.tsx")
    admin_ui = stdout.read().decode()
    
    # Save to local file for analysis
    with open('C:\\Users\\chris\\.openclaw\\workspace\\admin_index.tsx', 'w') as f:
        f.write(admin_ui)
    print("    ✓ Saved to admin_index.tsx\n")
    
    # Get delete API
    print("[2] Fetching delete-user.ts (full file)...")
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/pages/api/admin/delete-user.ts")
    delete_api = stdout.read().decode()
    
    with open('C:\\Users\\chris\\.openclaw\\workspace\\delete-user.ts', 'w') as f:
        f.write(delete_api)
    print("    ✓ Saved to delete-user.ts\n")
    
    # Get users API
    print("[3] Fetching users.ts...")
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/pages/api/admin/users.ts")
    users_api = stdout.read().decode()
    
    with open('C:\\Users\\chris\\.openclaw\\workspace\\admin_users.ts', 'w') as f:
        f.write(users_api)
    print("    ✓ Saved to admin_users.ts\n")
    
    # Check for other relevant files
    print("[4] Checking for other admin APIs...")
    stdin, stdout, stderr = client.exec_command("ls -1 /root/laverdi-portal/pages/api/admin/")
    apis = stdout.read().decode()
    print(apis)
    
    print("\n[READY] All code fetched and saved to workspace")
    print("        Next: Analyze delete flow, identify the issue")
    print("        Then: Rebuild with User ID + Instance IP + Vultr termination")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
