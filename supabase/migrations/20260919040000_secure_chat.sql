-- ==========================================
-- Secure chat: end-to-end encryption, blocking, reports, unread, privacy
-- ==========================================
-- Audit of /messages found chat stored in plaintext (readable by anyone with
-- database access), no way to block / report / unsend, no unread tracking, any
-- signed-in user able to add themselves to any group, and fake presence
-- (users.is_online was never written). This migration adds the server side of
-- the fixes. Run after 20260919010000_privacy_hardening.sql.
--
-- END-TO-END ENCRYPTION MODEL (client code: src/lib/chat/*)
--   * Each user has an ECDH P-256 identity. The PUBLIC key is stored here; the
--     PRIVATE key never leaves the browser except as a passphrase-encrypted
--     backup blob (user_key_backups) that only the passphrase can open.
--   * Every thread (DM or group) has a random AES-256-GCM "thread key" per
--     epoch. It is wrapped separately for each member with an ephemeral-static
--     ECDH exchange and stored in chat_thread_keys. The server only ever sees
--     wrapped keys and ciphertext.
--   * A new epoch (fresh key) starts whenever a member is added or resets their
--     keys, so newcomers cannot read history they were not part of.
--   * The database REFUSES plaintext messages (trigger below). Messages that
--     already exist stay readable as legacy rows.

-- ------------------------------------------------------------------
-- 1. Key tables
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_public_keys (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  public_key JSONB NOT NULL,
  key_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_key_backups (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  wrapped_private_key TEXT NOT NULL,
  kdf_salt TEXT NOT NULL,
  kdf_iterations INT NOT NULL,
  wrap_iv TEXT NOT NULL,
  key_version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_thread_keys (
  thread_type TEXT NOT NULL CHECK (thread_type IN ('dm', 'group')),
  thread_id UUID NOT NULL,
  epoch INT NOT NULL CHECK (epoch >= 1),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wrapped_key TEXT NOT NULL,
  wrap_iv TEXT NOT NULL,
  eph_public_key JSONB NOT NULL,
  recipient_key_version INT NOT NULL,
  wrapper_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_type, thread_id, epoch, user_id)
);

CREATE INDEX IF NOT EXISTS chat_thread_keys_user_idx ON public.chat_thread_keys (user_id);

ALTER TABLE public.user_public_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_key_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_thread_keys ENABLE ROW LEVEL SECURITY;

-- Membership test used by key policies / RPCs. SECURITY DEFINER so it can look
-- at membership tables without tripping their own RLS (same pattern as
-- is_group_member in the original chat migration).
CREATE OR REPLACE FUNCTION public.is_thread_member(p_type TEXT, p_id UUID, p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE p_type
    WHEN 'dm' THEN EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = p_id AND p_user IN (c.participant_1, c.participant_2))
    WHEN 'group' THEN EXISTS (
      SELECT 1 FROM public.group_members gm WHERE gm.group_id = p_id AND gm.user_id = p_user)
    ELSE false
  END;
$$;

DROP POLICY IF EXISTS "Public keys are readable by signed-in users." ON public.user_public_keys;
DROP POLICY IF EXISTS "Users can insert their own public key." ON public.user_public_keys;
DROP POLICY IF EXISTS "Users can update their own public key." ON public.user_public_keys;
CREATE POLICY "Public keys are readable by signed-in users." ON public.user_public_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own public key." ON public.user_public_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own public key." ON public.user_public_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their own key backup." ON public.user_key_backups;
CREATE POLICY "Users manage their own key backup." ON public.user_key_backups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own wrapped thread keys." ON public.chat_thread_keys;
DROP POLICY IF EXISTS "Users can delete their own wrapped thread keys." ON public.chat_thread_keys;
CREATE POLICY "Users can read their own wrapped thread keys." ON public.chat_thread_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- No INSERT policy: keys are published only through publish_thread_key_epoch() below,
-- which writes every member's wrap for an epoch atomically (no split-brain keys).
CREATE POLICY "Users can delete their own wrapped thread keys." ON public.chat_thread_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.user_public_keys, public.user_key_backups, public.chat_thread_keys FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_public_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_key_backups TO authenticated;
GRANT SELECT, DELETE ON TABLE public.chat_thread_keys TO authenticated;

-- Per-thread key state for the client's key-distribution logic: who is a
-- member, their current public-key version, and which key version the newest
-- epoch was wrapped to. Only members of the thread can call it.
CREATE OR REPLACE FUNCTION public.get_thread_key_state(p_type TEXT, p_id UUID)
RETURNS TABLE (out_user_id UUID, out_pub_version INT, out_row_version INT, out_latest_epoch INT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latest INT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_thread_member(p_type, p_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this thread';
  END IF;

  SELECT COALESCE(MAX(k.epoch), 0) INTO v_latest
  FROM public.chat_thread_keys k WHERE k.thread_type = p_type AND k.thread_id = p_id;

  RETURN QUERY
  WITH members AS (
    SELECT c.participant_1 AS uid FROM public.dm_conversations c WHERE p_type = 'dm' AND c.id = p_id
    UNION
    SELECT c.participant_2 FROM public.dm_conversations c WHERE p_type = 'dm' AND c.id = p_id
    UNION
    SELECT gm.user_id FROM public.group_members gm WHERE p_type = 'group' AND gm.group_id = p_id
  )
  SELECT m.uid, pk.key_version, k.recipient_key_version, v_latest
  FROM members m
  LEFT JOIN public.user_public_keys pk ON pk.user_id = m.uid
  LEFT JOIN public.chat_thread_keys k
    ON k.thread_type = p_type AND k.thread_id = p_id AND k.user_id = m.uid AND k.epoch = v_latest;
END;
$$;

-- Publish a new key epoch: every member's wrapped copy in ONE transaction,
-- serialised per thread. Returns false if somebody else published this epoch
-- first (the caller then re-reads state and adopts theirs) - so two people
-- opening a fresh chat at the same instant can never end up with different keys.
CREATE OR REPLACE FUNCTION public.publish_thread_key_epoch(p_type TEXT, p_id UUID, p_epoch INT, p_rows JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latest INT;
  r JSONB;
  v_uid UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_thread_member(p_type, p_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this thread';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_type || ':' || p_id::TEXT, 0));

  SELECT COALESCE(MAX(k.epoch), 0) INTO v_latest
  FROM public.chat_thread_keys k WHERE k.thread_type = p_type AND k.thread_id = p_id;

  IF p_epoch <> v_latest + 1 THEN
    RETURN false;
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_uid := (r->>'user_id')::UUID;
    IF NOT public.is_thread_member(p_type, p_id, v_uid) THEN
      RAISE EXCEPTION 'Recipient is not a member of this thread';
    END IF;
    INSERT INTO public.chat_thread_keys
      (thread_type, thread_id, epoch, user_id, wrapped_key, wrap_iv, eph_public_key, recipient_key_version, wrapper_id)
    VALUES
      (p_type, p_id, p_epoch, v_uid, r->>'wrapped_key', r->>'wrap_iv', r->'eph_public_key',
       (r->>'recipient_key_version')::INT, auth.uid());
  END LOOP;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_thread_member(TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread_key_state(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_thread_key_epoch(TEXT, UUID, INT, JSONB) TO authenticated;

-- ------------------------------------------------------------------
-- 2. Encrypted message columns + enforcement
-- ------------------------------------------------------------------
ALTER TABLE public.dm_messages
  ADD COLUMN IF NOT EXISTS ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS iv TEXT,
  ADD COLUMN IF NOT EXISTS key_epoch INT;
ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS iv TEXT,
  ADD COLUMN IF NOT EXISTS key_epoch INT;

-- New rows must be ciphertext-only, size-capped, and rate-limited (60 / minute
-- per sender). Existing plaintext rows are untouched.
CREATE OR REPLACE FUNCTION public.enforce_encrypted_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_recent INT;
BEGIN
  IF NEW.ciphertext IS NULL OR NEW.iv IS NULL OR NEW.key_epoch IS NULL THEN
    RAISE EXCEPTION 'Messages must be end-to-end encrypted';
  END IF;
  IF COALESCE(NEW.content, '') <> '' OR NEW.shared_item IS NOT NULL THEN
    RAISE EXCEPTION 'Plaintext message content is not allowed';
  END IF;
  IF char_length(NEW.ciphertext) > 24000 THEN
    RAISE EXCEPTION 'Message is too large';
  END IF;

  IF TG_TABLE_NAME = 'dm_messages' THEN
    SELECT COUNT(*) INTO v_recent FROM public.dm_messages m
    WHERE m.sender_id = NEW.sender_id AND m.created_at > NOW() - INTERVAL '1 minute';
  ELSE
    SELECT COUNT(*) INTO v_recent FROM public.group_messages m
    WHERE m.sender_id = NEW.sender_id AND m.created_at > NOW() - INTERVAL '1 minute';
  END IF;
  IF v_recent >= 60 THEN
    RAISE EXCEPTION 'You are sending messages too fast';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dm_messages_enforce_encrypted ON public.dm_messages;
CREATE TRIGGER dm_messages_enforce_encrypted BEFORE INSERT ON public.dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_encrypted_message();
DROP TRIGGER IF EXISTS group_messages_enforce_encrypted ON public.group_messages;
CREATE TRIGGER group_messages_enforce_encrypted BEFORE INSERT ON public.group_messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_encrypted_message();

-- Unsend: a sender can delete their own messages (nobody could before).
DROP POLICY IF EXISTS "Senders can delete their own DM messages." ON public.dm_messages;
CREATE POLICY "Senders can delete their own DM messages." ON public.dm_messages FOR DELETE USING (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Senders can delete their own group messages." ON public.group_messages;
CREATE POLICY "Senders can delete their own group messages." ON public.group_messages FOR DELETE USING (auth.uid() = sender_id);

-- ------------------------------------------------------------------
-- 3. Blocking + reporting
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own blocks." ON public.user_blocks;
DROP POLICY IF EXISTS "Users can unblock." ON public.user_blocks;
CREATE POLICY "Users can view their own blocks." ON public.user_blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock." ON public.user_blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);
-- No INSERT policy: blocking goes through block_user() below, which also removes the friendship.
REVOKE ALL ON TABLE public.user_blocks FROM anon;
GRANT SELECT, DELETE ON TABLE public.user_blocks TO authenticated;

CREATE OR REPLACE FUNCTION public.is_blocked_between(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks b
    WHERE (b.blocker_id = p_a AND b.blocked_id = p_b) OR (b.blocker_id = p_b AND b.blocked_id = p_a)
  );
$$;

CREATE OR REPLACE FUNCTION public.block_user(p_blocked UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_blocked IS NULL OR p_blocked = auth.uid() THEN
    RAISE EXCEPTION 'Invalid request';
  END IF;
  INSERT INTO public.user_blocks (blocker_id, blocked_id) VALUES (auth.uid(), p_blocked) ON CONFLICT DO NOTHING;
  DELETE FROM public.friend_requests
  WHERE (requester_id = auth.uid() AND requested_id = p_blocked)
     OR (requester_id = p_blocked AND requested_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_blocked_between(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(UUID) TO authenticated;

-- A blocked pair can't message each other or send new friend requests.
DROP POLICY IF EXISTS "Participants can send messages in their conversation." ON public.dm_messages;
CREATE POLICY "Participants can send messages in their conversation." ON public.dm_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        AND NOT public.is_blocked_between(c.participant_1, c.participant_2)
    )
  );

DROP POLICY IF EXISTS "Users can send friend requests." ON public.friend_requests;
CREATE POLICY "Users can send friend requests." ON public.friend_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND status = 'pending' AND NOT public.is_blocked_between(requester_id, requested_id)
  );

-- Unfollow / remove a friend: either side may delete the row (only the sender could before).
DROP POLICY IF EXISTS "Requesters can cancel their own friend request." ON public.friend_requests;
DROP POLICY IF EXISTS "Either side can end a friend request." ON public.friend_requests;
CREATE POLICY "Either side can end a friend request." ON public.friend_requests
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- Reports. Messages are end-to-end encrypted, so a report carries the reporter's
-- own description (and optionally text they choose to include), not server-side content.
CREATE TABLE IF NOT EXISTS public.chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  thread_type TEXT CHECK (thread_type IN ('dm', 'group')),
  thread_id UUID,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'other')),
  details TEXT CHECK (char_length(details) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can file reports." ON public.chat_reports;
DROP POLICY IF EXISTS "Users can view their own reports." ON public.chat_reports;
CREATE POLICY "Users can file reports." ON public.chat_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports." ON public.chat_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
REVOKE ALL ON TABLE public.chat_reports FROM anon;
GRANT SELECT, INSERT ON TABLE public.chat_reports TO authenticated;

-- ------------------------------------------------------------------
-- 4. Groups: only the creator adds people, and only their friends
-- ------------------------------------------------------------------
-- Previously "auth.uid() = user_id" let ANY signed-in user add themselves to
-- any group whose id they knew, and creators could add strangers.
DROP POLICY IF EXISTS "Group creator or the member themself can add a member." ON public.group_members;
DROP POLICY IF EXISTS "Group creator can add friends." ON public.group_members;
CREATE POLICY "Group creator can add friends." ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.friend_requests fr
        WHERE fr.status = 'accepted'
          AND ((fr.requester_id = auth.uid() AND fr.requested_id = user_id)
            OR (fr.requester_id = user_id AND fr.requested_id = auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Members can leave; creators can remove." ON public.group_members;
CREATE POLICY "Members can leave; creators can remove." ON public.group_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
  );

-- ------------------------------------------------------------------
-- 5. Unread + read receipts
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_reads (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  thread_type TEXT NOT NULL CHECK (thread_type IN ('dm', 'group')),
  thread_id UUID NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_type, thread_id)
);

ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own read markers." ON public.chat_reads;
CREATE POLICY "Users manage their own read markers." ON public.chat_reads
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
REVOKE ALL ON TABLE public.chat_reads FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_reads TO authenticated;

-- Two new privacy switches (Settings > Privacy).
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS send_read_receipts BOOLEAN NOT NULL DEFAULT true;

-- When the OTHER person in a DM last read it - null when they turned read
-- receipts off. Only participants can ask.
CREATE OR REPLACE FUNCTION public.get_dm_peer_read(p_conversation UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_peer UUID;
  v_result TIMESTAMPTZ;
BEGIN
  SELECT CASE WHEN c.participant_1 = auth.uid() THEN c.participant_2 ELSE c.participant_1 END INTO v_peer
  FROM public.dm_conversations c
  WHERE c.id = p_conversation AND auth.uid() IN (c.participant_1, c.participant_2);

  IF v_peer IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT COALESCE((SELECT us.send_read_receipts FROM public.user_settings us WHERE us.user_id = v_peer), true) THEN
    RETURN NULL;
  END IF;

  SELECT r.last_read_at INTO v_result FROM public.chat_reads r
  WHERE r.user_id = v_peer AND r.thread_type = 'dm' AND r.thread_id = p_conversation;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dm_peer_read(UUID) TO authenticated;

-- ------------------------------------------------------------------
-- 6. Inbox: one row per thread with the last message + unread count
-- ------------------------------------------------------------------
-- SECURITY INVOKER (the default): every table read here is filtered by the
-- caller's own RLS, so this can only ever return the caller's threads.
CREATE OR REPLACE FUNCTION public.get_chat_inbox()
RETURNS TABLE (
  out_thread_type TEXT,
  out_thread_id UUID,
  out_peer_id UUID,
  out_title TEXT,
  out_avatar_url TEXT,
  out_created_at TIMESTAMPTZ,
  out_last_at TIMESTAMPTZ,
  out_last_sender UUID,
  out_last_ciphertext TEXT,
  out_last_iv TEXT,
  out_last_epoch INT,
  out_last_content TEXT,
  out_last_shared BOOLEAN,
  out_unread INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    'dm'::TEXT,
    c.id,
    CASE WHEN c.participant_1 = auth.uid() THEN c.participant_2 ELSE c.participant_1 END,
    NULL::TEXT,
    NULL::TEXT,
    c.created_at,
    lm.created_at,
    lm.sender_id,
    lm.ciphertext,
    lm.iv,
    lm.key_epoch,
    lm.content,
    (lm.shared_item IS NOT NULL),
    (SELECT COUNT(*)::INT FROM public.dm_messages m
      WHERE m.conversation_id = c.id AND m.sender_id <> auth.uid()
        AND m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ))
  FROM public.dm_conversations c
  LEFT JOIN LATERAL (
    SELECT m.* FROM public.dm_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1
  ) lm ON true
  LEFT JOIN public.chat_reads r ON r.user_id = auth.uid() AND r.thread_type = 'dm' AND r.thread_id = c.id
  WHERE auth.uid() IN (c.participant_1, c.participant_2)

  UNION ALL

  SELECT
    'group'::TEXT,
    g.id,
    NULL::UUID,
    g.name,
    g.avatar_url,
    g.created_at,
    lm.created_at,
    lm.sender_id,
    lm.ciphertext,
    lm.iv,
    lm.key_epoch,
    lm.content,
    (lm.shared_item IS NOT NULL),
    (SELECT COUNT(*)::INT FROM public.group_messages m
      WHERE m.group_id = g.id AND m.sender_id <> auth.uid()
        AND m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ))
  FROM public.groups g
  JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = auth.uid()
  LEFT JOIN LATERAL (
    SELECT m.* FROM public.group_messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1
  ) lm ON true
  LEFT JOIN public.chat_reads r ON r.user_id = auth.uid() AND r.thread_type = 'group' AND r.thread_id = g.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_inbox() TO authenticated;

-- ------------------------------------------------------------------
-- 7. Only signed-in users may call the helper functions (Postgres grants
--    EXECUTE to PUBLIC by default, which would include signed-out visitors).
-- ------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_thread_member(TEXT, UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_thread_key_state(TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_thread_key_epoch(TEXT, UUID, INT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_blocked_between(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_user(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_dm_peer_read(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_chat_inbox() FROM PUBLIC, anon;
