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
    
    print("[AUDIT] Instance Ownership Check\n")
    
    script = f"""
const {{ createClient }} = require('@supabase/supabase-js');
const supabase = createClient('https://dcvrkpgvxqdcboostkpz.supabase.co', '{SERVICE_ROLE_KEY}');

(async () => {{
  const {{ data: instances }} = await supabase
    .from('instances')
    .select('id, user_id, container_id, ip_address, created_at')
    .order('created_at', {{ ascending: false }});
  
  if (!instances || instances.length === 0) {{
    console.log('No instances in database');
    process.exit(0);
  }}
  
  console.log('Instances in database: ' + instances.length);
  console.log('');
  
  // Get all users
  const {{ data: users }} = await supabase.from('users').select('id, email');
  const userMap = {{}};
  users.forEach(u => {{ userMap[u.id] = u.email; }});
  
  const keep = '41b535c2-ca64-441d-aef3-4113702442b7';
  
  console.log('KEEP:');
  instances.filter(i => i.container_id === keep).forEach(inst => {{
    const email = userMap[inst.user_id] || '???';
    console.log('  ' + inst.container_id.substring(0, 8) + ' | User: ' + email + ' | Created: ' + inst.created_at.substring(0, 10));
  }});
  
  const others = instances.filter(i => i.container_id !== keep);
  console.log('');
  console.log('DELETE (not real users):');
  const testPatterns = ['test', '@example.com', 'dummy', 'temp'];
  const toDelete = [];
  
  others.forEach(inst => {{
    const email = userMap[inst.user_id] || 'ORPHANED';
    const isTest = testPatterns.some(p => email.toLowerCase().includes(p)) || email === 'ORPHANED';
    if (isTest) {{
      toDelete.push(inst);
      console.log('  [DELETE] ' + inst.container_id.substring(0, 8) + ' | ' + email + ' | ' + inst.created_at.substring(0, 10));
    }}
  }});
  
  console.log('');
  console.log('REVIEW (real emails):');
  others.forEach(inst => {{
    const email = userMap[inst.user_id] || 'ORPHANED';
    const isTest = testPatterns.some(p => email.toLowerCase().includes(p)) || email === 'ORPHANED';
    if (!isTest) {{
      console.log('  [REVIEW] ' + inst.container_id.substring(0, 8) + ' | ' + email + ' | ' + inst.created_at.substring(0, 10));
    }}
  }});
  
  console.log('');
  console.log('Summary:');
  console.log('  Keep: 1');
  console.log('  Delete (test): ' + toDelete.length);
  console.log('  Review (real): ' + (others.length - toDelete.length));
  
}})();
"""
    
    stdin, stdout, stderr = client.exec_command("cat > /tmp/audit.js << 'EOF'\n" + script + "\nEOF")
    stdin.close()
    stdout.read()
    
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && timeout 10 node /tmp/audit.js")
    
    output = stdout.read().decode()
    print(output)
    
    errs = stderr.read().decode()
    if errs and len(errs.strip()) > 0:
        print("Errors:", errs[:200])
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
