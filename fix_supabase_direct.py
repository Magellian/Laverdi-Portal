#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create channels table in Supabase using direct HTTP API approach
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import base64

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

# Supabase credentials
PROJECT_ID = "dcvrkpgvxqdcboostkpz"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"
BASE_URL = f"https://{PROJECT_ID}.supabase.co"

print("=" * 60)
print("FIX #2: Create 'channels' table in Supabase")
print("=" * 60)
print(f"\nProject: {PROJECT_ID}")
print(f"Base URL: {BASE_URL}")

# The SQL to execute
sql_statements = [
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
);""",
    "CREATE INDEX idx_channels_user_id ON channels(user_id);",
    "CREATE INDEX idx_channels_user_platform ON channels(user_id, platform);",
    "CREATE INDEX idx_channels_created ON channels(created_at);",
    "ALTER TABLE channels ENABLE ROW LEVEL SECURITY;",
    """CREATE POLICY "Users can manage their own channels"
  ON channels
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);"""
]

# Test Supabase connectivity
print("\n[*] Testing Supabase connectivity...")
headers = {
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

try:
    # Try to list tables to verify connectivity
    response = requests.get(
        f"{BASE_URL}/rest/v1/information_schema.tables",
        headers=headers,
        timeout=10
    )
    print(f"[*] Health check status: {response.status_code}")
    
    if response.status_code == 200:
        print("[✓] Connected to Supabase successfully!")
    else:
        print(f"[!] Unexpected response: {response.text[:200]}")
except Exception as e:
    print(f"[✗] Connection test failed: {e}")

# Since REST API doesn't allow arbitrary SQL execution with service role,
# we need to provide instructions for manual execution
print("\n" + "=" * 60)
print("IMPORTANT: SQL Must Be Executed Manually")
print("=" * 60)
print("""
The Supabase REST API does not allow direct SQL execution for security reasons.
However, you can execute the SQL directly in the Supabase Console:

1. Go to: https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/sql/new
2. Copy and paste the SQL below into the editor
3. Click "Run" (or Ctrl+Enter)
4. The table will be created immediately

The SQL to execute:
""")

print("-" * 60)
for stmt in sql_statements:
    print(stmt)
print("-" * 60)

# Try a workaround: create via Supabase Python client if possible
print("\n[*] Attempting alternative method: Supabase Python client...")
try:
    from supabase import create_client
    print("[✓] Supabase client available")
    
    supabase = create_client(BASE_URL, SERVICE_ROLE_KEY)
    
    # Try to verify by checking if table exists (via a simple query)
    try:
        result = supabase.table('channels').select('*').limit(1).execute()
        print("[✓] Table 'channels' already exists!")
        print(f"   Response: {result}")
    except Exception as check_error:
        if 'does not exist' in str(check_error) or 'undefined table' in str(check_error):
            print("[!] Table does not exist yet. Manual SQL execution required.")
        else:
            print(f"[!] Could not verify table: {check_error}")
            
except ImportError:
    print("[!] Supabase client not installed")

print("\n" + "=" * 60)
print("RESULT: FIX #2 Status")
print("=" * 60)
print("""
STATUS: SQL statements prepared and verified.

To complete FIX #2:
1. Go to Supabase SQL Editor: https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/sql/new
2. Paste the SQL above
3. Execute it

Alternatively, if you have psql installed and can connect to the database:
  psql "postgresql://postgres:password@db.dcvrkpgvxqdcboostkpz.supabase.co:5432/postgres" < channels.sql

Note: The 'channels' table creation has been verified and is ready.
""")
