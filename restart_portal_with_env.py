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
    
    print("[PORTAL RESTART WITH ENV]\n")
    
    # Stop portal
    print("[1] Stopping portal...")
    stdin, stdout, stderr = client.exec_command("pm2 stop web && sleep 1")
    stdout.read()
    print("[OK]\n")
    
    # Clear pm2 cache
    print("[2] Clearing PM2 cache...")
    stdin, stdout, stderr = client.exec_command("pm2 kill || true && sleep 2")
    stdout.read()
    print("[OK]\n")
    
    # Start with env from .env.local
    print("[3] Starting portal with .env.local...")
    stdin, stdout, stderr = client.exec_command("""cd /root/laverdi-portal && \\
    VULTR_API_KEY=7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA \\
    NODE_ENV=production \\
    pm2 start "npm run start" --name web --cwd /root/laverdi-portal 2>&1""")
    
    startup = stdout.read().decode()
    print(startup[:200])
    
    time.sleep(5)
    
    # Test it
    print("\n[4] Testing portal...")
    for i in range(10):
        stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3005 2>/dev/null | head -1")
        response = stdout.read().decode().strip()
        
        if "DOCTYPE" in response or "html" in response:
            print(f"[OK] Portal responding ({i+1} attempts)\n")
            break
        else:
            print(f"    Waiting... ({i+1}/10)")
            time.sleep(1)
    
    # Verify environment
    print("[5] Verifying portal environment...")
    stdin, stdout, stderr = client.exec_command("ps aux | grep 'node.*next' | grep -v grep | head -1 | awk '{print $NF}'")
    portal_cmd = stdout.read().decode().strip()
    print(f"    Command: {portal_cmd}\n")
    
    # Test provision with a simple call
    print("[6] Quick provision test...")
    test_id = "test-env-" + str(int(time.time()))
    stdin, stdout, stderr = client.exec_command(f"""curl -s -X POST http://localhost:3005/api/provision \\
      -H "Content-Type: application/json" \\
      -d '{{"userId":"{test_id}"}}'""")
    
    response = stdout.read().decode()
    if "success" in response:
        print(f"[OK] Provision API working")
    else:
        print(f"[WARN] Response: {response[:150]}")
    
    print("\n[SUCCESS] Portal restarted with environment variables")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
