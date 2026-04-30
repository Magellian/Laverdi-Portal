-- Create instances table to track user droplet deployments
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  droplet_id VARCHAR(255),
  ip_address VARCHAR(45),
  status VARCHAR(50) DEFAULT 'provisioning',
  pairing_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
-- Index for webhook lookups (if needed later)
CREATE INDEX IF NOT EXISTS idx_instances_droplet_id ON instances(droplet_id);
