var { createClient } = require('@supabase/supabase-js');
var c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Test insert to see what columns exist
  var r = await c.from('instances').select('*').limit(0);
  console.log('instances columns error:', r.error ? r.error.message : 'OK');
  
  // Try a dummy insert to see schema validation
  var r2 = await c.from('instances').insert({
    user_id: '00000000-0000-0000-0000-000000000001',
    status: 'provisioning',
    created_at: new Date().toISOString()
  }).select().single();
  
  if (r2.error) {
    console.log('insert test error:', r2.error.message, r2.error.details, r2.error.hint);
  } else {
    console.log('insert test OK, columns:', Object.keys(r2.data));
    // Clean up
    await c.from('instances').delete().eq('id', r2.data.id);
    console.log('cleaned up test row');
  }
}

check().catch(function(e) { console.error(e); });
