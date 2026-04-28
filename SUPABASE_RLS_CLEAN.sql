-- ============================================================================
-- LAVERDI PORTAL - RLS POLICIES UPDATE (PKCE Compatible)
-- Updates existing policies with explicit "TO authenticated" clauses
-- Single batch - paste and run everything at once
-- ============================================================================

-- DROP EXISTING POLICIES (to recreate with proper TO clause)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own usage logs" ON usage_logs;

-- ============================================================================
-- USERS TABLE - RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- SUBSCRIPTIONS TABLE - RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- API_KEYS TABLE - RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- USAGE_LOGS TABLE - RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own usage logs"
  ON usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
