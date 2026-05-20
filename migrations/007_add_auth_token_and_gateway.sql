-- Migration: Add auth_token and gateway_url columns to servers table
-- Purpose: Store authentication tokens and gateway URLs for portal server communication
-- Created: 2026-05-13

-- Add auth_token column to store the authentication token for API requests
ALTER TABLE servers ADD COLUMN auth_token VARCHAR(512) NULL COMMENT 'Authentication token for portal API requests';

-- Add gateway_url column to store the gateway endpoint
ALTER TABLE servers ADD COLUMN gateway_url VARCHAR(255) NULL COMMENT 'Gateway URL for remote communication';

-- Add token_created_at column to track when token was generated
ALTER TABLE servers ADD COLUMN token_created_at TIMESTAMP NULL COMMENT 'Timestamp when auth token was generated';

-- Add token_expires_at column for token expiration tracking
ALTER TABLE servers ADD COLUMN token_expires_at TIMESTAMP NULL COMMENT 'Timestamp when auth token expires';

-- Add is_provisioned column to track provisioning status
ALTER TABLE servers ADD COLUMN is_provisioned BOOLEAN DEFAULT FALSE COMMENT 'Whether the server has been provisioned with gateway access';

-- Create an index on auth_token for faster lookups
CREATE INDEX idx_auth_token ON servers(auth_token);

-- Create an index on gateway_url for faster lookups
CREATE INDEX idx_gateway_url ON servers(gateway_url);

-- Create an index on is_provisioned to filter non-provisioned servers
CREATE INDEX idx_is_provisioned ON servers(is_provisioned);

-- Add a unique constraint to ensure auth tokens are unique
ALTER TABLE servers ADD CONSTRAINT unique_auth_token UNIQUE (auth_token);
