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
    
    print("[WIPE] Robin Account Removal\n")
    
    # Create script in portal directory
    cleanup_script = """
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dcvrkpgvxqdcboostkpz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function wipeRobin() {
  const email = 'rcoleman0624@gmail.com';
  
  try {
    console.log('[1] Finding user...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
    
    if (userError) throw userError;
    if (!users || users.length === 0) {
      console.log('[NOTFOUND] User not in database');
      process.exit(0);
    }
    
    const robin_id = users[0].id;
    console.log('[OK] User ID: ' + robin_id);
    
    // Find instance
    console.log('[2] Finding instance...');
    const { data: instances, error: instError } = await supabase
      .from('instances')
      .select('container_id')
      .eq('user_id', robin_id);
    
    if (instError) throw instError;
    
    if (instances && instances.length > 0) {
      const instance_id = instances[0].container_id;
      console.log('[OK] Instance ID: ' + instance_id);
      
      console.log('[3] Terminating on Vultr...');
      const vultr_response = await fetch('https://api.vultr.com/v2/instances/' + instance_id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + process.env.VULTR_API_KEY }
      });
      console.log('[' + (vultr_response.ok ? 'OK' : 'WARN') + '] Vultr delete ' + (vultr_response.ok ? 'successful' : 'may have failed'));
    } else {
      console.log('[INFO] No instance found');
    }
    
    // Delete instances from DB
    console.log('[4] Deleting instances...');
    const { error: delInstError } = await supabase
      .from('instances')
      .delete()
      .eq('user_id', robin_id);
    
    if (delInstError) throw delInstError;
    console.log('[OK] Instances deleted');
    
    // Delete user
    console.log('[5] Deleting user...');
    const { error: delUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', robin_id);
    
    if (delUserError) throw delUserError;
    console.log('[OK] User deleted');
    
    console.log('\\n[COMPLETE] Robin\\'s account wiped');
    console.log('She can now sign up fresh at: https://laverdi.tech/auth/signup');
    
  } catch (e) {
    console.error('[ERROR] ' + e.message);
    process.exit(1);
  }
}

wipeRobin();
"""
    
    # Write script in portal directory
    print("[1] Creating cleanup script...")
    stdin, stdout, stderr = client.exec_command("cat > /root/laverdi-portal/wipe_robin.js << 'EOJS'\n" + cleanup_script + "\nEOJS")
    stdin.close()
    stdout.read()
    print("[OK]\n")
    
    # Execute from portal directory
    print("[2] Executing wipe (this may take a moment)...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzI2MTgwNSwiZXhwIjoxNzM5Mzc2MDA1fQ.nGjqRGflmfbgqb3ynZXF9LWxKfVQrB9wW9V_yNVhvLo node wipe_robin.js")
    
    result = stdout.read().decode()
    errors = stderr.read().decode()
    
    print(result)
    if errors and "Error" in errors:
        print("\nErrors:")
        print(errors[:500])
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
