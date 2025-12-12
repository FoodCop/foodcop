-- Add message retention system
-- Automatically deletes messages older than 7 days

-- Create function to cleanup empty conversations
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete conversations that have no messages and are older than 7 days
  WITH empty_convs AS (
    SELECT c.id
    FROM dm_conversations c
    LEFT JOIN dm_messages m ON m.conversation_id = c.id
    WHERE m.id IS NULL
      AND c.created_at < NOW() - INTERVAL '7 days'
  )
  DELETE FROM dm_conversations
  WHERE id IN (SELECT id FROM empty_convs);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_empty_conversations() TO service_role;

-- Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_dm_messages_created_at 
ON dm_messages(created_at DESC);

-- Add comment explaining retention policy
COMMENT ON TABLE dm_messages IS 'Direct messages between users. Messages older than 7 days are automatically deleted.';
COMMENT ON FUNCTION cleanup_empty_conversations() IS 'Removes conversations with no messages that are older than 7 days';

-- Optional: Create a view for users to see message retention info
CREATE OR REPLACE VIEW message_retention_info AS
SELECT 
  conversation_id,
  COUNT(*) as message_count,
  MIN(created_at) as oldest_message,
  MAX(created_at) as newest_message,
  CASE 
    WHEN MAX(created_at) < NOW() - INTERVAL '7 days' THEN 'expired'
    WHEN MAX(created_at) < NOW() - INTERVAL '6 days' THEN 'expiring_soon'
    ELSE 'active'
  END as retention_status
FROM dm_messages
GROUP BY conversation_id;

-- Grant access to authenticated users
GRANT SELECT ON message_retention_info TO authenticated;

