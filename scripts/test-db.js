import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dcvrkpgvxqdcboostkpz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDYyODIsImV4cCI6MjA5MDU4MjI4Mn0.xgfGg_l1aXrlZX2Hjz45ZfGIFl8-JE3Dl8vmsrFhmKg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  console.log('Data:', data)
  console.log('Error:', error)
}

test()
