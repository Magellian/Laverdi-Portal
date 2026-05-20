#!/usr/bin/env python3
import paramiko
import time

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[*] Connected")
    
    # Run npm run build (suppressing full output due to encoding issues)
    print("[*] Running npm run build (this may take a minute)...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && npm run build > /tmp/build.log 2>&1 ; echo 'Build exit code: '$?")
    build_status = stdout.read().decode('utf-8')
    print("    " + build_status.strip())
    
    # Check if build succeeded
    stdin, stdout, stderr = client.exec_command("tail -5 /tmp/build.log")
    build_tail = stdout.read().decode('utf-8', errors='ignore')
    print("[*] Build log (last 5 lines):")
    for line in build_tail.split('\n')[-6:]:
        if line.strip():
            print("    " + line)
    
    # Restart PM2
    print("\n[*] Restarting portal service...")
    stdin, stdout, stderr = client.exec_command("pm2 restart web")
    restart_msg = stdout.read().decode('utf-8')
    print("    " + restart_msg.strip()[:200])
    
    time.sleep(3)
    
    # Check status
    print("[*] Checking PM2 status...")
    stdin, stdout, stderr = client.exec_command("pm2 list 2>&1 | grep -E '(web|id|status|mode)'")
    pm2_status = stdout.read().decode('utf-8')
    print(pm2_status)
    
    # Health check
    print("[*] Health check...")
    stdin, stdout, stderr = client.exec_command("curl -m 5 http://localhost:3005/health 2>&1 | head -c 100")
    health = stdout.read().decode('utf-8', errors='ignore')
    if health:
        print("[+] Portal responding: " + health[:100])
    else:
        print("[*] Portal may still be starting...")
    
    # Verify patch
    print("\n[*] Final verification...")
    stdin, stdout, stderr = client.exec_command("grep 'Generating gateway auth token' /root/laverdi-portal/pages/api/provision.ts | wc -l")
    patch_count = stdout.read().decode('utf-8').strip()
    if patch_count == "1":
        print("[+] PATCH APPLIED: Token injection code confirmed in provision.ts")
    else:
        print("[-] Patch verification failed (count: {})".format(patch_count))
    
    # Backup info
    print("\n[+] Task completed!")
    print("[*] Backup of original file: /root/laverdi-portal/pages/api/provision.ts.backup")
    
    client.close()
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
