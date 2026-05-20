#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
instance_id = "eb4aead9-c88a-44f9-b558-388c39ad7aff"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[CHECK] Vultr Instance Status\n")
    
    # Check the instance in Vultr
    print(f"[1] Checking Vultr API for instance {instance_id}...")
    stdin, stdout, stderr = client.exec_command(f"""curl -s -H "Authorization: Bearer $VULTR_API_KEY" \\
      https://api.vultr.com/v2/instances/{instance_id} 2>/dev/null | python3 -m json.tool 2>/dev/null | head -50""")
    
    vultr_response = stdout.read().decode()
    print(vultr_response)
    
    # Check if instance exists in list
    print(f"\n[2] Listing all instances...")
    stdin, stdout, stderr = client.exec_command("""curl -s -H "Authorization: Bearer $VULTR_API_KEY" \\
      https://api.vultr.com/v2/instances?per_page=10 2>/dev/null | python3 << 'PYEOF'
import sys, json
try:
    d = json.load(sys.stdin)
    if 'instances' in d:
        print(f"Total instances: {len(d['instances'])}")
        for inst in d.get('instances', [])[:5]:
            print(f"  - {inst.get('label')} | ID: {inst.get('id')[:8]}... | IP: {inst.get('main_ip', 'NONE')} | Status: {inst.get('status')}")
    else:
        print(f"Error: {d.get('error', 'unknown')}")
except Exception as e:
    print(f"JSON error: {e}")
PYEOF
""")
    
    instances = stdout.read().decode()
    print(instances)
    
    # Check portal logs for provision errors
    print(f"\n[3] Checking portal provision logs...")
    stdin, stdout, stderr = client.exec_command("grep -i 'provision\\|vultr\\|error' /var/log/pm2/*.log 2>/dev/null | tail -20")
    logs = stdout.read().decode()
    print(logs if logs else "  (no logs found)")
    
    # Check environment variables
    print(f"\n[4] Checking VULTR_API_KEY...")
    stdin, stdout, stderr = client.exec_command("echo $VULTR_API_KEY | wc -c")
    key_length = stdout.read().decode().strip()
    print(f"  VULTR_API_KEY length: {key_length} (should be ~50)")
    
    # Check if VULTR_API_KEY is set in portal environment
    print(f"\n[5] Checking portal .env...")
    stdin, stdout, stderr = client.exec_command("grep -i vultr /root/laverdi-portal/.env.local 2>/dev/null | head -5")
    env_vars = stdout.read().decode()
    print(env_vars if env_vars else "  (could not read .env.local)")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
