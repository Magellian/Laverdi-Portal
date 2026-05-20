import requests
import json

# Supabase credentials
project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

# SQL to execute
sql = """
-- Create channels table
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

-- Add indexes for performance
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_user_platform ON channels(user_id, platform);
CREATE INDEX idx_channels_created ON channels(created_at);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only see/edit their own channels
CREATE POLICY "Users can manage their own channels"
  ON channels
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
"""

# Headers
headers = {
    "Authorization": f"Bearer {service_role_key}",
    "apikey": service_role_key,
    "Content-Type": "application/json"
}

# Endpoint for executing raw SQL via RPC
url = f"{project_url}/rest/v1/rpc/sql"

# Payload
payload = {
    "query": sql
}

try:
    print("Sending SQL to Supabase...")
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code in [200, 201]:
        print("\n✅ SQL executed successfully!")
    else:
        print(f"\n❌ Error: {response.status_code}")
        
except Exception as e:
    print(f"Error: {e}")
