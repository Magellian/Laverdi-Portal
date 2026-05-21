#!/usr/bin/env python3
"""
Recreate the channels table with proper schema.
Uses Supabase RPC to execute SQL.
"""
import requests
import json

serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

headers = {
    "apikey": serviceKey,
    "Authorization": f"Bearer {serviceKey}",
    "Content-Type": "application/json"
}

# First, try to DROP and recreate the table
sql = """
-- Drop existing table if it exists
DROP TABLE IF EXISTS public.channels CASCADE;

-- Create new channels table with proper schema
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel_name VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB,
  connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_user_channel UNIQUE(user_id, channel_name)
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own channels" 
  ON public.channels FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channels"
  ON public.channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
  ON public.channels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
  ON public.channels FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_channels_user_id ON public.channels(user_id);
CREATE INDEX idx_channels_channel_name ON public.channels(channel_name);

-- Grant permissions to service role (for command center)
GRANT ALL ON public.channels TO service_role;
"""

print("Attempting to recreate channels table...")
print("Note: This requires admin access to the Supabase database.")
print()

# Try via RPC - Supabase SQL Editor endpoint
resp = requests.post(
    "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/rpc/sql",
    headers=headers,
    json={"query": sql}
)

print(f"Status: {resp.status_code}")
if resp.status_code in (200, 201):
    print("✅ Table recreated successfully!")
    print(json.dumps(resp.json(), indent=2))
else:
    print(f"❌ Error: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    print()
    print("Note: If RPC endpoint doesn't work, you'll need to run the SQL manually in Supabase dashboard:")
    print("1. Go to https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/sql")
    print("2. Create new query")
    print("3. Paste the SQL above")
    print("4. Run it")
