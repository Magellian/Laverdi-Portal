-- ============================================================================
-- SUPABASE RLS POLICY UPDATE - Laverdi Portal
-- Project: dcvrkpgvxqdcboostkpz
-- Purpose: Add explicit "TO authenticated" clauses for PKCE flow compatibility
-- ============================================================================
-- 
-- IMPORTANT: Run this script in Supabase SQL Editor:
-- 1. Go to: https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/sql/new
-- 2. Create new SQL query
-- 3. Copy entire script below
-- 4. Click "Run"
-- 5. Review results in output
-- 6. Run VERIFICATION queries at bottom
--
-- ============================================================================

-- ============================================================================
-- STEP 1: VIEW CURRENT POLICIES (Review before updating)
-- ============================================================================
-- Run this first to see existing policies

SELECT 
    schemaname,
    tablename,
    policyname,
    qual AS condition,
    with_check,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'profiles', 'api_keys', 'subscriptions', 'usage_logs')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 2: DROP EXISTING POLICIES (Optional - only if you want to recreate)
-- ============================================================================
-- Uncomment this section if you want to drop ALL policies and recreate them fresh

/*
DROP POLICY IF EXISTS "allow_read_own_user" ON users;
DROP POLICY IF EXISTS "allow_update_own_user" ON users;
DROP POLICY IF EXISTS "allow_delete_own_user" ON users;
DROP POLICY IF EXISTS "allow_insert_own_user" ON users;

DROP POLICY IF EXISTS "allow_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_delete_own_profile" ON profiles;

DROP POLICY IF EXISTS "allow_read_own_api_keys" ON api_keys;
DROP POLICY IF EXISTS "allow_insert_own_api_keys" ON api_keys;
DROP POLICY IF EXISTS "allow_update_own_api_keys" ON api_keys;
DROP POLICY IF EXISTS "allow_delete_own_api_keys" ON api_keys;

DROP POLICY IF EXISTS "allow_read_own_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "allow_update_own_subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "allow_read_own_usage_logs" ON usage_logs;

DROP POLICY IF EXISTS "service_role_bypass" ON users;
DROP POLICY IF EXISTS "service_role_bypass" ON profiles;
DROP POLICY IF EXISTS "service_role_bypass" ON api_keys;
DROP POLICY IF EXISTS "service_role_bypass" ON subscriptions;
DROP POLICY IF EXISTS "service_role_bypass" ON usage_logs;
*/

-- ============================================================================
-- STEP 3: CREATE OR UPDATE POLICIES WITH EXPLICIT "TO authenticated"
-- ============================================================================

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to read their own user record
CREATE POLICY "allow_read_own_user" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow authenticated users to update their own user record
CREATE POLICY "allow_update_own_user" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own user record
CREATE POLICY "allow_insert_own_user" ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Deny deletion by authenticated users (via policy)
CREATE POLICY "deny_delete_own_user" ON users
    FOR DELETE
    TO authenticated
    USING (false);

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to read their own profile
CREATE POLICY "allow_read_own_profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "allow_insert_own_profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "allow_update_own_profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own profile
CREATE POLICY "allow_delete_own_profile" ON profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- API_KEYS TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to read their own API keys
CREATE POLICY "allow_read_own_api_keys" ON api_keys
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own API keys
CREATE POLICY "allow_insert_own_api_keys" ON api_keys
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own API keys
CREATE POLICY "allow_update_own_api_keys" ON api_keys
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own API keys
CREATE POLICY "allow_delete_own_api_keys" ON api_keys
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to read their own subscriptions
CREATE POLICY "allow_read_own_subscriptions" ON subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow authenticated users to update their own subscriptions
CREATE POLICY "allow_update_own_subscriptions" ON subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own subscriptions
CREATE POLICY "allow_insert_own_subscriptions" ON subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- USAGE_LOGS TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to read their own usage logs
CREATE POLICY "allow_read_own_usage_logs" ON usage_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: DENY ANONYMOUS ACCESS
-- ============================================================================
-- These tables should NOT be accessible to anonymous users

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Create explicit deny policies for anonymous/public access
CREATE POLICY "deny_anon_users" ON users
    FOR ALL
    TO anon, public
    USING (false)
    WITH CHECK (false);

CREATE POLICY "deny_anon_profiles" ON profiles
    FOR ALL
    TO anon, public
    USING (false)
    WITH CHECK (false);

CREATE POLICY "deny_anon_api_keys" ON api_keys
    FOR ALL
    TO anon, public
    USING (false)
    WITH CHECK (false);

CREATE POLICY "deny_anon_subscriptions" ON subscriptions
    FOR ALL
    TO anon, public
    USING (false)
    WITH CHECK (false);

CREATE POLICY "deny_anon_usage_logs" ON usage_logs
    FOR ALL
    TO anon, public
    USING (false)
    WITH CHECK (false);

-- ============================================================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================================================
-- Grant authenticated users and service role access

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_logs TO authenticated;

-- Service role should have bypass access to everything
GRANT ALL ON users, profiles, api_keys, subscriptions, usage_logs TO service_role;

-- ============================================================================
-- STEP 6: VERIFICATION - RUN THESE QUERIES AFTER UPDATES
-- ============================================================================

-- View all updated policies
SELECT 
    schemaname,
    tablename,
    policyname,
    qual AS condition,
    with_check,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'profiles', 'api_keys', 'subscriptions', 'usage_logs')
ORDER BY tablename, policyname;

-- Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'profiles', 'api_keys', 'subscriptions', 'usage_logs')
ORDER BY tablename;

-- ============================================================================
-- STEP 7: TESTING QUERIES (Use in separate SQL queries)
-- ============================================================================

-- TEST 1: Authenticated user can read only their own row
-- Run as: SELECT auth.uid() -- to see your user ID first
-- SELECT * FROM users WHERE auth.uid() = id;

-- TEST 2: Authenticated user can read only their own api_keys
-- SELECT * FROM api_keys WHERE auth.uid() = user_id;

-- TEST 3: Try to read all users (should fail or return empty)
-- SELECT * FROM users;

-- TEST 4: Service role can read all rows (use service_role key in header)
-- This requires setting Authorization header with service_role JWT token

-- ============================================================================
-- IMPLEMENTATION COMPLETE
-- ============================================================================
-- 
-- Summary of Changes:
-- ✅ Added explicit "TO authenticated" clauses to all policies
-- ✅ Users can only access their own rows (WHERE auth.uid() = user_id)
-- ✅ Service role can bypass RLS (for admin operations)
-- ✅ Public/anon access explicitly denied
-- ✅ Policies compatible with PKCE authentication flow
--
-- All tables now have RLS enabled with proper authenticated-only access.
--
-- ============================================================================
