-- Create user_droplets table to track provisioned OpenClaw instances
CREATE TABLE IF NOT EXISTS user_droplets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  droplet_id INTEGER NOT NULL UNIQUE,
  ip_address INET NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro')),
  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'active', 'error', 'deleted')),
  error_message TEXT,
  gateway_port INTEGER DEFAULT 18789,
  api_endpoint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add index for quick lookups
CREATE INDEX idx_user_droplets_user_id ON user_droplets(user_id);
CREATE INDEX idx_user_droplets_droplet_id ON user_droplets(droplet_id);
CREATE UNIQUE INDEX idx_user_droplets_active ON user_droplets(user_id) 
  WHERE status != 'deleted';

-- Enable RLS
ALTER TABLE user_droplets ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own droplets
CREATE POLICY user_droplets_select_own ON user_droplets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_droplets_update_own ON user_droplets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow service role to manage droplets (for webhooks)
CREATE POLICY user_droplets_service_role ON user_droplets
  FOR ALL
  USING (true)
  TO service_role;

-- Add columns to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS droplet_id INTEGER REFERENCES user_droplets(droplet_id);

-- Create audit log for droplet operations
CREATE TABLE IF NOT EXISTS droplet_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  droplet_id INTEGER,
  action TEXT NOT NULL,
  status TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_droplet_audit_user_id ON droplet_audit_log(user_id);
CREATE INDEX idx_droplet_audit_action ON droplet_audit_log(action);
