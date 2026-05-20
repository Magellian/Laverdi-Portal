-- Create channels table
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

CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_user_platform ON channels(user_id, platform);
CREATE INDEX idx_channels_created ON channels(created_at);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own channels"
  ON channels
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
