-- Cleanup unnecessary bot-related tables
-- These tables are empty and not needed in the simplified Master Bot system

-- Drop bot_history table (empty - bot history tracking not needed in simplified system)
DROP TABLE IF EXISTS bot_history CASCADE;

-- Drop master_bots table (empty - Master Bots are now just users with is_master_bot = true)
DROP TABLE IF EXISTS master_bots CASCADE;

-- Drop bot_posts table (empty - bot posts not implemented in simplified system)
DROP TABLE IF EXISTS bot_posts CASCADE;

-- Note: tags_map table is kept as it has useful data for content categorization
-- Note: users table with is_master_bot flag is the new simplified system

-- After this migration:
-- ✅ Master Bots are just users with is_master_bot = true
-- ✅ No unnecessary tables cluttering the database
-- ✅ Clean, simple structure
-- ✅ Easy to maintain and understand

