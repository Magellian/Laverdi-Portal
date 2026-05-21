-- Fix channels table schema
-- Add missing columns if they don't exist

ALTER TABLE channels ADD COLUMN IF NOT EXISTS channel_name VARCHAR(50);
ALTER TABLE channels ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS config JSONB;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();
ALTER TABLE channels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Add unique constraint if not exists
ALTER TABLE channels ADD CONSTRAINT IF NOT EXISTS unique_user_channel UNIQUE(user_id, channel_name);

-- Refresh RLS policies
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own channels" 
  ON channels FOR SELECT 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can insert their own channels"
  ON channels FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can update their own channels"
  ON channels FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can delete their own channels"
  ON channels FOR DELETE
  USING (auth.uid()::text = user_id::text);
