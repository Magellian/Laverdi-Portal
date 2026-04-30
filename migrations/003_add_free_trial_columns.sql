-- Migration 003: Add Free Trial Support Columns
-- Idempotent: safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS guards)

-- 1. Add trial_expires_at to users table (nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP;

-- 2. Add monthly_call_limit to users table (default 100 for free tier)
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_call_limit INTEGER DEFAULT 100;

-- 3. Add call_count to usage_logs table
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;

-- 4. Expand the allowed tier values via CHECK constraint
--    (safer than converting to a custom ENUM type, which requires locking the table)
--    Drop the old constraint if it exists, then re-create with the full set of tiers.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('free', 'trial', 'starter', 'professional', 'enterprise'));

-- Set a sensible default for the tier column
ALTER TABLE users ALTER COLUMN tier SET DEFAULT 'free';

-- 5. Back-fill monthly_call_limit for any existing rows that still have NULL or the
--    migration default, mapping tier -> call limit.
UPDATE users
SET monthly_call_limit = CASE
  WHEN tier = 'free'         THEN 100
  WHEN tier = 'trial'        THEN 500
  WHEN tier = 'starter'      THEN 5000
  WHEN tier = 'professional' THEN 20000
  WHEN tier = 'enterprise'   THEN 100000
  ELSE 100
END
WHERE monthly_call_limit IS NULL OR monthly_call_limit = 100;

-- 6. Composite index for efficient trial-expiry lookups (e.g., scheduled cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_users_trial ON users(id, trial_expires_at);
