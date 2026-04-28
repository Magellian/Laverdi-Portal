$env:NEXT_PUBLIC_SUPABASE_URL = "https://dcvrkpgvxqdcboostkpz.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "REDACTED_SUPABASE_ANON_KEY"
$env:SUPABASE_SERVICE_ROLE_KEY = "REDACTED_SUPABASE_SERVICE_ROLE_KEY"

Set-Location "C:\Users\chris\.openclaw\workspace"
node full-portal-test.js
