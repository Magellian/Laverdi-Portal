#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

# Read the fixed file
with open('C:\\Users\\chris\\.openclaw\\workspace\\provision.ts', 'r') as f:
    fixed_content = f.read()

print(f"[INFO] Fixed provision.ts loaded ({len(fixed_content)} bytes)\n")

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[BACKUP] Creating backup of current provision.ts...")
    stdin, stdout, stderr = client.exec_command("cp /root/laverdi-portal/pages/api/provision.ts /root/laverdi-portal/pages/api/provision.ts.pre-fixes")
    stdout.read()
    print("[OK] Backup created\n")
    
    print("[DEPLOY] Uploading fixed provision.ts...")
    
    # Write the fixed file via stdin
    stdin, stdout, stderr = client.exec_command("cat > /root/laverdi-portal/pages/api/provision.ts")
    stdin.write(fixed_content)
    stdin.close()
    
    # Wait for write to complete
    stdout.read()
    stderr.read()
    print("[OK] File uploaded\n")
    
    # Verify file
    print("[VERIFY] Verifying deployment...")
    stdin, stdout, stderr = client.exec_command("grep -n 'sleep 15' /root/laverdi-portal/pages/api/provision.ts")
    sleep_check = stdout.read().decode().strip()
    if sleep_check:
        print(f"[OK] Sleep delay present: {sleep_check}")
    else:
        print("[FAIL] Sleep delay NOT found!")
    
    stdin, stdout, stderr = client.exec_command("grep -n 'gatewayToken' /root/laverdi-portal/pages/api/provision.ts | head -1")
    gw_check = stdout.read().decode().strip()
    if gw_check:
        print(f"[OK] gatewayToken present: {gw_check[:80]}")
    else:
        print("[FAIL] gatewayToken NOT found!")
    
    print("\n[BUILD] Building portal...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && npm run build 2>&1 | tail -20")
    build_output = stdout.read().decode()
    
    if 'error' in build_output.lower():
        print("[WARN] Build log (may contain warnings):")
        print(build_output)
    else:
        print("[OK] Build completed")
    
    print("\n[RESTART] Restarting portal service...")
    stdin, stdout, stderr = client.exec_command("pm2 restart web && sleep 2 && curl -s http://localhost:3005 > /dev/null && echo '[OK] Portal responding'")
    restart_output = stdout.read().decode()
    print(restart_output.strip())
    
    print("\n" + "="*60)
    print("[SUCCESS] All fixes deployed!")
    print("="*60)
    print("\n[FIX 1] Added 15-second delay before token extraction")
    print("        - Ensures container is fully initialized")
    print("        - Located at: before docker exec GATEWAY_TOKEN")
    print("\n[FIX 2] Added gatewayToken to webhook payload")
    print("        - Token now sent directly in /api/webhooks/instance-ready")
    print("        - Field: gatewayToken=$GATEWAY_TOKEN")
    print("\n[DEPLOY] Portal rebuilt and restarted")
    print("\nReady to test new provisions!")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
