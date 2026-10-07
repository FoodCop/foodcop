-- ==========================================
-- Privacy & integrity hardening (Profile / Settings audit, 2026-09-19)
-- ==========================================
-- Found by auditing every table the Profile + Settings tab read or write.
-- Idempotent: safe to run more than once. Nothing here changes what a user
-- can do with their OWN data; it only closes paths to other people's.
--
--  1. public.users exposed email/phone/address/coordinates to everyone
--     (incl. signed-out visitors) via the REST API, and let any user edit
--     their own points_total / points_level / is_master_bot.
--  2. user_settings (notification + ML-consent prefs) was readable by all.
--  3. profile_visibility was only enforced by the /profile/[userId] page in
--     the browser - the underlying tables ignored it, so a Private profile's
--     cards / moments / highlights / pins were one API call away.
--  4. friend_requests let the SENDER insert or update a request as
--     'accepted', bypassing the friend gate (DMs, Followers-only profiles).
--  5. event_rsvps was readable by everyone.

-- ------------------------------------------------------------------
-- 1. users: column-level privileges
-- ------------------------------------------------------------------
-- RLS is row-level, so hiding a column needs column privileges. Readable by
-- everyone: identity + presence + points. Private (owner reads them through
-- my_private_profile below): email, phone, location, lat, lng,
-- notifications_seen_at. Not writable by a client at all: id, created_at,
-- points_total, points_level, is_master_bot (points are only ever changed by
-- the SECURITY DEFINER award_points(); service_role is unaffected).
-- Column lists are computed from information_schema so any column added in a
-- migration this audit did not see is still granted by default.
DO $$
DECLARE
  select_cols text;
  insert_cols text;
  update_cols text;
BEGIN
  SELECT string_agg(format('%I', column_name), ', ') INTO select_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name NOT IN ('email', 'phone', 'location', 'lat', 'lng', 'notifications_seen_at');

  SELECT string_agg(format('%I', column_name), ', ') INTO insert_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name NOT IN ('points_total', 'points_level', 'is_master_bot');

  SELECT string_agg(format('%I', column_name), ', ') INTO update_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name NOT IN ('id', 'created_at', 'points_total', 'points_level', 'is_master_bot');

  REVOKE ALL ON TABLE public.users FROM anon, authenticated;
  EXECUTE format('GRANT SELECT (%s) ON public.users TO anon, authenticated', select_cols);
  EXECUTE format('GRANT INSERT (%s) ON public.users TO authenticated', insert_cols);
  EXECUTE format('GRANT UPDATE (%s) ON public.users TO authenticated', update_cols);
END $$;

-- The signed-in user's own private columns. A view (owner-privileged) is used
-- rather than a function so callers keep normal PostgREST select() syntax;
-- it can only ever return the caller's own row.
CREATE OR REPLACE VIEW public.my_private_profile AS
  SELECT id, email, phone, location, lat, lng, notifications_seen_at
  FROM public.users
  WHERE id = auth.uid();

REVOKE ALL ON public.my_private_profile FROM anon, authenticated;
GRANT SELECT ON public.my_private_profile TO authenticated;

-- ------------------------------------------------------------------
-- 2 + 3. Profile visibility, enforced in the database
-- ------------------------------------------------------------------
-- Public = everyone; Followers = the owner + accepted friends (same mutual
-- model Chat and the profile page already use); Private = the owner only.
-- No user_settings row = Public (matches the app default).
CREATE OR REPLACE FUNCTION public.can_view_profile(p_owner UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_owner = auth.uid()
    OR COALESCE((SELECT us.profile_visibility FROM public.user_settings us WHERE us.user_id = p_owner), 'Public') = 'Public'
    OR (
      COALESCE((SELECT us.profile_visibility FROM public.user_settings us WHERE us.user_id = p_owner), 'Public') = 'Followers'
      AND EXISTS (
        SELECT 1 FROM public.friend_requests fr
        WHERE fr.status = 'accepted'
          AND ((fr.requester_id = p_owner AND fr.requested_id = auth.uid())
            OR (fr.requester_id = auth.uid() AND fr.requested_id = p_owner))
      )
    );
$$;

-- What a visitor is allowed to learn about someone else's settings: whether
-- they may view the profile, and whether Food DNA is shown. Nothing else.
CREATE OR REPLACE FUNCTION public.get_profile_access(p_owner UUID)
RETURNS TABLE (out_can_view BOOLEAN, out_visibility TEXT, out_show_food_dna BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.can_view_profile(p_owner),
    COALESCE(us.profile_visibility, 'Public'),
    COALESCE(us.show_food_dna, true)
  FROM (SELECT 1) AS d
  LEFT JOIN public.user_settings us ON us.user_id = p_owner;
$$;

GRANT EXECUTE ON FUNCTION public.can_view_profile(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_access(UUID) TO anon, authenticated;

-- user_settings back to owner-only (20260725030000 opened it to everyone).
DROP POLICY IF EXISTS "User settings are viewable by everyone." ON public.user_settings;
DROP POLICY IF EXISTS "Users can view own settings." ON public.user_settings;
CREATE POLICY "Users can view own settings." ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

-- Content tables: a profile's content follows its visibility.
DROP POLICY IF EXISTS "Published food cards are viewable by everyone." ON public.food_cards;
DROP POLICY IF EXISTS "Published food cards follow profile visibility." ON public.food_cards;
CREATE POLICY "Published food cards follow profile visibility." ON public.food_cards
  FOR SELECT USING (auth.uid() = user_id OR (status = 'PUBLISHED' AND public.can_view_profile(user_id)));

DROP POLICY IF EXISTS "Food moments are viewable by everyone." ON public.food_moments;
DROP POLICY IF EXISTS "Food moments follow profile visibility." ON public.food_moments;
CREATE POLICY "Food moments follow profile visibility." ON public.food_moments
  FOR SELECT USING (public.can_view_profile(user_id));

DROP POLICY IF EXISTS "Highlights are viewable by everyone." ON public.profile_highlights;
DROP POLICY IF EXISTS "Highlights follow profile visibility." ON public.profile_highlights;
CREATE POLICY "Highlights follow profile visibility." ON public.profile_highlights
  FOR SELECT USING (public.can_view_profile(user_id));

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
DROP POLICY IF EXISTS "Posts follow profile visibility." ON public.posts;
CREATE POLICY "Posts follow profile visibility." ON public.posts
  FOR SELECT USING (public.can_view_profile(user_id));

DROP POLICY IF EXISTS "Fuzo locations are viewable by everyone." ON public.fuzo_locations;
DROP POLICY IF EXISTS "Fuzo locations follow profile visibility." ON public.fuzo_locations;
CREATE POLICY "Fuzo locations follow profile visibility." ON public.fuzo_locations
  FOR SELECT USING (public.can_view_profile(user_id));

-- ------------------------------------------------------------------
-- 4. friend_requests: only the RECIPIENT can accept/decline
-- ------------------------------------------------------------------
-- Everything downstream (DM creation, Followers-only profiles) trusts
-- status = 'accepted', so it must not be settable by the sender.
DROP POLICY IF EXISTS "Users can send friend requests." ON public.friend_requests;
CREATE POLICY "Users can send friend requests." ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id AND status = 'pending');

DROP POLICY IF EXISTS "Recipients and requesters can update a friend request." ON public.friend_requests;
DROP POLICY IF EXISTS "Recipients can respond to a friend request." ON public.friend_requests;
DROP POLICY IF EXISTS "Requesters can re-send a declined request." ON public.friend_requests;
CREATE POLICY "Recipients can respond to a friend request." ON public.friend_requests
  FOR UPDATE USING (auth.uid() = requested_id) WITH CHECK (auth.uid() = requested_id);
-- The app re-sends via upsert (declined -> pending); a sender may only ever move
-- their own request to 'pending', and never touch one that is already accepted.
CREATE POLICY "Requesters can re-send a declined request." ON public.friend_requests
  FOR UPDATE USING (auth.uid() = requester_id AND status IN ('pending', 'declined'))
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- ------------------------------------------------------------------
-- 5. event_rsvps: visible to the RSVPer and to anyone who can see the
--    message (DM or group) the event lives in - RLS on those tables applies
--    inside these sub-selects, so this reuses their existing rules.
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "RSVPs are viewable by everyone." ON public.event_rsvps;
DROP POLICY IF EXISTS "RSVPs are viewable by the thread." ON public.event_rsvps;
CREATE POLICY "RSVPs are viewable by the thread." ON public.event_rsvps
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.dm_messages m WHERE m.id = message_id)
    OR EXISTS (SELECT 1 FROM public.group_messages g WHERE g.id = message_id)
  );

-- ------------------------------------------------------------------
-- Tidy: signed-out visitors have no business on the events log.
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.user_events') IS NOT NULL THEN
    REVOKE ALL ON TABLE public.user_events FROM anon;
  END IF;
END $$;
