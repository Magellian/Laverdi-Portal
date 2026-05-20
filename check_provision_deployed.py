#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[OK] Connected to portal")
    
    # Check 1: Is token generation code present?
    stdin, stdout, stderr = client.exec_command("grep -n 'GATEWAY_TOKEN' /root/laverdi-portal/pages/api/provision.ts | head -5")
    output = stdout.read().decode()
    if "GATEWAY_TOKEN" in output:
        print("[OK] Token generation code found in provision.ts:")
        print(output)
    else:
        print("[FAIL] Token generation code NOT found - patch not deployed!")
        
    # Check 2: Is the portal running?
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3005/api/health 2>/dev/null | head -20")
    health = stdout.read().decode()
    if health:
        print(f"\n[OK] Portal API responding: {health[:100]}")
    else:
        print("\n[WARN] Portal API not responding - may need restart")
        
    # Check 3: Get recent provision.ts modification time
    stdin, stdout, stderr = client.exec_command("stat /root/laverdi-portal/pages/api/provision.ts | grep Modify")
    mtime = stdout.read().decode().strip()
    print(f"\n[INFO] provision.ts last modified: {mtime}")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
