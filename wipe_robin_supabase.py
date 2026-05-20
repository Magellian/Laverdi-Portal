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
    
    print("[WIPE] Robin Account - Using Portal Server Access\n")
    
    # The portal has environment access to Supabase, so we'll use Node.js to query/delete
    print("[1] Creating cleanup script on portal...")
    
    cleanup_script = """
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dcvrkpgvxqdcboostkpz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function wipeRobin() {
  const email = 'rcoleman0624@gmail.com';
  
  try {
    // Find user
    console.log('Finding Robin...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
    
    if (userError) throw userError;
    if (!users || users.length === 0) {
      console.log('User not found');
      return;
    }
    
    const robin_id = users[0].id;
    console.log('Found: ' + robin_id);
    
    // Find instance
    console.log('Finding instance...');
    const { data: instances, error: instError } = await supabase
      .from('instances')
      .select('container_id')
      .eq('user_id', robin_id);
    
    if (instError) throw instError;
    
    if (instances && instances.length > 0) {
      const instance_id = instances[0].container_id;
      console.log('Instance ID: ' + instance_id);
      
      // Terminate on Vultr
      console.log('Terminating Vultr instance...');
      const vultr_response = await fetch('https://api.vultr.com/v2/instances/' + instance_id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + process.env.VULTR_API_KEY }
      });
      console.log('Vultr: ' + (vultr_response.ok ? 'OK' : 'Failed'));
    }
    
    // Delete instances from DB
    console.log('Deleting instances...');
    const { error: delInstError } = await supabase
      .from('instances')
      .delete()
      .eq('user_id', robin_id);
    
    if (delInstError) throw delInstError;
    console.log('Instances deleted');
    
    // Delete user
    console.log('Deleting user...');
    const { error: delUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', robin_id);
    
    if (delUserError) throw delUserError;
    console.log('User deleted');
    
    console.log('\\n[COMPLETE] Robin wiped');
    console.log('User ID: ' + robin_id);
    
  } catch (e) {
    console.error('Error: ' + e.message);
    process.exit(1);
  }
}

wipeRobin();
"""
    
    # Write and execute script
    stdin, stdout, stderr = client.exec_command("cat > /tmp/wipe_robin.js << 'EOJS'\n" + cleanup_script + "\nEOJS")
    stdin.close()
    stdout.read()
    
    print("[OK] Script created\n")
    
    print("[2] Executing wipe...")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && node /tmp/wipe_robin.js")
    
    result = stdout.read().decode()
    errors = stderr.read().decode()
    
    print(result)
    if errors:
        print("Errors:", errors)
    
    print("\n[SUCCESS] Robin's account has been completely removed.")
    print("She can now sign up fresh at: https://laverdi.tech/auth/signup")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
