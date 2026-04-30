-- Enable multiple agents per user with shared credit pool

-- Update user_droplets to support multiple agents
ALTER TABLE user_droplets
ADD COLUMN IF NOT EXISTS agent_name TEXT,
ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Create unique constraint on primary agent per user
CREATE UNIQUE INDEX idx_user_droplets_primary_per_user 
ON user_droplets(user_id) 
WHERE is_primary = true AND status != 'deleted';

-- Create agents table (alternative schema - agents owned by users)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  droplet_id INTEGER NOT NULL REFERENCES user_droplets(droplet_id),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_droplet_id ON agents(droplet_id);
CREATE UNIQUE INDEX idx_agents_user_name ON agents(user_id, name) WHERE deleted_at IS NULL;

-- Enable RLS on agents
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_own ON agents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY agents_insert_own ON agents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY agents_update_own ON agents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY agents_delete_own ON agents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update usage_logs to track agent
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id),
ADD COLUMN IF NOT EXISTS droplet_id INTEGER;

-- Create index for agent usage tracking
CREATE INDEX idx_usage_logs_agent_id ON usage_logs(agent_id);
CREATE INDEX idx_usage_logs_droplet_id ON usage_logs(droplet_id);

-- Create view: All agents for a user with droplet info
CREATE OR REPLACE VIEW user_agents AS
SELECT 
  a.id,
  a.user_id,
  a.name,
  a.description,
  a.is_primary,
  a.is_active,
  ud.droplet_id,
  ud.ip_address,
  ud.port,
  ud.tier,
  ud.status,
  a.created_at
FROM agents a
JOIN user_droplets ud ON a.droplet_id = ud.droplet_id
WHERE a.deleted_at IS NULL
AND ud.status != 'deleted';

-- Create view: Shared credit pool stats per user (all agents combined)
CREATE OR REPLACE VIEW user_shared_credit_pool AS
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
    WHEN ul.model = 'gpt-4o' THEN ul.token_count * 0.000015
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
    WHEN ul.model = 'gpt-4o' THEN ul.token_count * 0.000015
    ELSE ul.token_count * 0.00001
  END), 0) as credits_remaining,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as reset_date,
  COUNT(DISTINCT a.id) as agent_count
FROM users u
LEFT JOIN agents a ON u.id = a.user_id AND a.deleted_at IS NULL
LEFT JOIN usage_logs ul ON u.id = ul.user_id
  AND DATE_TRUNC('month', ul.created_at) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id, u.tier;

-- Grant permissions
GRANT SELECT ON user_agents TO authenticated;
GRANT SELECT ON user_shared_credit_pool TO authenticated;
GRANT SELECT ON user_agents TO service_role;
GRANT SELECT ON user_shared_credit_pool TO service_role;

-- Create audit log for agent operations
CREATE TABLE IF NOT EXISTS agent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_audit_user_id ON agent_audit_log(user_id);
CREATE INDEX idx_agent_audit_agent_id ON agent_audit_log(agent_id);
CREATE INDEX idx_agent_audit_action ON agent_audit_log(action);
