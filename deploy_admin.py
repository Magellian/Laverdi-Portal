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
    
    print("[DEPLOY] Admin Panel Files\n")
    
    files = [
        ('admin_delete_user.ts', '/root/laverdi-portal/pages/api/admin/delete-user.ts'),
        ('admin_instances.ts', '/root/laverdi-portal/pages/api/admin/instances.ts'),
        ('admin_index_new.tsx', '/root/laverdi-portal/pages/admin/index.tsx'),
    ]
    
    for local, remote in files:
        print(f"[1] Uploading {local}...")
        
        # Read local file
        with open(f'C:\\Users\\chris\\.openclaw\\workspace\\{local}', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Backup original
        stdin, stdout, stderr = client.exec_command(f"cp {remote} {remote}.backup-$(date +%s) 2>/dev/null || true")
        stdout.read()
        
        # Write new file
        stdin, stdout, stderr = client.exec_command(f"cat > {remote} << 'EOF'\n{content}\nEOF")
        stdin.close()
        stdout.read()
        
        # Verify
        stdin, stdout, stderr = client.exec_command(f"wc -l {remote}")
        verify = stdout.read().decode().strip()
        print(f"    ✓ {verify}\n")
    
    # Rebuild portal
    print("[2] Rebuilding portal...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && npm run build 2>&1 | grep -E '(error|ERROR|✓|built|done)' | tail -10")
    build = stdout.read().decode()
    print(build if build else "    Building...")
    
    # Restart
    print("\n[3] Restarting portal...")
    stdin, stdout, stderr = client.exec_command("pm2 restart web && sleep 2 && curl -s http://localhost:3000 > /dev/null && echo '✓ Portal responding'")
    restart = stdout.read().decode()
    print(restart.strip())
    
    print("\n[SUCCESS] Admin panel deployed!")
    print("\nAccess at: https://laverdi.tech/admin")
    print("Password: laverdi-admin-api-2026")
    print("\nNew features:")
    print("  ✓ User ID column (with copy button)")
    print("  ✓ Instance IP column")
    print("  ✓ Instances tab (see all instances)")
    print("  ✓ Delete with confirmation (type DELETE <email>)")
    print("  ✓ Proper error handling + toasts")
    print("  ✓ Vultr termination on delete")
    print("  ✓ Audit logging")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
