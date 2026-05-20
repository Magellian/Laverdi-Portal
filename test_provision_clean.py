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
test_user_id = str(uuid.uuid4())

print("[TEST 2] Provision with Fixed Code + Restarted Portal")
print(f"[TEST] User ID: {test_user_id}\n")

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    # STEP 1: Call provision
    print("[STEP 1] Calling provision API...")
    cmd = f"""curl -s -X POST http://localhost:3005/api/provision \\
      -H "Content-Type: application/json" \\
      -d '{{"userId":"{test_user_id}"}}'"""
    
    stdin, stdout, stderr = client.exec_command(cmd)
    response = stdout.read().decode().strip()
    
    print(f"Response: {response[:200]}\n")
    
    try:
        result = json.loads(response)
        if result.get('success'):
            instance_id = result.get('container', {}).get('id')
            instance_ip = result.get('container', {}).get('ip', 'PENDING')
            print(f"[OK] Provision returned success")
            print(f"     Instance ID: {instance_id}")
            print(f"     Instance IP: {instance_ip}\n")
        else:
            print(f"[FAIL] {result}\n")
            sys.exit(1)
    except json.JSONDecodeError:
        print(f"[FAIL] Could not parse: {response}\n")
        sys.exit(1)
    
    # STEP 2: Check Supabase instances table immediately
    print("[STEP 2] Checking if instance was recorded in DB...")
    time.sleep(1)
    
    stdin, stdout, stderr = client.exec_command(f"""curl -s https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances?user_id=eq.{test_user_id}&select=id,status,container_id 2>/dev/null -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" | python3 -m json.tool 2>/dev/null | head -20""")
    
    db_response = stdout.read().decode()
    if db_response:
        print(f"[OK] Database response: {db_response[:150]}")
    else:
        print(f"[INFO] No DB response yet (may take a moment)")
    
    # STEP 3: Check Vultr for the instance
    print(f"\n[STEP 3] Checking Vultr for instance {instance_id}...")
    stdin, stdout, stderr = client.exec_command(f"""curl -s -H "Authorization: Bearer $VULTR_API_KEY" \\
      https://api.vultr.com/v2/instances/{instance_id} 2>/dev/null | python3 -m json.tool 2>/dev/null | head -30""")
    
    vultr_check = stdout.read().decode()
    if "error" in vultr_check.lower():
        print(f"[WARN] Vultr query failed (API key issue?):")
        print(vultr_check[:200])
    elif "instance" in vultr_check.lower():
        print(f"[OK] Vultr has the instance:")
        print(vultr_check[:300])
    else:
        print(f"[INFO] Vultr response: {vultr_check[:150]}")
    
    # STEP 4: Check portal logs
    print(f"\n[STEP 4] Checking portal logs...")
    stdin, stdout, stderr = client.exec_command("pm2 logs web --nostream --lines 30 | grep -E '(provision|userId|instance|error)' | tail -15")
    logs = stdout.read().decode()
    if logs:
        print("[OK] Portal logs:")
        print(logs)
    else:
        print("[INFO] No relevant logs found")
    
    print(f"\n[SUMMARY]")
    print(f"  Instance ID: {instance_id}")
    print(f"  API Response: {'SUCCESS' if result.get('success') else 'FAILED'}")
    print(f"  Test User: {test_user_id}")
    print(f"\nCheck portal logs for any errors: pm2 logs web --lines 50")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
