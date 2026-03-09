-- Migration 017: Phase 1 chat schema alignment + realtime support

-- Ensure conversation workflow columns exist
ALTER TABLE public.dm_conversations
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active', 'declined')),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS initiator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure message share/read fields exist
ALTER TABLE public.dm_messages
ADD COLUMN IF NOT EXISTS shared_item JSONB,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Useful indexes for inbox/conversation reads
CREATE INDEX IF NOT EXISTS idx_dm_conversations_status_last_message
  ON public.dm_conversations(status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created
  ON public.dm_messages(conversation_id, created_at DESC);

-- Allow participants to update their own conversations (status transitions, metadata)
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.dm_conversations;
CREATE POLICY "Users can update their own conversations"
  ON public.dm_conversations
  FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Keep last_message_at synced automatically whenever a new message arrives
CREATE OR REPLACE FUNCTION public.sync_dm_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.dm_conversations
  SET
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dm_conversation_last_message ON public.dm_messages;
CREATE TRIGGER trg_sync_dm_conversation_last_message
AFTER INSERT ON public.dm_messages
FOR EACH ROW
EXECUTE FUNCTION public.sync_dm_conversation_last_message();

-- Ensure realtime publication includes chat tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'dm_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'dm_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
  END IF;
END $$;
