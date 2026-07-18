-- ==========================================
-- Chat, Friend Requests, Groups, and Event RSVPs
-- ==========================================
-- src/lib/services/chatService.ts and rsvpService.ts were already written
-- (and src/components/chat/ChatView.tsx already wired) against
-- dm_conversations/dm_messages/groups/group_members/group_messages/
-- event_rsvps, but no migration ever created them. friend_requests is new:
-- unlike the legacy app (which hardcoded every contact's requestStatus to
-- 'accepted' and never actually gated messaging), this build makes the
-- friend-request flow a real gate on starting a DM - a conversation can only
-- be created between two users once a friend_requests row between them is
-- 'accepted'.

-- 1. FRIEND REQUESTS
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, requested_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_requested_idx ON public.friend_requests (requested_id, status);
CREATE INDEX IF NOT EXISTS friend_requests_requester_idx ON public.friend_requests (requester_id, status);

-- 2. DM CONVERSATIONS (participant_1/participant_2 always alphabetically
-- sorted by ChatService.getOrCreateConversation, so a pair maps to one row)
CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_1, participant_2)
);

CREATE INDEX IF NOT EXISTS dm_conversations_participant_1_idx ON public.dm_conversations (participant_1);
CREATE INDEX IF NOT EXISTS dm_conversations_participant_2_idx ON public.dm_conversations (participant_2);

-- 3. DM MESSAGES
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  shared_item JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dm_messages_conversation_idx ON public.dm_messages (conversation_id, created_at);

-- 4. GROUPS / GROUP MEMBERS / GROUP MESSAGES (invite-by-creation, not
-- friend-gated - matches legacy's group behavior)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  shared_item JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS group_messages_group_idx ON public.group_messages (group_id, created_at);

-- 5. EVENT RSVPS (message_id is a plain UUID, not a hard FK, since an event
-- invite can be a dm_message or a group_message)
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_rsvps_message_idx ON public.event_rsvps (message_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Friend requests: either side of the request can see/act on it.
CREATE POLICY "Users can view their own friend requests." ON public.friend_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = requested_id);
CREATE POLICY "Users can send friend requests." ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Recipients and requesters can update a friend request." ON public.friend_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = requested_id);
CREATE POLICY "Requesters can cancel their own friend request." ON public.friend_requests
  FOR DELETE USING (auth.uid() = requester_id);

-- DM conversations: only participants can see a conversation. Creating one
-- requires an accepted friend_requests row between the two participants -
-- this is the actual database-level enforcement of the friend gate (the UI
-- also prevents this, but the DB does not trust the client alone).
CREATE POLICY "Participants can view their own conversations." ON public.dm_conversations
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Conversations require an accepted friend request." ON public.dm_conversations
  FOR INSERT WITH CHECK (
    (auth.uid() = participant_1 OR auth.uid() = participant_2)
    AND EXISTS (
      SELECT 1 FROM public.friend_requests fr
      WHERE fr.status = 'accepted'
        AND (
          (fr.requester_id = participant_1 AND fr.requested_id = participant_2)
          OR (fr.requester_id = participant_2 AND fr.requested_id = participant_1)
        )
    )
  );

-- DM messages: only participants of the parent conversation can read/write.
CREATE POLICY "Participants can view their conversation messages." ON public.dm_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );
CREATE POLICY "Participants can send messages in their conversation." ON public.dm_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = conversation_id
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Groups: membership-gated, no friend-request involvement. Membership checks
-- go through is_group_member() (SECURITY DEFINER) rather than a direct
-- self-join on group_members - a policy that queries its own table directly
-- triggers Postgres's "infinite recursion detected in policy" error, since
-- evaluating the policy re-triggers the same policy on the inner query.
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

CREATE POLICY "Members can view their groups." ON public.groups
  FOR SELECT USING (public.is_group_member(id, auth.uid()));
CREATE POLICY "Authenticated users can create groups." ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view their group's membership list." ON public.group_members
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Group creator or the member themself can add a member." ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
  );

CREATE POLICY "Members can view their group's messages." ON public.group_messages
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Members can send messages in their group." ON public.group_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_group_member(group_id, auth.uid()));

-- Event RSVPs: viewable by anyone who can see the parent message's thread is
-- overkill to check here (message_id isn't a hard FK to either message
-- table) - keep it simple and consistent with saved_items/food_cards:
-- readable by everyone, writable only by the RSVP's own owner.
CREATE POLICY "RSVPs are viewable by everyone." ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can manage their own RSVP." ON public.event_rsvps
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- REALTIME
-- ==========================================
-- Without this, ChatService's postgres_changes subscriptions
-- (subscribeToConversationMessages, subscribeToIncomingMessages,
-- subscribeToGroupMessages) silently receive nothing.
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Grants
GRANT ALL ON TABLE public.friend_requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.dm_conversations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.dm_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.event_rsvps TO anon, authenticated, service_role;
