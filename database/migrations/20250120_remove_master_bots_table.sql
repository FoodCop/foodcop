-- Remove unnecessary master_bots table
-- Master Bots are now just users with is_master_bot = true

-- Drop the master_bots table since we're using the simplified approach
DROP TABLE IF EXISTS master_bots CASCADE;

-- Note: All Master Bot data is now stored in the users table with is_master_bot = true
-- This simplifies the system and removes unnecessary complexity

