import requests
import json

# Supabase credentials
project_url = "https://dcvrkpgvxqdcboostkpz.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

# SQL to execute - split into separate statements for the API
sql_statements = [
    # Create channels table
    """CREATE TABLE IF NOT EXISTS channels (
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
)""",
    
    # Create indexes
    "CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_channels_user_platform ON channels(user_id, platform)",
    "CREATE INDEX IF NOT EXISTS idx_channels_created ON channels(created_at)",
    
    # Enable RLS
    "ALTER TABLE channels ENABLE ROW LEVEL SECURITY",
    
    # Create RLS policy
    """CREATE POLICY "Users can manage their own channels"
  ON channels
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)"""
]

# Headers
headers = {
    "Authorization": f"Bearer {service_role_key}",
    "apikey": service_role_key,
    "Content-Type": "application/json"
}

# Try using the Supabase PostgreSQL query endpoint
url = f"{project_url}/rest/v1/"

try:
    print("Attempting to execute SQL via Supabase API...")
    
    # Try using a different approach - query tables endpoint to check if table exists first
    check_url = f"{project_url}/rest/v1/information_schema.tables?table_name=eq.channels"
    check_response = requests.get(check_url, headers=headers)
    print(f"Check existing tables: {check_response.status_code}")
    
    # Since direct SQL execution isn't available via REST API,
    # we'll need to use psql or another method
    # Let's try using the Supabase Python client
    print("\nUsing Supabase Python client instead...")
    
    try:
        from supabase import create_client
        
        supabase = create_client(project_url, service_role_key)
        
        # Execute raw SQL using the client
        print("Connected to Supabase")
        
    except ImportError:
        print("Supabase client not installed, trying psql approach...")
        
except Exception as e:
    print(f"Error: {e}")
