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
    
    print("[*] Connected to {}".format(host))
    
    # Check if we're in the right directory
    stdin, stdout, stderr = client.exec_command("ls -la /root/laverdi-portal/ | head -10")
    ls_output = stdout.read().decode('utf-8')
    print("[*] Directory listing:\n" + ls_output)
    
    # Run npm run build
    print("\n[*] Starting npm run build...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && npm run build")
    
    # Stream output
    for line in stdout:
        print("  [BUILD] " + line.rstrip())
    
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0:
        print("[-] Build failed with exit code {}".format(exit_code))
        err = stderr.read().decode('utf-8')
        if err:
            print("[-] Error output:\n" + err)
    else:
        print("[+] Build completed successfully!")
    
    # Check the PM2 status
    print("\n[*] Checking PM2 status...")
    stdin, stdout, stderr = client.exec_command("pm2 status")
    pm2_status = stdout.read().decode('utf-8')
    print(pm2_status)
    
    # Restart the portal
    print("\n[*] Restarting portal with pm2 restart web...")
    stdin, stdout, stderr = client.exec_command("pm2 restart web")
    restart_output = stdout.read().decode('utf-8')
    print(restart_output)
    
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        err = stderr.read().decode('utf-8')
        print("[-] Restart may have failed: " + err)
    else:
        print("[+] Portal restart initiated")
    
    # Wait a moment for the service to start
    time.sleep(3)
    
    # Verify the portal is running
    print("\n[*] Verifying portal health...")
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3005/health | head -c 200")
    health_check = stdout.read().decode('utf-8')
    if health_check:
        print("[+] Health check response:")
        print("    " + health_check[:200])
    else:
        print("[-] No response from health endpoint (may still be starting)")
        
        # Try again after a delay
        time.sleep(5)
        stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3005/health | head -c 200")
        health_check = stdout.read().decode('utf-8')
        if health_check:
            print("[+] Health check response (retry):")
            print("    " + health_check[:200])
    
    client.close()
    print("\n[+] All operations completed!")
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
    import traceback
    traceback.print_exc()
