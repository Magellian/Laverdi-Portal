#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import time
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
    
    print("[PORTAL RECOVERY]\n")
    
    # Kill any leftover node processes
    print("[1] Stopping any running node processes...")
    stdin, stdout, stderr = client.exec_command("pkill -f 'next.*server' || true && pkill -f 'node.*port 3005' || true")
    stdout.read()
    time.sleep(2)
    print("[OK]\n")
    
    # Restart the web process
    print("[2] Restarting portal via PM2...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && pm2 start 'npm run start' --name web --cwd /root/laverdi-portal 2>&1")
    startup = stdout.read().decode()
    print(startup[:300])
    
    # Wait for startup
    time.sleep(5)
    print("\n[3] Checking if portal is responding...")
    
    for i in range(10):
        stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3005 2>/dev/null | head -1")
        response = stdout.read().decode().strip()
        
        if "DOCTYPE" in response or "html" in response:
            print(f"[OK] Portal is responding! ({i+1} attempts)\n")
            break
        else:
            print(f"    Waiting... ({i+1}/10)")
            time.sleep(2)
    
    # Check PM2 status
    print("[4] PM2 Status:")
    stdin, stdout, stderr = client.exec_command("pm2 status | grep -E '(web|command)'")
    status = stdout.read().decode()
    print(status)
    
    # Check portal environment has VULTR_API_KEY
    print("[5] Verifying VULTR_API_KEY is set...")
    stdin, stdout, stderr = client.exec_command("grep VULTR_API_KEY /root/laverdi-portal/.env.local | head -1")
    key_check = stdout.read().decode()
    print(f"    {key_check.strip()[:60]}...")
    
    print("\n[SUCCESS] Portal should be ready!\n")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
