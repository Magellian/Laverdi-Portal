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
    
    print("[SIMPLE CHECK]\n")
    
    # Just check pm2 status
    print("[1] PM2 Portal Status:")
    stdin, stdout, stderr = client.exec_command("pm2 status")
    status = stdout.read().decode()
    print(status)
    
    # Check recent console output
    print("\n[2] Portal console output (last 20 lines):")
    stdin, stdout, stderr = client.exec_command("pm2 logs web --nostream --lines 20")
    logs = stdout.read().decode()
    print(logs[-500:] if len(logs) > 500 else logs)
    
    # Check if provision.ts has our fixes
    print("\n[3] Verify fixes are in provision.ts:")
    stdin, stdout, stderr = client.exec_command("grep -c 'sleep 15' /root/laverdi-portal/pages/api/provision.ts && echo 'OK: sleep 15 found' || echo 'FAIL: no sleep'")
    sleep_check = stdout.read().decode()
    print(f"    {sleep_check.strip()}")
    
    stdin, stdout, stderr = client.exec_command("grep -c 'gatewayToken' /root/laverdi-portal/pages/api/provision.ts && echo 'OK: gatewayToken found' || echo 'FAIL: no gatewayToken'")
    token_check = stdout.read().decode()
    print(f"    {token_check.strip()}")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
