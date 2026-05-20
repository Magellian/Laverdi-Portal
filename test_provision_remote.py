#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import json
import time
import uuid
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

# Create test user ID
test_user_id = str(uuid.uuid4())
print(f"[INFO] Testing with user_id: {test_user_id}")

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    # Call provision API from portal server (localhost)
    print(f"[INFO] Calling POST /api/provision from portal...")
    cmd = f"""curl -s -X POST http://localhost:3005/api/provision \\
        -H "Content-Type: application/json" \\
        -d '{{"userId":"{test_user_id}"}}'"""
    
    stdin, stdout, stderr = client.exec_command(cmd)
    response = stdout.read().decode().strip()
    print(f"[INFO] Response: {response[:200]}")
    
    try:
        result = json.loads(response)
        if result.get('success'):
            instance_id = result.get('container', {}).get('id')
            print(f"[OK] Instance created!")
            print(f"     Instance ID: {instance_id}")
            
            # Check if instance was recorded in DB
            print(f"\n[INFO] Checking Supabase for instance record...")
            check_cmd = f"""psql -h dcvrkpgvxqdcboostkpz.supabase.co -U postgres -d postgres -c "SELECT id, user_id, status, ip_address FROM instances WHERE user_id = '{test_user_id}' LIMIT 1" 2>/dev/null || echo "DB check failed" """
            
            stdin, stdout, stderr = client.exec_command(check_cmd)
            db_result = stdout.read().decode().strip()
            print(f"[INFO] DB Result: {db_result[:200]}")
            
            # Give it a moment to provision
            print(f"\n[INFO] Waiting 20 seconds for Vultr instance boot...")
            time.sleep(20)
            
            # Check Vultr API for instance details
            print(f"[INFO] Checking Vultr for instance IP...")
            vultr_cmd = f"""curl -s -H "Authorization: Bearer $VULTR_API_KEY" https://api.vultr.com/v2/instances/{instance_id} 2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('instance', dict()).get('main_ip', 'PENDING'))" """
            
            stdin, stdout, stderr = client.exec_command(vultr_cmd)
            instance_ip = stdout.read().decode().strip()
            print(f"[INFO] Instance IP: {instance_ip}")
            
            if instance_ip and instance_ip != 'PENDING':
                print(f"\n[INFO] Instance booted! Waiting for cloud-init to complete...")
                time.sleep(60)  # Wait longer for cloud-init
                
                # Try to SSH to the new instance
                print(f"[INFO] Attempting SSH to {instance_ip}...")
                inst_client = paramiko.SSHClient()
                inst_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                
                try:
                    inst_client.connect(instance_ip, username='root', password='', timeout=10, look_for_keys=False)
                    
                    # Check for token
                    stdin, stdout, stderr = inst_client.exec_command('cat /opt/openclaw-config/openclaw.json 2>/dev/null | head -50')
                    config = stdout.read().decode()
                    
                    if '"token":' in config:
                        print(f"[OK] Token found in openclaw.json!")
                        # Extract token for display
                        import re
                        match = re.search(r'"token":"([^"]+)"', config)
                        if match:
                            token = match.group(1)
                            print(f"     Token: {token[:32]}...")
                    else:
                        print(f"[WARN] Token not in openclaw.json yet")
                        
                    inst_client.close()
                    
                except Exception as e:
                    print(f"[WARN] SSH to instance failed: {e}")
            else:
                print(f"[WARN] Instance IP not ready yet (will be: {instance_ip})")
        else:
            print(f"[FAIL] Provision error: {result}")
    except json.JSONDecodeError:
        print(f"[FAIL] Could not parse response: {response}")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
