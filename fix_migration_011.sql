/**
 * Fix Migration 011: Complete the User Presence System
 * 
 * This script completes the partially-applied migration by adding
 * the missing table and columns.
 */

-- ============================================
-- 0. OPTIONAL: CREATE exec_sql RPC HELPER
-- ============================================
-- This helper allows running individual SQL statements via Supabase RPC.
-- If you plan to apply future migrations programmatically, include this.
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. ADD MISSING PRESENCE COLUMNS TO USERS TABLE
-- ============================================

DO $$
BEGIN
    -- Check and add is_online column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_online'
    ) THEN
        ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_online column to users table';
    ELSE
        RAISE NOTICE 'Column is_online already exists';
    END IF;

    -- Check and add last_activity_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_activity_at column to users table';
    ELSE
        RAISE NOTICE 'Column last_activity_at already exists';
    END IF;

    -- Check and add last_seen column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_seen'
    ) THEN
        ALTER TABLE users ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_seen column to users table';
    ELSE
        RAISE NOTICE 'Column last_seen already exists';
    END IF;
END $$;

-- ============================================
-- 2. CREATE INDEXES FOR USERS TABLE
-- ============================================

-- Create index for efficient online user queries
CREATE INDEX IF NOT EXISTS idx_users_online_status
ON users(is_online, last_activity_at DESC)
WHERE is_online = true;

-- Create index for last_seen queries
CREATE INDEX IF NOT EXISTS idx_users_last_seen
ON users(last_seen DESC);

-- Add comments for documentation
COMMENT ON COLUMN users.is_online IS 'Real-time online status - true if user is currently active';
COMMENT ON COLUMN users.last_activity_at IS 'Timestamp of last user activity (updated every 30s via heartbeat)';
COMMENT ON COLUMN users.last_seen IS 'Timestamp when user went offline (shown as "Last seen X ago")';

-- ============================================
-- 3. CREATE USER_PRESENCE TABLE
-- ============================================

-- Detailed presence tracking table for multiple sessions/devices
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Client-generated session identifier
  device_info JSONB, -- Browser, OS, device type
  is_online BOOLEAN DEFAULT true,
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, session_id)
);

-- Indexes for user_presence
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id
ON user_presence(user_id, is_online, last_heartbeat_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_presence_online
ON user_presence(is_online, last_heartbeat_at DESC)
WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_user_presence_session
ON user_presence(session_id);

-- Add comments
COMMENT ON TABLE user_presence IS 'Tracks user presence across multiple devices/sessions';
COMMENT ON COLUMN user_presence.session_id IS 'Client session ID (browser tab identifier)';
COMMENT ON COLUMN user_presence.device_info IS 'Browser/device metadata for multi-device support';
COMMENT ON COLUMN user_presence.last_heartbeat_at IS 'Last heartbeat received from this session';

-- ============================================
-- 4. ENABLE RLS ON USER_PRESENCE
-- ============================================

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Allow users to see all presence records (for online status indicators)
CREATE POLICY IF NOT EXISTS "Anyone can view presence"
ON user_presence FOR SELECT
TO authenticated
USING (true);

-- Only allow updates from service role or owner
CREATE POLICY IF NOT EXISTS "Users can update own presence"
ON user_presence FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only allow inserts from service role or owner
CREATE POLICY IF NOT EXISTS "Users can insert own presence"
ON user_presence FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow deletes only from service role or owner
CREATE POLICY IF NOT EXISTS "Users can delete own presence"
ON user_presence FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 5. ENABLE REALTIME
-- ============================================

-- Enable realtime for presence updates
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 011 fix completed successfully!';
    RAISE NOTICE 'Added presence columns to users table';
    RAISE NOTICE 'Created user_presence table';
    RAISE NOTICE 'Set up indexes and RLS policies';
    RAISE NOTICE 'Enabled realtime subscriptions';
END $$;
