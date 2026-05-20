#!/usr/bin/env python3
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"
KEEP_ID = "41b535c2-ca64-441d-aef3-4113702442b7"
VULTR_KEY = "7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[CLEANUP] Vultr Instances\n")
    print(f"KEEP: {KEEP_ID}")
    print(f"DELETE: All others\n")
    
    cleanup_script = f"""
(async () => {{
  const {{ createClient }} = require('@supabase/supabase-js');
  const supabase = createClient('https://dcvrkpgvxqdcboostkpz.supabase.co', '{SERVICE_ROLE_KEY}');
  
  try {{
    // Get all instances
    console.log('[1] Fetching instances...');
    const {{ data: instances }} = await supabase
      .from('instances')
      .select('container_id')
      .neq('container_id', '{KEEP_ID}');
    
    if (!instances || instances.length === 0) {{
      console.log('[OK] No instances to delete (or all are kept)');
      process.exit(0);
    }}
    
    console.log('[OK] Found ' + instances.length + ' instances to delete');
    console.log('');
    
    const vultr_key = '{VULTR_KEY}';
    let deleted = 0;
    let failed = 0;
    
    for (const inst of instances) {{
      const id = inst.container_id;
      process.stdout.write('[' + (deleted + failed + 1) + '/' + instances.length + '] Deleting ' + id.substring(0, 8) + '... ');
      
      try {{
        const res = await fetch('https://api.vultr.com/v2/instances/' + id, {{
          method: 'DELETE',
          headers: {{ 'Authorization': 'Bearer ' + vultr_key }}
        }});
        
        if (res.ok || res.status === 204) {{
          console.log('[OK]');
          deleted++;
        }} else {{
          console.log('[FAIL] Status ' + res.status);
          failed++;
        }}
      }} catch (e) {{
        console.log('[ERROR] ' + e.message);
        failed++;
      }}
      
      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }}
    
    console.log('');
    console.log('Summary:');
    console.log('  Deleted: ' + deleted);
    console.log('  Failed: ' + failed);
    console.log('  Kept: {KEEP_ID}');
    
  }} catch (e) {{
    console.error('[FATAL] ' + e.message);
    process.exit(1);
  }}
}})();
"""
    
    print("[1] Writing cleanup script...")
    stdin, stdout, stderr = client.exec_command("cat > /root/laverdi-portal/cleanup.js << 'EOJS'\n" + cleanup_script + "\nEOJS")
    stdin.close()
    stdout.read()
    print("[OK]\n")
    
    print("[2] Executing cleanup...")
    print("=" * 70)
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && timeout 120 node cleanup.js")
    
    output = stdout.read().decode()
    print(output)
    
    errs = stderr.read().decode()
    if errs and len(errs.strip()) > 0:
        print("Stderr:", errs[:300])
    
    print("=" * 70)
    print("\n[DONE] Cleanup complete")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
