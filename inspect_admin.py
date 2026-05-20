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
    
    print("[AUDIT] Admin Panel Structure\n")
    
    # Find admin files
    print("[1] Admin files...")
    stdin, stdout, stderr = client.exec_command("find /root/laverdi-portal -path '*admin*' -type f | grep -E '\\.(tsx?|jsx?)$' | head -20")
    files = stdout.read().decode()
    print(files)
    
    # Check admin page structure
    print("\n[2] Admin pages...")
    stdin, stdout, stderr = client.exec_command("ls -la /root/laverdi-portal/pages/admin/ 2>/dev/null || echo 'No admin folder'")
    admin_dir = stdout.read().decode()
    print(admin_dir)
    
    # Check for delete endpoint
    print("\n[3] Looking for delete endpoints...")
    stdin, stdout, stderr = client.exec_command("grep -r 'DELETE\\|delete' /root/laverdi-portal/pages/api --include='*.ts' | grep -i 'user\\|instance' | head -5")
    deletes = stdout.read().decode()
    print(deletes if deletes else "  (no delete endpoints found)")
    
    # Check admin API files
    print("\n[4] Admin API files...")
    stdin, stdout, stderr = client.exec_command("ls -la /root/laverdi-portal/pages/api/admin/ 2>/dev/null || echo 'No admin API'")
    api = stdout.read().decode()
    print(api)
    
    # Get size of admin component
    print("\n[5] Component file size...")
    stdin, stdout, stderr = client.exec_command("find /root/laverdi-portal -name '*admin*' -type f \\( -name '*.tsx' -o -name '*.ts' \\) -exec wc -l {} + 2>/dev/null")
    sizes = stdout.read().decode()
    print(sizes)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
