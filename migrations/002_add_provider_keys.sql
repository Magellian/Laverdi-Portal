-- Create provider_keys table for user's external inference API keys
CREATE TABLE IF NOT EXISTS provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek', 'openrouter')),
  encrypted_key TEXT NOT NULL,
  key_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  last_tested TIMESTAMP WITH TIME ZONE,
  test_status TEXT CHECK (test_status IN ('untested', 'success', 'failed')),
  error_message TEXT
);

-- Add index for quick lookups
CREATE INDEX idx_provider_keys_user_id ON provider_keys(user_id);
CREATE INDEX idx_provider_keys_provider ON provider_keys(provider);

-- Enable RLS
ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own provider keys
CREATE POLICY provider_keys_select_own ON provider_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY provider_keys_insert_own ON provider_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY provider_keys_update_own ON provider_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY provider_keys_delete_own ON provider_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to manage keys (for agent access)
CREATE POLICY provider_keys_service_role ON provider_keys
  FOR ALL
  USING (true)
  TO service_role;

-- Create usage_logs table if not exists (enhanced for model tracking)
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  call_count INTEGER NOT NULL DEFAULT 1,
  provider TEXT,
  cost_cents NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_usage_logs_model ON usage_logs(model);

-- Add model column to usage_logs if not exists
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'unknown';

-- Update RLS for usage_logs
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own usage
CREATE POLICY usage_logs_select_own ON usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (from agent)
CREATE POLICY usage_logs_service_role ON usage_logs
  FOR INSERT
  USING (true)
  TO service_role;

-- Create credit allocation table
CREATE TABLE IF NOT EXISTS credit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  monthly_credits NUMERIC(10, 2) NOT NULL,
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_credit_allocations_user_id ON credit_allocations(user_id);
CREATE INDEX idx_credit_allocations_valid_until ON credit_allocations(valid_until);

-- Add RLS for credit allocations
ALTER TABLE credit_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_allocations_service_role ON credit_allocations
  FOR ALL
  USING (true)
  TO service_role;

-- Create view for current month credits
CREATE OR REPLACE VIEW user_monthly_credits AS
SELECT 
  u.id as user_id,
  u.tier,
  CASE 
    WHEN u.tier = 'free' THEN 100
    WHEN u.tier = 'starter' THEN 1000
    WHEN u.tier = 'pro' THEN 5000
    ELSE 100
  END as monthly_limit,
  COALESCE(SUM(CASE 
    WHEN ul.model = 'claude-opus-4.6' THEN ul.token_count * 0.00015
    WHEN ul.model = 'claude-sonnet-4.6' THEN ul.token_count * 0.00003
    WHEN ul.model = 'claude-haiku-4.5' THEN ul.token_count * 0.000008
    WHEN ul.model = 'gpt-5.4' THEN ul.token_count * 0.0001
    ELSE ul.token_count * 0.00001
  END), 0) as credits_used,
  CASE 
    WHEN u.tier = 'free' THEN 100
    WHEN u.tier = 'starter' THEN 1000
    WHEN u.tier = 'pro' THEN 5000
    ELSE 100
  END - COALESCE(SUM(CASE 
    WHEN ul.model = 'claude-opus-4.6' THEN ul.token_count * 0.00015
    WHEN ul.model = 'claude-sonnet-4.6' THEN ul.token_count * 0.00003
    WHEN ul.model = 'claude-haiku-4.5' THEN ul.token_count * 0.000008
    WHEN ul.model = 'gpt-5.4' THEN ul.token_count * 0.0001
    ELSE ul.token_count * 0.00001
  END), 0) as credits_remaining,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as reset_date
FROM users u
LEFT JOIN usage_logs ul ON u.id = ul.user_id
  AND DATE_TRUNC('month', ul.created_at) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id, u.tier;

-- Add permission for authenticated users to view the view
GRANT SELECT ON user_monthly_credits TO authenticated;
GRANT SELECT ON user_monthly_credits TO service_role;
