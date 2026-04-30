-- Migration: Add trial system
-- Replaces free tier with time-limited trial

-- Add trial columns to users table
ALTER TABLE users
ADD COLUMN trial_expires_at TIMESTAMP NULL,
ADD COLUMN trial_converted BOOLEAN DEFAULT FALSE;

-- Create index for expired trials (for nightly cron job)
CREATE INDEX idx_trial_expires_at ON users(trial_expires_at) WHERE trial_expires_at IS NOT NULL;

-- Backfill: Any existing "free" tier users become trials expiring in 2 weeks
UPDATE users
SET 
  tier = 'starter',  -- All trials start as starter
  trial_expires_at = NOW() + INTERVAL '14 days'
WHERE tier = 'free' AND trial_expires_at IS NULL;

-- Drop the old free tier column constraint if it exists
-- (Assuming tier was VARCHAR, we just update the comments/docs)

-- New view: active_trials (for dashboard + admin)
CREATE OR REPLACE VIEW active_trials AS
SELECT 
  id,
  email,
  tier,
  trial_expires_at,
  EXTRACT(DAY FROM (trial_expires_at - NOW())) as days_remaining,
  (trial_expires_at > NOW()) as is_active
FROM users
WHERE trial_expires_at IS NOT NULL;

-- New view: expired_trials (for cleanup cron)
CREATE OR REPLACE VIEW expired_trials AS
SELECT 
  id,
  email,
  trial_expires_at
FROM users
WHERE trial_expires_at IS NOT NULL
  AND trial_expires_at < NOW()
  AND trial_converted = FALSE;
