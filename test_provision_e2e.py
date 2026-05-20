#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import json
import time
import uuid
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Create a test user ID
test_user_id = str(uuid.uuid4())
print(f"[INFO] Testing with user_id: {test_user_id}")

# Call the provision endpoint
print(f"[INFO] Calling POST /api/provision...")
try:
    response = requests.post(
        'http://66.42.70.66:3005/api/provision',
        json={'userId': test_user_id},
        timeout=15
    )
    print(f"[INFO] Status: {response.status_code}")
    result = response.json()
    print(f"[INFO] Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 200 and result.get('success'):
        instance_id = result.get('container', {}).get('id')
        instance_ip = result.get('container', {}).get('ip')
        print(f"\n[OK] Instance created!")
        print(f"     Instance ID: {instance_id}")
        print(f"     Instance IP: {instance_ip}")
        print(f"[INFO] Waiting 30 seconds for instance to boot and token to be generated...")
        time.sleep(30)
        
        # Try to SSH in and check for token
        print(f"\n[INFO] Attempting to check token file on instance...")
        import paramiko
        
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            client.connect(instance_ip, username='root', password='', timeout=10)
            
            # Check for token file
            stdin, stdout, stderr = client.exec_command('cat /opt/openclaw-config/openclaw.json | grep -o \'"token":"[^"]*"\' | head -1')
            token_line = stdout.read().decode().strip()
            
            if token_line:
                print(f"[OK] Token found in openclaw.json: {token_line[:80]}...")
            else:
                print(f"[WARN] Token not found in openclaw.json yet - still initializing?")
                
            # Check gateway-token.json
            stdin, stdout, stderr = client.exec_command('cat /opt/openclaw-config/gateway-token.json 2>/dev/null')
            token_meta = stdout.read().decode().strip()
            
            if token_meta:
                print(f"[OK] Token metadata file found:")
                print(token_meta)
            else:
                print(f"[WARN] gateway-token.json not found - cloud-init may still be running")
                
            client.close()
            
        except Exception as e:
            print(f"[WARN] Could not SSH to instance: {e} (may still be initializing)")
    else:
        print(f"[FAIL] Provision failed: {result}")
        
except requests.exceptions.RequestException as e:
    print(f"[ERROR] Request failed: {e}")
    sys.exit(1)
