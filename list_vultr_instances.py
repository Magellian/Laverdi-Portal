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

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[VULTR] Listing all instances\n")
    
    stdin, stdout, stderr = client.exec_command("""curl -s -H "Authorization: Bearer 7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA" \\
      https://api.vultr.com/v2/instances?per_page=100 2>/dev/null | python3 << 'PYEOF'
import sys, json
d = json.load(sys.stdin)
if 'instances' in d:
    instances = d.get('instances', [])
    print(f"Total instances: {len(instances)}\\n")
    
    for inst in instances:
        label = inst.get('label', 'NONE')
        inst_id = inst.get('id')
        ip = inst.get('main_ip', 'PENDING')
        status = inst.get('status')
        created = inst.get('date_created', 'UNKNOWN')
        
        # Parse label to see if it's from LaVerdi
        is_laverdi = 'openclaw' in label.lower() or 'inst-' in label
        marker = '[LAVERDI]' if is_laverdi else '[OTHER]'
        
        print(f"{marker} {label[:30]:30} | ID: {inst_id[:8]}... | IP: {ip:18} | Status: {status:8} | Created: {created[:10]}")
else:
    print("Error:", d.get('error'))
PYEOF
""")
    
    output = stdout.read().decode()
    print(output)
    
    # Count LaVerdi instances
    print("\n" + "=" * 100)
    stdin, stdout, stderr = client.exec_command("""curl -s -H "Authorization: Bearer 7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA" \\
      https://api.vultr.com/v2/instances?per_page=100 2>/dev/null | python3 << 'PYEOF'
import json, sys
d = json.load(sys.stdin)
instances = d.get('instances', [])
laverdi = [i for i in instances if 'openclaw' in i.get('label', '').lower() or 'inst-' in i.get('label', '')]
other = [i for i in instances if i not in laverdi]
print(f"LaVerdi (openclaw/inst-*): {len(laverdi)}")
print(f"Other instances: {len(other)}")
print(f"Total: {len(instances)}")
PYEOF
""")
    
    counts = stdout.read().decode()
    print(counts)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
