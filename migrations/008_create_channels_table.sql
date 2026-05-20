-- Migration 008: Create channels table for Telegram/Discord/Slack credentials
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
  
  channel_name VARCHAR(50) NOT NULL CHECK (channel_name IN ('telegram', 'discord', 'slack', 'whatsapp', 'signal')),
  enabled BOOLEAN DEFAULT FALSE,
  
  -- Credentials stored as JSON
  config JSONB,
  
  -- Webhook management
  webhook_url VARCHAR(255),
  webhook_secret VARCHAR(255),
  webhook_verified BOOLEAN DEFAULT FALSE,
  last_webhook_ping TIMESTAMP,
  
  -- Status tracking
  connected BOOLEAN DEFAULT FALSE,
  last_error TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, channel_name, instance_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_instance_id ON channels(instance_id);
CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(enabled);
CREATE INDEX IF NOT EXISTS idx_channels_channel_name ON channels(channel_name);

-- Enable Row Level Security
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own channels"
  ON channels
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own channels"
  ON channels
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own channels"
  ON channels
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own channels"
  ON channels
  FOR DELETE
  USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON channels TO authenticated;
