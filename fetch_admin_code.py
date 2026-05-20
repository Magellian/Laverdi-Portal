#!/usr/bin/env python3
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
    
    print("[FETCH] Admin Code\n")
    
    # Get delete-user endpoint
    print("[1] /api/admin/delete-user.ts")
    print("=" * 70)
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/pages/api/admin/delete-user.ts")
    delete_api = stdout.read().decode()
    print(delete_api[:2000] if len(delete_api) > 2000 else delete_api)
    
    # Get users endpoint
    print("\n[2] /api/admin/users.ts")
    print("=" * 70)
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/pages/api/admin/users.ts")
    users_api = stdout.read().decode()
    print(users_api)
    
    # Get admin UI
    print("\n[3] Admin UI (admin/index.tsx) - first 100 lines")
    print("=" * 70)
    stdin, stdout, stderr = client.exec_command("head -100 /root/laverdi-portal/pages/admin/index.tsx")
    admin_ui = stdout.read().decode()
    print(admin_ui)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
