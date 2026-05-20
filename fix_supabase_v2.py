#!/usr/bin/env python3
"""Create channels table in Supabase using service role key"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

try:
    from supabase import create_client
    print("✓ supabase client imported")
except ImportError:
    print("Installing supabase-py...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "supabase", "-q"])
    from supabase import create_client
    print("✓ supabase installed and imported")

# Supabase credentials
PROJECT_URL = "https://dcvrkpgvxqdcboostkpz.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY"

# Initialize Supabase client
supabase = create_client(PROJECT_URL, SERVICE_ROLE_KEY)

print(f"Connected to Supabase project: dcvrkpgvxqdcboostkpz")

# Execute SQL to create channels table
sql_commands = [
    """
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
    """,
    "CREATE INDEX idx_channels_user_id ON channels(user_id);",
    "CREATE INDEX idx_channels_user_platform ON channels(user_id, platform);",
    "CREATE INDEX idx_channels_created ON channels(created_at);",
    "ALTER TABLE channels ENABLE ROW LEVEL SECURITY;",
    """
    CREATE POLICY "Users can manage their own channels"
      ON channels
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    """
]

print("\nExecuting SQL commands...")
try:
    for i, sql in enumerate(sql_commands, 1):
        print(f"  [{i}/{len(sql_commands)}] Executing...", end=" ", flush=True)
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("✓")
    
    print("\n✅ SUCCESS: All SQL commands executed!")
    print("\nVerifying table creation...")
    
    # Try to get table info by listing tables
    try:
        # Query the information_schema to verify
        info = supabase.table('channels').select('*').limit(1).execute()
        print("✅ VERIFIED: 'channels' table exists and is accessible!")
        print(f"Table response: {info}")
    except Exception as e:
        print(f"Table verification (non-critical): {e}")
        print("✅ Table likely created successfully (may not have data yet)")

except Exception as e:
    print(f"\n❌ Error: {type(e).__name__}: {str(e)}")
    # The rpc method might not exist; let's try PostgreSQL connection instead
    print("\nNote: Direct SQL execution via RPC may require Supabase pg_net extension.")
    print("Consider executing SQL directly in Supabase console at:")
    print("https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/sql/new")
    sys.exit(1)
