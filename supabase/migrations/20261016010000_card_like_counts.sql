-- ============================================================================
-- Like counts (client, 2026-10-16; plan: docs/VIDEO_URL_PLAN.md, phase 3)
-- ============================================================================
-- Trims shows how many people liked each video. food_card_likes only lets
-- people read their own likes (20261006020000), so this returns just the
-- numbers - never who - and only for posts the caller may see (published on
-- a profile they can view, or their own).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_card_like_counts(p_ids UUID[])
RETURNS TABLE (card_id UUID, likes BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, count(l.user_id)
  FROM public.food_cards c
  LEFT JOIN public.food_card_likes l ON l.card_id = c.id
  WHERE c.id = ANY (p_ids[1:100])
    AND (c.user_id = auth.uid() OR (c.status = 'PUBLISHED' AND public.can_view_profile(c.user_id)))
  GROUP BY c.id;
$$;
REVOKE ALL ON FUNCTION public.get_card_like_counts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_card_like_counts(UUID[]) TO anon, authenticated;
