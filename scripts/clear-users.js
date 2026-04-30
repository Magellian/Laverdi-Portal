import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dcvrkpgvxqdcboostkpz.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function clearUsers() {
  console.log('Fetching users from auth...')
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  console.log(`Found ${users.length} users.`)

  for (const user of users) {
    console.log(`Deleting user: ${user.email} (${user.id})...`)
    
    // Delete from public.users first (if exists)
    const { error: dbError } = await supabase.from('users').delete().eq('id', user.id)
    if (dbError) console.error(`DB delete error for ${user.email}:`, dbError)

    // Delete from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
    if (authError) {
      console.error(`Auth delete error for ${user.email}:`, authError)
    } else {
      console.log(`Successfully deleted ${user.email}`)
    }
  }
}

clearUsers()
