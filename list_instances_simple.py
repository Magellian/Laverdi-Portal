#!/usr/bin/env python3
import paramiko
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
    
    print("[INSTANCES] From Database\n")
    
    script = f"""
const {{ createClient }} = require('@supabase/supabase-js');
const supabase = createClient('https://dcvrkpgvxqdcboostkpz.supabase.co', '{SERVICE_ROLE_KEY}');

(async () => {{
  const {{ data: instances }} = await supabase
    .from('instances')
    .select('id, user_id, container_id, ip_address, status, created_at')
    .order('created_at', {{ ascending: false }})
    .limit(100);
  
  if (!instances || instances.length === 0) {{
    console.log('No instances');
    process.exit(0);
  }}
  
  console.log('Total: ' + instances.length);
  console.log('');
  
  instances.forEach((inst, idx) => {{
    const id = inst.container_id.substring(0, 8);
    const ip = inst.ip_address ? inst.ip_address.padEnd(16) : 'PENDING'.padEnd(16);
    const status = inst.status || '?';
    const date = inst.created_at.substring(0, 10);
    console.log((idx + 1) + '. ' + id + ' | ' + ip + ' | ' + status + ' | ' + date);
  }});
  
}})();
"""
    
    stdin, stdout, stderr = client.exec_command("cat > /tmp/list_inst.js << 'EOF'\n" + script + "\nEOF")
    stdin.close()
    stdout.read()
    
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && node /tmp/list_inst.js")
    
    output = stdout.read().decode()
    print(output)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
