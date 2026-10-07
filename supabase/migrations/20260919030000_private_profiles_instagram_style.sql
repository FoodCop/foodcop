-- ==========================================
-- Private profiles, Instagram-style
-- ==========================================
-- A private profile still shows its header (photo, name, bio, Follow / Message)
-- to everyone - only the content (posts, highlights, moments, Food DNA) is
-- restricted, and it is visible to APPROVED followers (accepted friend
-- requests), exactly like a private Instagram account.
--
-- This supersedes the "Private = owner only" rule from 20260919010000: with
-- that rule a Follow button on a private profile could never unlock anything.
-- 'Followers' (legacy value) and 'Private' now behave the same; the Settings
-- screen only offers Public / Private.
--
-- Also adds get_friend_count(): friend_requests is (correctly) visible only to
-- the two people involved, so a visitor could never count someone else's
-- friends and the profile header showed a wrong number. The count alone is
-- safe to expose.

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
    OR EXISTS (
      SELECT 1 FROM public.friend_requests fr
      WHERE fr.status = 'accepted'
        AND ((fr.requester_id = p_owner AND fr.requested_id = auth.uid())
          OR (fr.requester_id = auth.uid() AND fr.requested_id = p_owner))
    );
$$;

CREATE OR REPLACE FUNCTION public.get_friend_count(p_user UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.friend_requests fr
  WHERE fr.status = 'accepted'
    AND (fr.requester_id = p_user OR fr.requested_id = p_user);
$$;

GRANT EXECUTE ON FUNCTION public.can_view_profile(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_count(UUID) TO authenticated;
