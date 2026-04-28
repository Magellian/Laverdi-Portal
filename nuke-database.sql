-- Complete Laverdi Portal Database Wipe
-- Deletes all user data while respecting foreign key constraints

-- Disable RLS policies temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Delete in order of dependencies (reverse foreign key order)
DELETE FROM usage_records;
DELETE FROM user_settings;
DELETE FROM instances;
DELETE FROM api_keys;
DELETE FROM profiles;
DELETE FROM users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as api_key_count FROM api_keys;
SELECT COUNT(*) as instance_count FROM instances;
SELECT COUNT(*) as usage_count FROM usage_records;
