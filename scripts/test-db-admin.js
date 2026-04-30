import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dcvrkpgvxqdcboostkpz.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  console.log('Data:', data)
  console.log('Error:', error)
}

test()