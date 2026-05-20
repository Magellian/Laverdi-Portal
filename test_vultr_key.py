#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

# The key we have on file
key_from_memory = "7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[VULTR KEY TEST]\n")
    
    # Test 1: Key in .env.local
    print("[1] Checking .env.local...")
    stdin, stdout, stderr = client.exec_command("grep VULTR_API_KEY /root/laverdi-portal/.env.local")
    env_key = stdout.read().decode().strip()
    print(f"    {env_key}\n")
    
    # Extract just the key value
    env_key_value = env_key.split('=')[1] if '=' in env_key else ''
    
    # Test 2: Try API call with the key from .env
    if env_key_value:
        print(f"[2] Testing Vultr API with key from .env...")
        stdin, stdout, stderr = client.exec_command(f"""curl -s -H "Authorization: Bearer {env_key_value}" \\
          https://api.vultr.com/v2/instances?per_page=1 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('SUCCESS' if 'instances' in d else 'FAILED: ' + str(d)[:100])" """)
        
        result = stdout.read().decode().strip()
        print(f"    Result: {result}\n")
    
    # Test 3: Try with the key we have in memory
    print(f"[3] Testing Vultr API with key from memory...")
    stdin, stdout, stderr = client.exec_command(f"""curl -s -H "Authorization: Bearer {key_from_memory}" \\
      https://api.vultr.com/v2/instances?per_page=1 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('SUCCESS' if 'instances' in d else 'FAILED: ' + str(d)[:100])" """)
    
    result = stdout.read().decode().strip()
    print(f"    Result: {result}\n")
    
    # Test 4: Check which instances Vultr actually has
    if result == "SUCCESS":
        print("[4] Listing all instances on Vultr...")
        stdin, stdout, stderr = client.exec_command(f"""curl -s -H "Authorization: Bearer {key_from_memory}" \\
          https://api.vultr.com/v2/instances?per_page=20 2>/dev/null | python3 << 'PYEOF'
import sys, json
d = json.load(sys.stdin)
if 'instances' in d:
    print(f"Total: {len(d['instances'])}")
    for inst in d.get('instances', [])[:10]:
        print(f"  {inst.get('label')} | IP: {inst.get('main_ip', 'NONE')} | Status: {inst.get('status')}")
else:
    print("Error:", d.get('error', 'unknown'))
PYEOF
""")
        
        instances = stdout.read().decode()
        print(instances)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
