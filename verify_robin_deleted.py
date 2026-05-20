#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
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
    
    print("[VERIFY] Checking if Robin's account was deleted...\n")
    
    # Check if wipe script completed
    print("[1] Checking script output...")
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/wipe_robin.js.log 2>/dev/null || echo 'No log yet'")
    log = stdout.read().decode()
    if log and 'No log' not in log:
        print(log)
    
    # Query Supabase directly to verify
    print("\n[2] Querying Supabase for Robin...")
    stdin, stdout, stderr = client.exec_command(f"""node << 'EOJS'
const {{ createClient }} = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dcvrkpgvxqdcboostkpz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNjE4MDUsImV4cCI6MTcwNjg1MzgwNX0.Dz6YU6qxN8o1Q96PqXLB5dW0H7YD6K2X8K7qKRUHmFk'
);

supabase
  .from('users')
  .select('id, email')
  .eq('email', '{robin_email}')
  .then({{ data, error }}) => {{
    if (error) {{
      console.log('[ERROR] ' + error.message);
      process.exit(1);
    }}
    if (data && data.length > 0) {{
      console.log('[FOUND] Robin still exists:');
      data.forEach(u => console.log('  - ' + u.email + ' (ID: ' + u.id + ')'));
      process.exit(1);
    }} else {{
      console.log('[DELETED] Robin not found - account successfully removed');
      process.exit(0);
    }}
  }});
EOJS
""")
    
    result = stdout.read().decode()
    print(result)
    
    err = stderr.read().decode()
    if err:
        print("Stderr:", err[:200])
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
