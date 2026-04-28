const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dcvrkpgvxqdcboostkpz.supabase.co',
  'REDACTED_SUPABASE_SERVICE_ROLE_KEY'
);

(async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ tier: 'professional' })
      .eq('email', 'shell@fig.com')
      .select();
    
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Updated successfully:', data);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
  process.exit(0);
})();
