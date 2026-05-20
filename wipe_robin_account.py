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
robin_email = "rcoleman0624@gmail.com"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[WIPE] Robin's Account Removal")
    print(f"Email: {robin_email}\n")
    
    # STEP 1: Query for Robin's user ID and instance
    print("[1] Looking up Robin's account...")
    stdin, stdout, stderr = client.exec_command("""curl -s https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/users?email=eq.{} \\
      -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" \\
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" 2>/dev/null | python3 -m json.tool""".format(robin_email))
    
    user_response = stdout.read().decode()
    print(user_response)
    
    # Parse response
    try:
        users = json.loads(user_response)
        if not users or len(users) == 0:
            print(f"\n[ERROR] No user found with email {robin_email}")
            sys.exit(1)
        
        robin_id = users[0].get('id')
        print(f"\n[OK] Found Robin!")
        print(f"     User ID: {robin_id}")
    except:
        print(f"\n[ERROR] Could not parse user response")
        sys.exit(1)
    
    # STEP 2: Get her instance info
    print(f"\n[2] Looking up Robin's instance...")
    stdin, stdout, stderr = client.exec_command(f"""curl -s https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances?user_id=eq.{robin_id} \\
      -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" \\
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" 2>/dev/null | python3 -m json.tool""")
    
    instances_response = stdout.read().decode()
    
    instance_id = None
    instance_ip = None
    
    try:
        instances = json.loads(instances_response)
        if instances and len(instances) > 0:
            instance_id = instances[0].get('container_id')
            instance_ip = instances[0].get('ip_address')
            print(f"[OK] Found instance:")
            print(f"     Instance ID: {instance_id}")
            print(f"     IP: {instance_ip}")
        else:
            print(f"[INFO] No instance found for Robin")
    except:
        print(f"[WARN] Could not parse instances response")
    
    # STEP 3: Terminate instance on Vultr (if exists)
    if instance_id:
        print(f"\n[3] Terminating Vultr instance {instance_id}...")
        stdin, stdout, stderr = client.exec_command(f"""curl -s -X DELETE -H "Authorization: Bearer $VULTR_API_KEY" \\
          https://api.vultr.com/v2/instances/{instance_id} 2>/dev/null && echo "[OK] Instance terminated" || echo "[WARN] Termination may have failed" """)
        
        term_result = stdout.read().decode()
        print(term_result.strip())
    else:
        print(f"\n[3] No instance to terminate")
    
    # STEP 4: Delete from instances table
    print(f"\n[4] Deleting instance records from Supabase...")
    stdin, stdout, stderr = client.exec_command(f"""curl -s -X DELETE "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances?user_id=eq.{robin_id}" \\
      -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" \\
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" 2>/dev/null && echo "[OK] Instances deleted" || echo "[WARN] Delete may have failed" """)
    
    del_result = stdout.read().decode()
    print(del_result.strip())
    
    # STEP 5: Delete user record
    print(f"\n[5] Deleting user from Supabase...")
    stdin, stdout, stderr = client.exec_command(f"""curl -s -X DELETE "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/users?id=eq.{robin_id}" \\
      -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" \\
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk" 2>/dev/null && echo "[OK] User deleted" || echo "[WARN] Delete may have failed" """)
    
    user_del_result = stdout.read().decode()
    print(user_del_result.strip())
    
    # STEP 6: Summary
    print(f"\n{'='*60}")
    print(f"[COMPLETE] Robin's account wiped")
    print(f"{'='*60}")
    print(f"\nRemoved:")
    print(f"  ✓ User ID: {robin_id}")
    if instance_id:
        print(f"  ✓ Vultr instance: {instance_id}")
    print(f"  ✓ All instances and related data")
    print(f"\nRobin can now create a fresh account at:")
    print(f"  https://laverdi.tech/auth/signup")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
