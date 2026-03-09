/**
 * Migration 011: Add User Presence Tracking
 *
 * Implements online status detection system for real-time presence indicators
 * in the chat system. Users will show as "Active now" or "Last seen X ago"
 * similar to Instagram.
 *
 * Changes:
 * 1. Add is_online and last_seen columns to users table
 * 2. Create user_presence table for detailed presence tracking
 * 3. Create helper functions for presence management
 * 4. Add indexes for performance
 * 5. Set up RLS policies
 *
 * Created: 2026-01-19
 */

-- ============================================
-- 1. ADD PRESENCE COLUMNS TO USERS TABLE
-- ============================================

-- Add online status tracking to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Create index for efficient online user queries
CREATE INDEX IF NOT EXISTS idx_users_online_status
ON users(is_online, last_activity_at DESC)
WHERE is_online = true;

-- Create index for last_seen queries
CREATE INDEX IF NOT EXISTS idx_users_last_seen
ON users(last_seen DESC);

-- Add comment for documentation
COMMENT ON COLUMN users.is_online IS 'Real-time online status - true if user is currently active';
COMMENT ON COLUMN users.last_activity_at IS 'Timestamp of last user activity (updated every 30s via heartbeat)';
COMMENT ON COLUMN users.last_seen IS 'Timestamp when user went offline (shown as "Last seen X ago")';

-- ============================================
-- 2. CREATE USER_PRESENCE TABLE
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
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function to update user activity
CREATE OR REPLACE FUNCTION update_user_activity(
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update users table
  UPDATE users
  SET
    is_online = true,
    last_activity_at = NOW(),
    last_seen = NOW()
  WHERE id = p_user_id;

  -- Update or insert presence record if session_id provided
  IF p_session_id IS NOT NULL THEN
    INSERT INTO user_presence (
      user_id,
      session_id,
      device_info,
      is_online,
      last_heartbeat_at,
      connected_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_session_id,
      p_device_info,
      true,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, session_id)
    DO UPDATE SET
      is_online = true,
      last_heartbeat_at = NOW(),
      disconnected_at = NULL,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user offline
CREATE OR REPLACE FUNCTION mark_user_offline(
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_has_active_sessions BOOLEAN;
BEGIN
  -- Mark specific session as offline if provided
  IF p_session_id IS NOT NULL THEN
    UPDATE user_presence
    SET
      is_online = false,
      disconnected_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND session_id = p_session_id;
  ELSE
    -- Mark all sessions offline if no session_id
    UPDATE user_presence
    SET
      is_online = false,
      disconnected_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Check if user has any active sessions
  SELECT EXISTS(
    SELECT 1 FROM user_presence
    WHERE user_id = p_user_id AND is_online = true
  ) INTO v_has_active_sessions;

  -- Update users table only if no active sessions remain
  IF NOT v_has_active_sessions THEN
    UPDATE users
    SET
      is_online = false,
      last_seen = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup stale presence (sessions inactive for 5+ minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS INTEGER AS $$
DECLARE
  v_stale_count INTEGER;
BEGIN
  -- Mark stale sessions as offline
  WITH stale_sessions AS (
    UPDATE user_presence
    SET
      is_online = false,
      disconnected_at = NOW(),
      updated_at = NOW()
    WHERE is_online = true
      AND last_heartbeat_at < NOW() - INTERVAL '5 minutes'
    RETURNING user_id
  )
  SELECT COUNT(*) INTO v_stale_count FROM stale_sessions;

  -- Update users table for users with no active sessions
  UPDATE users u
  SET
    is_online = false,
    last_seen = NOW()
  WHERE u.is_online = true
    AND NOT EXISTS (
      SELECT 1 FROM user_presence up
      WHERE up.user_id = u.id AND up.is_online = true
    );

  RETURN v_stale_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. AUTOMATED CLEANUP JOB (using pg_cron if available)
-- ============================================

-- Note: This requires pg_cron extension
-- If not available, cleanup should be called manually or via application cron job
DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule cleanup job every minute
    PERFORM cron.schedule(
      'cleanup-stale-presence',
      '* * * * *', -- Every minute
      $CRON$SELECT cleanup_stale_presence();$CRON$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    RAISE NOTICE 'pg_cron not available, cleanup_stale_presence must be called manually';
END $$;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Enable RLS on user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all presence data (for showing online status)
CREATE POLICY "Users can view all presence"
ON user_presence
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can only update their own presence
CREATE POLICY "Users can update own presence"
ON user_presence
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view is_online and last_seen for all users
-- (already covered by existing users RLS, but ensuring it's readable)

-- ============================================
-- 6. REALTIME PUBLICATION
-- ============================================

-- Enable realtime for user_presence table
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Also ensure users table updates are published
-- (This might already be done, but ensuring it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END $$;

-- ============================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger to update updated_at on user_presence changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON user_presence
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. INITIAL DATA MIGRATION
-- ============================================

-- Set all existing users as offline initially
UPDATE users
SET
  is_online = false,
  last_activity_at = NOW(),
  last_seen = NOW()
WHERE is_online IS NULL;

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION update_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION mark_user_offline TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_presence TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- Check migration success
DO $$
BEGIN
  -- Verify columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_online'
  ) THEN
    RAISE EXCEPTION 'Migration failed: is_online column not created';
  END IF;

  -- Verify table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_presence'
  ) THEN
    RAISE EXCEPTION 'Migration failed: user_presence table not created';
  END IF;

  RAISE NOTICE 'Migration 011 completed successfully';
END $$;
