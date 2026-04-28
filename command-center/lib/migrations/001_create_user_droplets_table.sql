-- Migration: Create user_droplets table
-- Description: Tracks DigitalOcean droplets provisioned for users
-- Created: 2026-04-19

CREATE TABLE IF NOT EXISTS user_droplets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Droplet metadata
  droplet_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  size TEXT NOT NULL,
  
  -- Tier/subscription info
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'enterprise')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning', 'initializing', 'ready', 'failed', 'deleted')),
  
  -- Network details (set when droplet boots and calls DO callback)
  ip_address INET,
  ipv6_address TEXT,
  
  -- Pairing token (for agent connection, set when status='ready')
  pairing_token TEXT,
  
  -- Bootstrap metadata
  bootstrap_started_at TIMESTAMP,
  bootstrap_completed_at TIMESTAMP,
  health_check_url TEXT, -- e.g., http://{ip}:5000/health
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Indexes for common queries
  CONSTRAINT fk_user_droplets_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, tier) -- One active droplet per user per tier
);

-- Create indexes for performance
CREATE INDEX idx_user_droplets_user_id ON user_droplets(user_id);
CREATE INDEX idx_user_droplets_status ON user_droplets(status);
CREATE INDEX idx_user_droplets_droplet_id ON user_droplets(droplet_id);
CREATE INDEX idx_user_droplets_created_at ON user_droplets(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_droplets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_droplets_updated_at_trigger
BEFORE UPDATE ON user_droplets
FOR EACH ROW
EXECUTE FUNCTION update_user_droplets_updated_at();

-- Enable RLS if using Supabase
ALTER TABLE user_droplets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own droplets
CREATE POLICY "Users can view their own droplets" ON user_droplets
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert/update (for webhooks)
CREATE POLICY "Service role full access" ON user_droplets
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
