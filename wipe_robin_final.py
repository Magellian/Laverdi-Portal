#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
robin_email = "rcoleman0624@gmail.com"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[WIPE] Robin's Account - Final Attempt\n")
    
    # Create a bulletproof Node.js script
    wipe_code = """
(async () => {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://dcvrkpgvxqdcboostkpz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzI2MTgwNSwiZXhwIjoxNzM5Mzc2MDA1fQ.nGjqRGflmfbgqb3ynZXF9LWxKfVQrB9wW9V_yNVhvLo'
  );
  
  try {
    console.log('[1] Finding user: rcoleman0624@gmail.com');
    
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'rcoleman0624@gmail.com')
      .single();
    
    if (userErr && userErr.code === 'PGRST116') {
      console.log('[NOT_FOUND] User does not exist');
      process.exit(0);
    }
    
    if (userErr) {
      throw new Error('User lookup failed: ' + userErr.message);
    }
    
    if (!users || !users.id) {
      console.log('[NOT_FOUND] No user ID returned');
      process.exit(0);
    }
    
    const robin_id = users.id;
    console.log('[FOUND] Robin ID: ' + robin_id);
    
    // Get instance info
    console.log('[2] Looking up instance...');
    const { data: instances } = await supabase
      .from('instances')
      .select('container_id, ip_address')
      .eq('user_id', robin_id);
    
    if (instances && instances.length > 0) {
      const inst = instances[0];
      console.log('[FOUND] Instance ID: ' + inst.container_id);
      console.log('[INFO] Instance IP: ' + (inst.ip_address || 'PENDING'));
      
      // Try to delete from Vultr
      if (inst.container_id && inst.container_id.length > 10) {
        console.log('[3] Terminating Vultr instance...');
        const vultr_key = process.env.VULTR_API_KEY || '7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA';
        
        const vultr_resp = await fetch('https://api.vultr.com/v2/instances/' + inst.container_id, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + vultr_key }
        });
        
        console.log('[' + (vultr_resp.ok ? 'OK' : 'WARN') + '] Vultr status: ' + vultr_resp.status);
      }
    } else {
      console.log('[INFO] No instances found');
    }
    
    // Delete from instances table
    console.log('[4] Deleting instances from database...');
    const { error: del_inst_err } = await supabase
      .from('instances')
      .delete()
      .eq('user_id', robin_id);
    
    if (del_inst_err) throw new Error('Delete instances failed: ' + del_inst_err.message);
    console.log('[OK] Instances deleted');
    
    // Delete user
    console.log('[5] Deleting user from database...');
    const { error: del_user_err } = await supabase
      .from('users')
      .delete()
      .eq('id', robin_id);
    
    if (del_user_err) throw new Error('Delete user failed: ' + del_user_err.message);
    console.log('[OK] User deleted');
    
    console.log('\\n========================================');
    console.log('[SUCCESS] Robin wiped successfully');
    console.log('========================================');
    console.log('User ID: ' + robin_id);
    console.log('\\nRobin can now sign up fresh at:');
    console.log('https://laverdi.tech/auth/signup');
    
  } catch (error) {
    console.error('[FATAL] ' + error.message);
    process.exit(1);
  }
})();
"""
    
    print("[1] Writing wipe script to portal...")
    stdin, stdout, stderr = client.exec_command("cat > /root/laverdi-portal/delete_robin.js << 'EOJS'\n" + wipe_code + "\nEOJS")
    stdin.close()
    stdout.read()
    print("[OK]\n")
    
    print("[2] Executing wipe script...")
    print("=" * 60)
    
    # Run from portal directory with env
    stdin, stdout, stderr = client.exec_command("""
cd /root/laverdi-portal
VULTR_API_KEY=7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA node delete_robin.js
""")
    
    output = stdout.read().decode()
    print(output)
    
    errors = stderr.read().decode()
    if errors:
        print("\nStderr output:")
        print(errors[:500])
    
    print("=" * 60)
    
    # Verify deletion
    print("\n[3] Verifying deletion...")
    stdin, stdout, stderr = client.exec_command("""
cd /root/laverdi-portal
node << 'EOJS'
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dcvrkpgvxqdcboostkpz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzI2MTgwNSwiZXhwIjoxNzM5Mzc2MDA1fQ.nGjqRGflmfbgqb3ynZXF9LWxKfVQrB9wW9V_yNVhvLo');
supabase.from('users').select('id').eq('email', 'rcoleman0624@gmail.com').single().then(({data, error}) => {
  if (error && error.code === 'PGRST116') {
    console.log('[VERIFIED] Robin not in database');
  } else if (error) {
    console.log('[ERROR] ' + error.message);
  } else if (data) {
    console.log('[WARNING] Robin still exists');
  }
  process.exit(0);
});
EOJS
""")
    
    verify = stdout.read().decode()
    print(verify)
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
