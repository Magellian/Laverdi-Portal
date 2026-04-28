var { createClient } = require('@supabase/supabase-js');
var c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
  // Delete from child tables first
  var tables = ['instances', 'api_keys', 'usage_logs', 'subscriptions', 'users'];
  for (var t of tables) {
    var r = await c.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(t + ':', r.error ? r.error.message : 'cleared');
  }
  
  // Delete auth users
  var r6 = await c.auth.admin.listUsers();
  var users = r6.data ? r6.data.users : [];
  console.log('auth users to delete:', users.length);
  for (var u of users) {
    await c.auth.admin.deleteUser(u.id);
    console.log('deleted auth:', u.email);
  }
  console.log('DONE - all clean');
}

clean().catch(function(e) { console.error('Error:', e); });
