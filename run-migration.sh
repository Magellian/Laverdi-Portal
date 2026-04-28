#!/bin/bash
# Run Supabase migration via SQL

# Supabase Project details
PROJECT_ID="dcvrkpgvxqdcboostkpz"
REGION="us-east-1"

# Your Supabase API token (get from https://app.supabase.com/account/tokens)
# or use environment variable SUPABASE_TOKEN
SUPABASE_TOKEN="${SUPABASE_TOKEN:-}"

if [ -z "$SUPABASE_TOKEN" ]; then
  echo "❌ SUPABASE_TOKEN environment variable not set"
  echo "Get your token from: https://app.supabase.com/account/tokens"
  exit 1
fi

# SQL migration content
SQL_MIGRATION='-- Migration: Add tier-based model system
-- 1. Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT '"'"'free'"'"';
ALTER TABLE users ADD COLUMN IF NOT EXISTS model_id TEXT DEFAULT '"'"'anthropic-claude-haiku-4.5'"'"';
ALTER TABLE users ADD COLUMN IF NOT EXISTS openclaw_base_url TEXT DEFAULT '"'"'https://inference.do-ai.run/v1'"'"';
ALTER TABLE users ADD COLUMN IF NOT EXISTS do_api_key_id TEXT;

-- 2. Create model_tier_map table
CREATE TABLE IF NOT EXISTS model_tier_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE,
  model_id TEXT NOT NULL,
  price_monthly INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Populate tier mappings
INSERT INTO model_tier_map (tier, model_id, price_monthly, description)
VALUES
  ('"'"'free'"'"', '"'"'anthropic-claude-haiku-4.5'"'"', 0, '"'"'Best bang-for-buck, fast inference'"'"'),
  ('"'"'starter'"'"', '"'"'anthropic-claude-4.6-sonnet'"'"', 99, '"'"'General-purpose, balanced capability'"'"'),
  ('"'"'professional'"'"', '"'"'anthropic-claude-opus-4.6'"'"', 249, '"'"'Most capable, advanced reasoning'"'"')
ON CONFLICT(tier) DO UPDATE SET
  model_id = EXCLUDED.model_id,
  price_monthly = EXCLUDED.price_monthly,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 4. Update existing users
UPDATE users SET
  tier = '"'"'free'"'"',
  model_id = '"'"'anthropic-claude-haiku-4.5'"'"',
  openclaw_base_url = '"'"'https://inference.do-ai.run/v1'"'"'
WHERE tier IS NULL;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_model_id ON users(model_id);
CREATE INDEX IF NOT EXISTS idx_model_tier_map_tier ON model_tier_map(tier);

-- 6. RLS for model_tier_map
ALTER TABLE model_tier_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON model_tier_map FOR SELECT USING (true);
CREATE POLICY "Enable write access for service role" ON model_tier_map FOR INSERT, UPDATE, DELETE USING (auth.role() = '"'"'service_role'"'"');

-- 7. Create instances table
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  container_id TEXT NOT NULL UNIQUE,
  model_id TEXT NOT NULL,
  port INTEGER NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT '"'"'provisioning'"'"',
  endpoint TEXT,
  api_key TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_container_id ON instances(container_id);

-- 8. RLS for instances
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own instances" ON instances FOR SELECT USING (auth.uid() = user_id OR auth.role() = '"'"'service_role'"'"');
CREATE POLICY "Service role can manage all instances" ON instances FOR INSERT, UPDATE, DELETE USING (auth.role() = '"'"'service_role'"'"');'

echo "🔄 Running Supabase migration..."
echo "Project: $PROJECT_ID"
echo ""

# Call Supabase API to execute SQL
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_ID/sql" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_MIGRATION" | jq -Rs .)}")

echo "$RESPONSE" | jq '.'

# Check if successful
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo ""
  echo "❌ Migration failed"
  exit 1
else
  echo ""
  echo "✅ Migration completed successfully!"
  exit 0
fi
