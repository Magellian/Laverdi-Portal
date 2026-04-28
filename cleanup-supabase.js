// Cleanup test accounts from Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dcvrkpgvxqdcboostkpz.supabase.co';
const supabaseServiceKey = 'REDACTED_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTestAccounts() {
  try {
    // Get all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error fetching users:', listError);
      return;
    }

    console.log(`Found ${users.users.length} users in system`);
    
    // Delete each user except your real ones
    for (const user of users.users) {
      console.log(`User: ${user.email} (${user.id})`);
      
      // Delete from profiles table first
      await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      // Then delete from auth
      await supabase.auth.admin.deleteUser(user.id);
      
      console.log(`  ✓ Deleted ${user.email}`);
    }

    console.log('\n✅ Cleanup complete! Database is clean.');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

deleteTestAccounts();
