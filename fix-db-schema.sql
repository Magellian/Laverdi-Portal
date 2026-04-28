-- Fix Supabase schema mismatch
-- Run this in Supabase SQL Editor or via psql

-- 1. Add missing 'tier' column to api_keys table
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS tier VARCHAR(50);

-- 2. Add missing 'api_key' column to users table (for storing one API key per user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(255);

-- 3. Add created_at if missing
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 4. Verify structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'api_keys';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
