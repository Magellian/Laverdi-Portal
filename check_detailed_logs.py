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
    
    print("[DETAILED LOGS]\n")
    
    # PM2 web logs - all lines
    print("[1] Full PM2 web logs (last 100 lines)...")
    stdin, stdout, stderr = client.exec_command("pm2 logs web --lines 100 --nostream")
    logs = stdout.read().decode()
    print(logs[-1500:] if len(logs) > 1500 else logs)
    
    # Check if there are any Node.js error logs
    print("\n[2] Node.js process errors...")
    stdin, stdout, stderr = client.exec_command("cat /root/.pm2/logs/web-error.log 2>/dev/null | tail -50")
    error_logs = stdout.read().decode()
    print(error_logs if error_logs.strip() else "  (no error logs)")
    
    # Check if Vultr instances exist at all
    print("\n[3] Instances on Vultr (with working key)...")
    stdin, stdout, stderr = client.exec_command("""curl -s -H "Authorization: Bearer 7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA" \\
      https://api.vultr.com/v2/instances?per_page=5 2>/dev/null | python3 << 'PYEOF'
import sys, json
try:
    d = json.load(sys.stdin)
    if 'instances' in d:
        print(f"  Total: {len(d['instances'])}")
        for inst in d.get('instances', [])[:5]:
            print(f"    - {inst.get('label')} | IP: {inst.get('main_ip')} | Status: {inst.get('status')}")
    else:
        print(f"  Error: {d.get('error')}")
except:
    print("  (parse error)")
PYEOF
""")
    
    vultr = stdout.read().decode()
    print(vultr)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
