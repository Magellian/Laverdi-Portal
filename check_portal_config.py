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
    
    print("[PORTAL CONFIG]\n")
    
    # Check .env.local for ports
    print("[1] .env.local (PORT/NODE_ENV)...")
    stdin, stdout, stderr = client.exec_command("grep -E '(PORT|NODE_ENV|VULTR)' /root/laverdi-portal/.env.local")
    env = stdout.read().decode()
    print(env if env else "  (no matches)")
    
    # Check next.config.js
    print("\n[2] next.config.js...")
    stdin, stdout, stderr = client.exec_command("ls -la /root/laverdi-portal/next.config.js 2>/dev/null && echo 'EXISTS' || echo 'NOT FOUND'")
    config = stdout.read().decode()
    print(f"    {config.strip()}")
    
    # Check if there's a custom server port config
    print("\n[3] Checking who's listening on port 3000...")
    stdin, stdout, stderr = client.exec_command("lsof -i :3000 2>/dev/null | head -3")
    port3000 = stdout.read().decode()
    print(port3000 if port3000 else "    (nothing)")
    
    print("\n[4] Checking port 3005...")
    stdin, stdout, stderr = client.exec_command("lsof -i :3005 2>/dev/null | head -3")
    port3005 = stdout.read().decode()
    print(port3005 if port3005 else "    (nothing)")
    
    # Check next.config.js for server options
    print("\n[5] next.config.js content (if exists)...")
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/next.config.js 2>/dev/null | head -30")
    nextconfig = stdout.read().decode()
    print(nextconfig if nextconfig else "    (not found)")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
