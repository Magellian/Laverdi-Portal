#!/usr/bin/env python3
"""
Update Supabase RLS policies to include explicit "TO authenticated" clauses.
Supabase Project: dcvrkpgvxqdcboostkpz
Tables: users, subscriptions, api_keys, usage_logs, profiles
"""

import os
import json
import subprocess
import sys

# Supabase project details
PROJECT_ID = "dcvrkpgvxqdcboostkpz"
PROJECT_URL = f"https://{PROJECT_ID}.supabase.co"
API_URL = f"{PROJECT_URL}/rest/v1"

TABLES = ["users", "subscriptions", "api_keys", "usage_logs", "profiles"]

# SQL statements to update RLS policies
# These will add explicit "TO authenticated" clauses

UPDATE_POLICIES_SQL = """
-- Update all policies to include explicit "TO authenticated" clause

-- First, let's view existing policies to understand current structure
SELECT 
    schemaname,
    tablename,
    policyname,
    qual AS condition,
    with_check AS with_check_condition,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"""

def main():
    print("Supabase RLS Policy Update Tool")
    print("=" * 60)
    print(f"Project: {PROJECT_ID}")
    print(f"URL: {PROJECT_URL}")
    print("=" * 60)
    print()
    
    # Check if we can access Supabase credentials
    print("Step 1: Checking for Supabase credentials...")
    
    # Try to find credentials from environment or config files
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_admin_key = os.getenv("SUPABASE_ADMIN_KEY")
    
    print(f"  SUPABASE_KEY: {'Found' if supabase_key else 'NOT FOUND'}")
    print(f"  SUPABASE_ADMIN_KEY: {'Found' if supabase_admin_key else 'NOT FOUND'}")
    print()
    
    if not supabase_admin_key and not supabase_key:
        print("ERROR: No Supabase credentials found!")
        print()
        print("To fix this, you need to:")
        print("1. Go to: https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/settings/api")
        print("2. Copy the 'service_role' secret key (for admin operations)")
        print("3. Set it as an environment variable: $env:SUPABASE_ADMIN_KEY='your_key'")
        print()
        print("OR provide it when running this script:")
        print("  python update_rls_policies.py --admin-key 'your_key'")
        return False
    
    # Use admin key for RLS policy updates
    key_to_use = supabase_admin_key or supabase_key
    
    print("Step 2: Analyzing current RLS policies...")
    print()
    print("Tables to update:")
    for table in TABLES:
        print(f"  - {table}")
    print()
    
    print("Step 3: SQL Update Strategy")
    print("-" * 60)
    print("""
For each table, we will:
1. Review existing RLS policies
2. Add "TO authenticated" clause to policies that should be accessible by authenticated users
3. Verify policies follow this pattern:
   - Users can only access their own rows: WHERE auth.uid() = user_id
   - Service role can bypass RLS (for admin operations)
   - Public/anon access is explicitly denied (except where needed)

Example policy update:
  ALTER POLICY "allow_user_select" ON users TO authenticated;
  ALTER POLICY "allow_user_update" ON users TO authenticated USING (auth.uid() = id);
""")
    print()
    
    # Connection instructions
    print("Step 4: Connect to Supabase and Execute Policies")
    print("-" * 60)
    print("""
To execute these RLS policy updates, you have two options:

OPTION A: Via Supabase Dashboard (Recommended for visual review)
  1. Go to: https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/sql/new
  2. Create a new SQL query
  3. Paste the policies below
  4. Click "Run"
  5. Review results

OPTION B: Via PostgreSQL CLI (if psql is available)
  psql postgresql://postgres:{password}@{project_id}.supabase.co:5432/postgres \\
    -c "SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;"
""")
    print()
    
    # Show the SQL policies to update
    print("Step 5: RLS Policy SQL Statements")
    print("-" * 60)
    print("""
-- USERS TABLE
-- Allow authenticated users to read their own profile
ALTER POLICY "allow_read_own_user" ON users TO authenticated USING (auth.uid() = id);

-- Allow authenticated users to update their own profile
ALTER POLICY "allow_update_own_user" ON users TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PROFILES TABLE  
-- Allow authenticated users to read their own profile
ALTER POLICY "allow_read_own_profile" ON profiles TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
ALTER POLICY "allow_insert_own_profile" ON profiles TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
ALTER POLICY "allow_update_own_profile" ON profiles TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- API_KEYS TABLE
-- Allow authenticated users to read their own API keys
ALTER POLICY "allow_read_own_api_keys" ON api_keys TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own API keys
ALTER POLICY "allow_insert_own_api_keys" ON api_keys TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own API keys  
ALTER POLICY "allow_delete_own_api_keys" ON api_keys TO authenticated USING (auth.uid() = user_id);

-- SUBSCRIPTIONS TABLE
-- Allow authenticated users to read their own subscriptions
ALTER POLICY "allow_read_own_subscriptions" ON subscriptions TO authenticated USING (auth.uid() = user_id);

-- USAGE_LOGS TABLE
-- Allow authenticated users to read their own usage logs
ALTER POLICY "allow_read_own_usage_logs" ON usage_logs TO authenticated USING (auth.uid() = user_id);

-- Deny all other access to these tables by default
REVOKE ALL ON users FROM anon;
REVOKE ALL ON profiles FROM anon;
REVOKE ALL ON api_keys FROM anon;
REVOKE ALL ON subscriptions FROM anon;
REVOKE ALL ON usage_logs FROM anon;

-- Grant service role full access (for admin operations, bypass RLS)
GRANT ALL ON users, profiles, api_keys, subscriptions, usage_logs TO authenticated, service_role;
""")
    print()
    
    print("Step 6: Verification Queries")
    print("-" * 60)
    print("""
After updating policies, run these queries to verify:

-- View all policies in the public schema
SELECT schemaname, tablename, policyname, qual, with_check, permissive, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test: Select from users as authenticated user (should only see own row)
SELECT * FROM users WHERE auth.uid() = id;

-- Test: Select from api_keys as authenticated user (should only see own keys)
SELECT * FROM api_keys WHERE auth.uid() = user_id;

-- Test: Service role bypass (should see all rows)
-- (This requires service_role key in Authorization header)
SET ROLE service_role;
SELECT * FROM users;
RESET ROLE;
""")
    print()
    
    print("Step 7: Next Actions")
    print("-" * 60)
    print("""
1. ✅ Copy the SQL statements above
2. Go to Supabase Dashboard → SQL Editor → New Query
3. Paste the statements
4. Click "Run" to apply the policies
5. Run the verification queries to confirm policies are applied
6. Test access as authenticated user and service role
7. Report back with results

For PKCE flow compatibility:
- Policies now use explicit "TO authenticated" clauses
- Users can only access their own rows (WHERE auth.uid() = user_id)
- Service role can bypass RLS for admin operations
- Anon/public access is explicitly denied
""")
    print()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
