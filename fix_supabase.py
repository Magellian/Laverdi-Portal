import requests
import json

# Supabase credentials
PROJECT_ID = "dcvrkpgvxqdcboostkpz"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"
BASE_URL = f"https://{PROJECT_ID}.supabase.co"

sql_query = """-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
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

CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_user_platform ON channels(user_id, platform);
CREATE INDEX idx_channels_created ON channels(created_at);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own channels"
  ON channels
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
"""

headers = {
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

print("Attempting to create channels table via Supabase SQL API...")
print(f"Using Supabase project: {PROJECT_ID}")

# Try the query endpoint
url = f"{BASE_URL}/rest/v1/rpc/query"
payload = {"sql": sql_query}

try:
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code in [200, 201]:
        print("\n✅ SUCCESS: channels table created!")
    else:
        print(f"\n⚠️ Unexpected response. Full response:\n{response.text}")
except Exception as e:
    print(f"Error: {e}")
