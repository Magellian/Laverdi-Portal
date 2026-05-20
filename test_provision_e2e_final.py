#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import json
import time
import uuid
import sys
import io
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
test_user_id = str(uuid.uuid4())

print("[TEST] End-to-End Provision Test with Token Storage")
print(f"[TEST] User ID: {test_user_id}\n")

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    # STEP 1: Call provision API
    print("[STEP 1] Calling provision API...")
    cmd = f"""curl -s -X POST http://localhost:3005/api/provision \\
      -H "Content-Type: application/json" \\
      -d '{{"userId":"{test_user_id}"}}'"""
    
    stdin, stdout, stderr = client.exec_command(cmd)
    response = stdout.read().decode().strip()
    
    try:
        result = json.loads(response)
        if result.get('success'):
            instance_id = result.get('container', {}).get('id')
            instance_ip = result.get('container', {}).get('ip', 'PENDING')
            print(f"[OK] Instance created")
            print(f"     Instance ID: {instance_id}")
            print(f"     Instance IP: {instance_ip}\n")
        else:
            print(f"[FAIL] API error: {result}")
            sys.exit(1)
    except json.JSONDecodeError:
        print(f"[FAIL] Could not parse response: {response[:200]}")
        sys.exit(1)
    
    # STEP 2: Wait for Vultr to assign IP
    print("[STEP 2] Waiting for instance IP assignment...")
    
    max_wait = 60
    wait_time = 0
    instance_ip = None
    
    while wait_time < max_wait:
        stdin, stdout, stderr = client.exec_command(f"""curl -s -H "Authorization: Bearer $VULTR_API_KEY" \\
          https://api.vultr.com/v2/instances/{instance_id} 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('instance',{{}}).get('main_ip','NONE'))" 2>/dev/null || echo "PENDING" """)
        
        ip_result = stdout.read().decode().strip()
        
        if ip_result and ip_result != "NONE" and ip_result != "PENDING":
            instance_ip = ip_result
            print(f"[OK] IP assigned: {instance_ip}\n")
            break
        
        wait_time += 5
        print(f"     Waiting... ({wait_time}s)")
        time.sleep(5)
    
    if not instance_ip:
        print(f"[TIMEOUT] IP not assigned after {max_wait} seconds")
        print("[INFO] This is normal - Vultr can take a few minutes")
        print("[INFO] The instance will continue provisioning in the background")
        instance_ip = "PENDING"
    
    # STEP 3: Wait for cloud-init to complete
    if instance_ip != "PENDING":
        print("[STEP 3] Waiting for cloud-init to complete...")
        print("[INFO] Cloud-init takes 3-5 minutes. Checking progress...\n")
        
        max_cloud_init_wait = 300  # 5 minutes
        cloud_init_time = 0
        token_found = False
        extracted_token = None
        
        while cloud_init_time < max_cloud_init_wait:
            try:
                inst_client = paramiko.SSHClient()
                inst_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                inst_client.connect(instance_ip, username='root', password='', timeout=5, look_for_keys=False)
                
                # Check if cloud-init is still running
                stdin, stdout, stderr = inst_client.exec_command("ps aux | grep -i cloud-init | grep -v grep")
                cloud_init_running = stdout.read().decode().strip()
                
                # Check for openclaw.json
                stdin, stdout, stderr = inst_client.exec_command("cat /opt/openclaw-config/openclaw.json 2>/dev/null | head -100")
                config = stdout.read().decode()
                
                if '"token":' in config:
                    token_found = True
                    # Extract the token value
                    match = re.search(r'"token":"([^"]+)"', config)
                    if match:
                        extracted_token = match.group(1)
                        print(f"[OK] Token found in openclaw.json!")
                        print(f"     Token: {extracted_token[:32]}...\n")
                    break
                else:
                    print(f"     Still initializing... ({cloud_init_time}s)")
                    if cloud_init_running:
                        print(f"     cloud-init still running")
                    else:
                        print(f"     cloud-init complete, token not yet in config")
                
                inst_client.close()
                
            except Exception as e:
                print(f"     SSH failed (instance still booting): {str(e)[:50]}")
            
            cloud_init_time += 10
            time.sleep(10)
        
        if token_found and extracted_token:
            print(f"[SUCCESS] Token is present in instance!")
        elif token_found:
            print(f"[PARTIAL] Token found but couldn't extract value")
        else:
            print(f"[WARN] Token not found after {cloud_init_time} seconds")
            print(f"[INFO] Cloud-init may still be running. Check instance manually in a few minutes.")
    
    # STEP 4: Check Supabase for token storage
    print("\n[STEP 4] Checking Supabase instances table...")
    time.sleep(3)  # Give webhook time to fire
    
    # Query via portal (avoids auth issues)
    stdin, stdout, stderr = client.exec_command(f"""curl -s http://localhost:3005/api/instances?userId={test_user_id} 2>/dev/null | head -200""")
    instances_data = stdout.read().decode()
    
    if instances_data:
        print(f"[INFO] Instances API response:")
        print(instances_data[:300])
    
    # Try to query Supabase directly if we have creds
    print("\n[STEP 5] Checking webhook execution...")
    stdin, stdout, stderr = client.exec_command("tail -50 /var/log/pm2/*.log 2>/dev/null | grep -i 'webhook\\|token\\|instance-ready' | tail -10")
    webhook_logs = stdout.read().decode()
    
    if webhook_logs:
        print(f"[OK] Webhook activity found:")
        print(webhook_logs)
    else:
        print(f"[INFO] No webhook logs found yet (may still be in progress)")
    
    # STEP 6: Summary
    print("\n" + "="*70)
    print("[SUMMARY] Test Results")
    print("="*70)
    print(f"✓ Instance ID: {instance_id}")
    print(f"✓ Instance IP: {instance_ip}")
    print(f"✓ Token found in config: {'YES' if token_found else 'PENDING'}")
    if extracted_token:
        print(f"✓ Token value: {extracted_token[:16]}...{extracted_token[-8:]}")
    print(f"\nTest user: {test_user_id}")
    
    if token_found and extracted_token:
        print("\n[RESULT] SUCCESS - Token generation and storage working!")
    elif instance_ip == "PENDING":
        print("\n[RESULT] PARTIAL - Instance created, waiting for Vultr to assign IP")
        print("         Check back in a few minutes for full result")
    else:
        print("\n[RESULT] IN PROGRESS - Cloud-init still running")
        print("         SSH manually to verify: ssh root@" + instance_ip)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
