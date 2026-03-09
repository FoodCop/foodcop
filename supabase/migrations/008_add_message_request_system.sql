-- Add message request system to dm_conversations
-- Allows conversations to be in 'pending' state until accepted (Instagram-style)

-- Add status column (pending = message request, active = accepted conversation)
ALTER TABLE dm_conversations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('pending', 'active', 'declined'));

-- Add accepted_at timestamp (when conversation was accepted)
ALTER TABLE dm_conversations 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Add initiator_id to track who started the conversation
ALTER TABLE dm_conversations 
ADD COLUMN IF NOT EXISTS initiator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries on pending requests
CREATE INDEX IF NOT EXISTS idx_dm_conversations_status 
ON dm_conversations(status, created_at DESC);

-- Create index for finding pending requests for a user
CREATE INDEX IF NOT EXISTS idx_dm_conversations_pending_recipient 
ON dm_conversations(status, participant_1, participant_2) 
WHERE status = 'pending';

-- Update existing conversations to be 'active' (they're already established)
UPDATE dm_conversations 
SET status = 'active', accepted_at = created_at 
WHERE status IS NULL OR status = 'active';

-- Add comment explaining the system
COMMENT ON COLUMN dm_conversations.status IS 'Conversation status: pending (message request), active (accepted), declined (rejected)';
COMMENT ON COLUMN dm_conversations.accepted_at IS 'Timestamp when conversation was accepted (moved from pending to active)';
COMMENT ON COLUMN dm_conversations.initiator_id IS 'User ID who initiated the conversation (sent first message)';

