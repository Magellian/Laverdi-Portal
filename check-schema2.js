var { createClient } = require('@supabase/supabase-js');
var c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  var r = await c.from('instances').insert({
    user_id: '00000000-0000-0000-0000-000000000001',
    container_id: 'placeholder',
    status: 'provisioning',
    created_at: new Date().toISOString()
  }).select().single();
  
  if (r.error) {
    console.log('error:', r.error.message, r.error.details);
  } else {
    console.log('columns:', Object.keys(r.data).join(', '));
    console.log('data:', JSON.stringify(r.data, null, 2));
    await c.from('instances').delete().eq('id', r.data.id);
    console.log('cleaned up');
  }
}

check().catch(function(e) { console.error(e); });
