#!/usr/bin/env python3
# -*- coding: utf-8 -*-
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
    
    print("[FIND PORTAL SERVER]\n")
    
    # Look for server files
    print("[1] Looking for server files...")
    stdin, stdout, stderr = client.exec_command("find /root/laverdi-portal -name '*server*' -o -name '*3005*' 2>/dev/null")
    files = stdout.read().decode()
    print(files if files.strip() else "    (none found)")
    
    # Check package.json scripts
    print("\n[2] package.json scripts...")
    stdin, stdout, stderr = client.exec_command("grep -A 10 '\"scripts\"' /root/laverdi-portal/package.json")
    scripts = stdout.read().decode()
    print(scripts[:400] if scripts else "    (not found)")
    
    # Check if there's an API handler for provision on 3005
    print("\n[3] Checking if /api/provision exists...")
    stdin, stdout, stderr = client.exec_command("ls -la /root/laverdi-portal/pages/api/provision.ts")
    prov_file = stdout.read().decode()
    print(f"    {prov_file.strip()}")
    
    # Try to test Next.js on 3000
    print("\n[4] Testing http://localhost:3000/api/provision...")
    stdin, stdout, stderr = client.exec_command("""curl -s -X POST http://localhost:3000/api/provision \\
      -H "Content-Type: application/json" \\
      -d '{"userId":"test-config-check"}' | head -c 200""")
    
    response = stdout.read().decode()
    print(f"    Response: {response}")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
