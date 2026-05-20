import subprocess
import json

project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

sql = """CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'discord', 'slack', 'signal', 'whatsapp')),
  token TEXT NOT NULL,
  webhook_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  config JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, platform)
);
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_user_platform ON channels(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_channels_created ON channels(created_at);
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage their own channels" ON channels USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);"""

# Create JSON payload
payload = json.dumps({"query": sql})

print("[*] Executing SQL via Supabase REST API...")
print(f"[*] URL: {project_url}/rest/v1/rpc/run_sql")

# Use subprocess to run curl with proper escaping
cmd = [
    "curl.exe",
    "-X", "POST",
    f"{project_url}/rest/v1/rpc/run_sql",
    "-H", f"Authorization: Bearer {service_role_key}",
    "-H", f"apikey: {service_role_key}",
    "-H", "Content-Type: application/json",
    "-d", payload
]

try:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    print(f"\n[*] Status Code: (curl return code {result.returncode})")
    print(f"[*] Response:\n{result.stdout}")
    if result.stderr:
        print(f"[*] Errors:\n{result.stderr}")
except Exception as e:
    print(f"[-] Error: {e}")
