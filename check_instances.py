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
    
    print("[INFO] Checking recent instances in database...")
    
    # Check recent provision calls in the npm logs
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && tail -50 /var/log/pm2/*.log 2>/dev/null | grep -i 'instance\\|provision' | tail -10")
    logs = stdout.read().decode()
    
    if logs:
        print("[OK] Recent provision activity:")
        print(logs)
    else:
        print("[WARN] No recent provision logs found")
    
    # Check if there are any instances in the database
    print("\n[INFO] Checking Supabase instances table...")
    stdin, stdout, stderr = client.exec_command("curl -s https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances?limit=5&order=created_at.desc -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk' 2>/dev/null | python3 -c 'import sys, json; d=json.load(sys.stdin); [print(f\"ID: {i[\\\"id\\\"]} | User: {i[\\\"user_id\\\"][:8]} | Status: {i[\\\"status\\\"]} | IP: {i.get(\\\"ip_address\\\", \\\"NONE\\\")}\") for i in d[:5]]'")
    
    instances = stdout.read().decode()
    if instances:
        print("[OK] Recent instances:")
        print(instances)
    else:
        print("[WARN] No instances found or query failed")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
