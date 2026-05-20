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
    
    print("[CHECK] Portal Status and Provision Issues\n")
    
    # Check if provision is even being called
    print("[1] Portal request logs...")
    stdin, stdout, stderr = client.exec_command("pm2 logs web --lines 100 2>/dev/null | grep -E '(POST|provision|userId)' | tail -10")
    logs = stdout.read().decode()
    print(logs if logs else "  (no matches found)")
    
    # Check the actual npm build/start output
    print("\n[2] Check if portal started cleanly...")
    stdin, stdout, stderr = client.exec_command("pm2 show web | grep -E '(status|monit|env)' | head -15")
    status = stdout.read().decode()
    print(status)
    
    # Check if VULTR key is in portal's process environment
    print("\n[3] Portal process environment (VULTR_API_KEY)...")
    stdin, stdout, stderr = client.exec_command("cat /proc/$(pgrep -f 'node.*next' | head -1)/environ | tr '\\0' '\\n' | grep VULTR")
    env = stdout.read().decode()
    print(env if env else "  (not found in process env)")
    
    # Check pm2 ecosystem/env
    print("\n[4] PM2 environment config...")
    stdin, stdout, stderr = client.exec_command("cat /root/.pm2/dump.pm2 2>/dev/null | python3 -c \"import sys, json; d=json.load(sys.stdin); [print(f\\\"env: {k}={v[:30]}...\\\") for k,v in d[0].get('env',{}).items() if 'VULTR' in k or 'SECRET' in k]\" 2>/dev/null || echo '(Could not parse)'")
    pm2_env = stdout.read().decode()
    print(pm2_env)
    
    # Check if the provision endpoint is even being hit
    print("\n[5] Last 30 lines of web.log...")
    stdin, stdout, stderr = client.exec_command("tail -30 /root/.pm2/logs/web-out.log 2>/dev/null | tail -15")
    web_log = stdout.read().decode()
    print(web_log if web_log else "  (no logs)")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
