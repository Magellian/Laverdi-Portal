#!/usr/bin/env python3
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

# Correct service role key from .env
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[WIPE] Robin's Account - With Correct API Key\n")
    
    wipe_code = f"""
(async () => {{
  const {{ createClient }} = require('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://dcvrkpgvxqdcboostkpz.supabase.co',
    '{SERVICE_ROLE_KEY}'
  );
  
  try {{
    console.log('[1] Finding user: rcoleman0624@gmail.com');
    
    const {{ data: users, error: userErr }} = await supabase
      .from('users')
      .select('id')
      .eq('email', 'rcoleman0624@gmail.com')
      .single();
    
    if (userErr && userErr.code === 'PGRST116') {{
      console.log('[OK] User does not exist (already deleted?)');
      process.exit(0);
    }}
    
    if (userErr) {{
      throw new Error('Lookup failed: ' + userErr.message);
    }}
    
    if (!users || !users.id) {{
      console.log('[OK] No user found');
      process.exit(0);
    }}
    
    const robin_id = users.id;
    console.log('[FOUND] User ID: ' + robin_id);
    
    console.log('[2] Finding instances...');
    const {{ data: instances }} = await supabase
      .from('instances')
      .select('container_id')
      .eq('user_id', robin_id);
    
    if (instances && instances.length > 0) {{
      const inst_id = instances[0].container_id;
      console.log('[FOUND] Instance ID: ' + inst_id);
      
      console.log('[3] Terminating on Vultr...');
      const vultr_key = process.env.VULTR_API_KEY || '7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA';
      const res = await fetch('https://api.vultr.com/v2/instances/' + inst_id, {{
        method: 'DELETE',
        headers: {{ 'Authorization': 'Bearer ' + vultr_key }}
      }});
      console.log('[' + (res.ok ? 'OK' : 'WARN') + '] Vultr: ' + res.status);
    }} else {{
      console.log('[INFO] No instances');
    }}
    
    console.log('[4] Deleting instances from DB...');
    const {{ error: e1 }} = await supabase.from('instances').delete().eq('user_id', robin_id);
    if (e1) throw new Error('Delete instances: ' + e1.message);
    console.log('[OK] Done');
    
    console.log('[5] Deleting user...');
    const {{ error: e2 }} = await supabase.from('users').delete().eq('id', robin_id);
    if (e2) throw new Error('Delete user: ' + e2.message);
    console.log('[OK] Done');
    
    console.log('\\n' + '='.repeat(50));
    console.log('[SUCCESS] Robin wiped');
    console.log('='.repeat(50));
    console.log('User ID: ' + robin_id);
    
  }} catch (error) {{
    console.error('[FATAL] ' + error.message);
    process.exit(1);
  }}
}})();
"""
    
    print("[1] Writing script...")
    stdin, stdout, stderr = client.exec_command("cat > /root/laverdi-portal/wipe_robin.js << 'EOJS'\n" + wipe_code + "\nEOJS")
    stdin.close()
    stdout.read()
    print("[OK]\n")
    
    print("[2] Executing wipe...")
    print("=" * 60)
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && node wipe_robin.js")
    
    output = stdout.read().decode()
    print(output)
    
    errors = stderr.read().decode()
    if errors:
        print("Stderr:", errors[:300])
    
    print("=" * 60)
    print("\n[DONE] Wipe operation completed")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
