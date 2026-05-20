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
    
    print("[INFO] Checking for provision activity and logs...\n")
    
    # 1. Check for running instances
    print("[1] Vultr instances created in last hour:")
    stdin, stdout, stderr = client.exec_command("""curl -s -H "Authorization: Bearer $VULTR_API_KEY" https://api.vultr.com/v2/instances?per_page=10 2>/dev/null | python3 << 'PYEOF'
import sys, json
d = json.load(sys.stdin)
if 'instances' in d:
    for inst in d.get('instances', [])[:5]:
        print(f"  - {inst.get('label')} | IP: {inst.get('main_ip', 'PENDING')} | Status: {inst.get('status')}")
else:
    print("  Error:", d.get('error', 'unknown'))
PYEOF
""")
    
    output = stdout.read().decode()
    print(output if output else "  (none found)")
    
    # 2. Check portal npm logs
    print("\n[2] Recent provision.ts logs (npm):")
    stdin, stdout, stderr = client.exec_command("pm2 logs web --lines 30 2>/dev/null | grep -i 'provision\\|vultr\\|instance' | tail -15")
    logs = stdout.read().decode()
    print(logs if logs else "  (no logs)")
    
    # 3. Check cloud-init logs on any instances
    print("\n[3] Cloud-init status on latest instance (if any):")
    stdin, stdout, stderr = client.exec_command("""curl -s -H "Authorization: Bearer $VULTR_API_KEY" https://api.vultr.com/v2/instances?per_page=1 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('instances',[{}])[0].get('main_ip','NONE'))" 2>/dev/null || echo "PENDING" """)
    
    latest_ip = stdout.read().decode().strip()
    if latest_ip and latest_ip != "NONE" and latest_ip != "PENDING":
        print(f"  Latest instance IP: {latest_ip}")
        print(f"  Attempting to check cloud-init logs...")
        
        inst_client = paramiko.SSHClient()
        inst_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            inst_client.connect(latest_ip, username='root', password='', timeout=5, look_for_keys=False)
            stdin, stdout, stderr = inst_client.exec_command("tail -20 /var/log/laverdi-init.log 2>/dev/null || echo 'Log not yet created'")
            init_log = stdout.read().decode()
            print(init_log)
            inst_client.close()
        except:
            print(f"  (Could not SSH to {latest_ip} - still booting?)")
    else:
        print(f"  No instances with IP yet")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
