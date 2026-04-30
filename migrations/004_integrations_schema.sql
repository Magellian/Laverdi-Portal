-- Communication channel integrations (Telegram, Discord, WhatsApp, Slack, Email)

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'discord', 'whatsapp', 'slack', 'email')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  error_message TEXT,
  is_active BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE,
  last_test_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT CHECK (test_status IN ('pending', 'success', 'failed')),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_agent_id ON integrations(agent_id);
CREATE INDEX idx_integrations_platform ON integrations(platform);
CREATE UNIQUE INDEX idx_integrations_active_per_agent_platform 
  ON integrations(agent_id, platform) 
  WHERE is_active = true AND deleted_at IS NULL;

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrations_select_own ON integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY integrations_insert_own ON integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY integrations_update_own ON integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY integrations_delete_own ON integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can access (for webhook processing)
CREATE POLICY integrations_service_role ON integrations
  FOR ALL
  USING (true)
  TO service_role;

-- Create webhook_logs table to track incoming messages
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source_id TEXT,
  source_name TEXT,
  message_content TEXT,
  raw_payload JSONB,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_integration_id ON webhook_logs(integration_id);
CREATE INDEX idx_webhook_logs_agent_id ON webhook_logs(agent_id);
CREATE INDEX idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);

-- Create integration_usage table to track message volume
CREATE TABLE IF NOT EXISTS integration_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_received INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integration_usage_integration_id ON integration_usage(integration_id);
CREATE INDEX idx_integration_usage_user_id ON integration_usage(user_id);
CREATE INDEX idx_integration_usage_date ON integration_usage(date);

-- Create audit_log for integration changes
CREATE TABLE IF NOT EXISTS integration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integration_audit_user_id ON integration_audit_log(user_id);
CREATE INDEX idx_integration_audit_integration_id ON integration_audit_log(integration_id);
CREATE INDEX idx_integration_audit_action ON integration_audit_log(action);

-- View: Active integrations by agent
CREATE OR REPLACE VIEW active_integrations_by_agent AS
SELECT 
  i.id,
  i.agent_id,
  a.user_id,
  i.platform,
  i.is_active,
  i.status,
  i.connected_at,
  i.last_activity,
  COUNT(DISTINCT wl.id) as messages_today
FROM integrations i
JOIN agents a ON i.agent_id = a.id
LEFT JOIN webhook_logs wl ON i.id = wl.integration_id
  AND DATE(wl.created_at) = CURRENT_DATE
WHERE i.deleted_at IS NULL
  AND i.is_active = true
GROUP BY i.id, i.agent_id, a.user_id, i.platform, i.is_active, i.status, i.connected_at, i.last_activity;

GRANT SELECT ON active_integrations_by_agent TO authenticated;
GRANT SELECT ON active_integrations_by_agent TO service_role;

-- View: Integration stats per user
CREATE OR REPLACE VIEW user_integration_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT CASE WHEN i.is_active = true THEN i.id END) as active_integrations,
  COUNT(DISTINCT i.id) as total_integrations,
  COUNT(DISTINCT i.platform) as platforms,
  COALESCE(SUM(iu.messages_received), 0) as total_messages_received,
  COALESCE(SUM(iu.messages_sent), 0) as total_messages_sent,
  MAX(i.last_activity) as last_activity
FROM users u
LEFT JOIN integrations i ON u.id = i.user_id AND i.deleted_at IS NULL
LEFT JOIN integration_usage iu ON i.id = iu.integration_id AND iu.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id;

GRANT SELECT ON user_integration_stats TO authenticated;
GRANT SELECT ON user_integration_stats TO service_role;
