#!/usr/bin/env python3
import paramiko
import time
import sys

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[*] Connected to {}".format(host))
    
    # Run npm run build
    print("\n[*] Starting npm run build...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && npm run build 2>&1 | tail -20")
    
    # Read output
    build_output = stdout.read().decode('utf-8', errors='replace')
    print(build_output)
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0:
        print("[-] Build may have failed (exit code: {})".format(exit_code))
    else:
        print("[+] Build completed!")
    
    # Check the PM2 status
    print("\n[*] Checking PM2 status...")
    stdin, stdout, stderr = client.exec_command("pm2 status 2>&1 | head -20")
    pm2_status = stdout.read().decode('utf-8', errors='replace')
    print(pm2_status)
    
    # Restart the portal
    print("\n[*] Restarting portal with pm2 restart web...")
    stdin, stdout, stderr = client.exec_command("pm2 restart web 2>&1")
    restart_output = stdout.read().decode('utf-8', errors='replace')
    print(restart_output)
    
    # Wait for service to restart
    time.sleep(5)
    
    # Verify the portal is running
    print("\n[*] Verifying portal health...")
    stdin, stdout, stderr = client.exec_command("curl -sf http://localhost:3005/health 2>&1 || echo 'Health check in progress...'")
    health_check = stdout.read().decode('utf-8', errors='replace')
    
    if "error" not in health_check.lower() and "refused" not in health_check.lower():
        print("[+] Health check response:")
        print("    " + health_check.strip()[:300])
    else:
        print("[*] Health endpoint not ready yet (may still be starting)")
        # Try once more
        time.sleep(5)
        stdin, stdout, stderr = client.exec_command("curl -sf http://localhost:3005/health 2>&1 || echo 'Still starting...'")
        health_check = stdout.read().decode('utf-8', errors='replace')
        print("    " + health_check.strip()[:300])
    
    # Verify the patch is in place
    print("\n[*] Verifying patch was applied...")
    stdin, stdout, stderr = client.exec_command("grep -c 'Generating gateway auth token' /root/laverdi-portal/pages/api/provision.ts")
    count = stdout.read().decode('utf-8').strip()
    if count == "1":
        print("[+] Patch verified! Token injection code is present in provision.ts")
    else:
        print("[-] Patch verification failed!")
    
    client.close()
    print("\n[+] Operations completed!")
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
    import traceback
    traceback.print_exc()
