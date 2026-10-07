-- ============================================================================
-- friend_requests lockdown (security review, 2026-10-07)
-- ============================================================================
-- 20260919010000_privacy_hardening.sql meant to stop a sender from marking
-- their own request 'accepted', but it didn't. Postgres ORs the WITH CHECK
-- clauses of permissive UPDATE policies independently of their USING clauses,
-- and nothing stopped an UPDATE from rewriting requester_id / requested_id.
-- So a sender could turn their pending A -> V request into V -> A 'accepted'
-- (the old row passes the sender's USING, the new row passes the recipient's
-- WITH CHECK) and get a friendship V never agreed to. That unlocked V's
-- private profile content and location pins (can_view_profile), let A open a
-- DM with V and add V to A's groups, and counted A as V's friend.
--
-- Fix:
--   1. A BEFORE UPDATE trigger that never lets the sender / recipient change,
--      only lets the RECIPIENT set 'accepted' or 'declined', and only lets the
--      SENDER move a request back to 'pending' (re-send). It also keeps
--      updated_at current. Column grants aren't used because the app re-sends
--      with an upsert that writes the (unchanged) id columns too.
--   2. Tighter UPDATE policies: each one's WITH CHECK only allows the statuses
--      that party may set.
--   3. No request to yourself (NOT VALID, so existing rows aren't re-checked).
--   4. Signed-out (anon) users can't write to friend_requests at all.
--
-- Friendships forged before this migration aren't detectable from the data;
-- they stay until one side removes them.
-- ============================================================================

-- 1. Guard trigger ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.friend_requests_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF NEW.requester_id IS DISTINCT FROM OLD.requester_id
     OR NEW.requested_id IS DISTINCT FROM OLD.requested_id THEN
    RAISE EXCEPTION 'A friend request''s sender and recipient cannot be changed.'
      USING ERRCODE = '42501';
  END IF;

  -- auth.uid() is NULL only for server-side (service role) calls, which are trusted.
  IF uid IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('accepted', 'declined') AND uid <> OLD.requested_id THEN
      RAISE EXCEPTION 'Only the recipient can accept or decline a friend request.'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.status = 'pending' AND (uid <> OLD.requester_id OR OLD.status = 'accepted') THEN
      RAISE EXCEPTION 'Only the sender can re-send a friend request that was not accepted.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friend_requests_guard_update ON public.friend_requests;
CREATE TRIGGER friend_requests_guard_update
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.friend_requests_guard_update();

-- 2. Tighter UPDATE policies -------------------------------------------------
DROP POLICY IF EXISTS "Recipients can respond to a friend request." ON public.friend_requests;
CREATE POLICY "Recipients can respond to a friend request." ON public.friend_requests
  FOR UPDATE USING (auth.uid() = requested_id)
  WITH CHECK (auth.uid() = requested_id AND status IN ('accepted', 'declined'));

DROP POLICY IF EXISTS "Requesters can re-send a declined request." ON public.friend_requests;
CREATE POLICY "Requesters can re-send a declined request." ON public.friend_requests
  FOR UPDATE USING (auth.uid() = requester_id AND status IN ('pending', 'declined'))
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- 3. No request to yourself ---------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'friend_requests_not_self'
      AND conrelid = 'public.friend_requests'::regclass
  ) THEN
    ALTER TABLE public.friend_requests
      ADD CONSTRAINT friend_requests_not_self CHECK (requester_id <> requested_id) NOT VALID;
  END IF;
END;
$$;

-- 4. Signed-out users can't write ---------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.friend_requests FROM anon;
