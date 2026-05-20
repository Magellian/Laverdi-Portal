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
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[INSTANCES] Checking database\n")
    
    # Query instances table
    script = f"""
const {{ createClient }} = require('@supabase/supabase-js');
const supabase = createClient('https://dcvrkpgvxqdcboostkpz.supabase.co', '{SERVICE_ROLE_KEY}');

(async () => {{
  const {{ data: instances, error }} = await supabase
    .from('instances')
    .select('id, user_id, container_id, ip_address, status, created_at')
    .order('created_at', {{ ascending: false }})
    .limit(50);
  
  if (error) {{
    console.error('Error:', error.message);
    process.exit(1);
  }}
  
  if (!instances || instances.length === 0) {{
    console.log('No instances in database');
    process.exit(0);
  }}
  
  console.log('Total instances: ' + instances.length);
  console.log('');
  console.log('Most recent:');
  
  instances.forEach((inst, i) => {{
    const id = inst.container_id.substring(0, 8);
    const ip = inst.ip_address || 'PENDING';
    const date = inst.created_at.split('T')[0];
    console.log(`${{i+1}}. ID: ${{id}}... | IP: ${{ip:18}} | Status: ${{inst.status:12}} | Created: ${{date}}`);
  }});
  
}})();
"""
    
    print("[1] Writing script...")
    stdin, stdout, stderr = client.exec_command("cat > /root/laverdi-portal/check_instances.js << 'EOJS'\n" + script + "\nEOJS")
    stdin.close()
    stdout.read()
    
    print("[2] Listing instances from database...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && node check_instances.js")
    
    output = stdout.read().decode()
    print(output)
    
    errors = stderr.read().decode()
    if errors:
        print("Error:", errors[:200])
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
