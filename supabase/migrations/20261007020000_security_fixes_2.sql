-- ============================================================================
-- Security fixes, second pass (security review, 2026-10-07)
-- ============================================================================
-- 1. Storage: the three public buckets had "anyone can read" SELECT policies,
--    so anyone (even signed out) could LIST every file in a user's folder:
--    private profiles' food-moment photos, draft videos, and photos shared
--    inside encrypted chats. Public buckets serve their public URLs without
--    any SELECT policy, so the app's image links keep working; the policies
--    now only let a signed-in user see their own folder (needed when they
--    replace or delete their own files). New uploads also get unguessable
--    names (crypto.randomUUID, src/lib/services/mediaUploadService.ts).
-- 2. Points could still be farmed:
--    a. one card earned all four "create" rewards by changing its card_type
--       -> only one create reward per card;
--    b. publish, claim, delete / unpublish, repeat -> the reward is taken back
--       when the card is deleted or unpublished;
--    c. "shares" into a group with nobody else in it -> shares only count in
--       a DM or a group with at least one other member, and at most 10 share
--       rewards per 24 hours.
-- ============================================================================

-- 1. Storage: no public listing --------------------------------------------
DROP POLICY IF EXISTS "Food moment media is publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Food card media is publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Profile media is publicly readable" ON storage.objects;

DROP POLICY IF EXISTS "Users can see their own uploaded media" ON storage.objects;
CREATE POLICY "Users can see their own uploaded media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('food-moments', 'food-card-media', 'profile-media')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. award_points: one create reward per card, real shares only, share cap ---
CREATE OR REPLACE FUNCTION public.award_points(
  p_action_type TEXT,
  p_source_type TEXT,
  p_source_id TEXT
)
RETURNS TABLE (out_points_awarded INT, out_points_total INT, out_points_level INT, out_was_duplicate BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_points INT;
  v_counter_key TEXT;
  v_inserted BOOLEAN := true;
  v_source UUID;
  v_card_types TEXT[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_points := CASE p_action_type
    WHEN 'create_recipe' THEN 40
    WHEN 'create_video' THEN 25
    WHEN 'create_restaurant' THEN 20
    WHEN 'create_discovery' THEN 15
    WHEN 'share_card' THEN 10
    ELSE NULL
  END;

  v_counter_key := CASE p_action_type
    WHEN 'create_recipe' THEN 'recipe_cards'
    WHEN 'create_restaurant' THEN 'restaurant_cards'
    WHEN 'create_video' THEN 'video_cards'
    WHEN 'create_discovery' THEN 'discovery_cards'
    WHEN 'share_card' THEN 'cards_shared'
    ELSE NULL
  END;

  IF v_points IS NULL THEN
    RAISE EXCEPTION 'Unknown action' USING ERRCODE = '22023';
  END IF;

  IF p_source_id IS NULL OR p_source_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Not eligible for points' USING ERRCODE = '42501';
  END IF;
  v_source := p_source_id::uuid;

  IF p_action_type = 'share_card' THEN
    -- A message the caller really sent, in a DM or a group with someone else in it.
    IF p_source_type IS DISTINCT FROM 'share' OR NOT (
      EXISTS (SELECT 1 FROM public.dm_messages m WHERE m.id = v_source AND m.sender_id = v_user_id)
      OR EXISTS (
        SELECT 1 FROM public.group_messages m
        WHERE m.id = v_source AND m.sender_id = v_user_id
          AND EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = m.group_id AND gm.user_id <> v_user_id
          )
      )
    ) THEN
      RAISE EXCEPTION 'Not eligible for points' USING ERRCODE = '42501';
    END IF;
    -- At most 10 share rewards per 24 hours: past that, sharing still works, it just earns nothing.
    IF (
      SELECT count(*) FROM public.points_ledger l
      WHERE l.user_id = v_user_id AND l.action_type = 'share_card' AND l.created_at > now() - interval '24 hours'
    ) >= 10 THEN
      v_inserted := false;
    END IF;
  ELSE
    -- The caller's own published card of the matching kind ...
    v_card_types := CASE p_action_type
      WHEN 'create_recipe' THEN ARRAY['RECIPE', 'HOME_COOKING', 'DESSERT', 'DRINK']
      WHEN 'create_restaurant' THEN ARRAY['RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD']
      WHEN 'create_video' THEN ARRAY['BITE_VIDEO']
      WHEN 'create_discovery' THEN ARRAY['FOOD_REVIEW', 'FOOD_EXPLORATION', 'FOOD_RECOMMENDATION', 'FOOD_COLLECTION']
    END;
    IF p_source_type IS DISTINCT FROM 'food_card' OR NOT EXISTS (
      SELECT 1 FROM public.food_cards c
      WHERE c.id = v_source
        AND c.user_id = v_user_id
        AND c.status = 'PUBLISHED'
        AND c.card_type = ANY (v_card_types)
    ) THEN
      RAISE EXCEPTION 'Not eligible for points' USING ERRCODE = '42501';
    END IF;
    -- ... and only one create reward per card, whatever its type is changed to.
    IF EXISTS (
      SELECT 1 FROM public.points_ledger l
      WHERE l.user_id = v_user_id AND l.source_type = 'food_card' AND l.source_id = p_source_id
        AND l.action_type LIKE 'create\_%'
    ) THEN
      v_inserted := false;
    END IF;
  END IF;

  IF v_inserted THEN
    BEGIN
      INSERT INTO public.points_ledger (user_id, action_type, points, source_type, source_id)
      VALUES (v_user_id, p_action_type, v_points, p_source_type, p_source_id);
    EXCEPTION WHEN unique_violation THEN
      v_inserted := false;
    END;
  END IF;

  IF v_inserted THEN
    UPDATE public.users
      SET points_total = points_total + v_points,
          points_level = FLOOR((points_total + v_points) / 200.0)::INT + 1
      WHERE id = v_user_id;

    INSERT INTO public.user_stats (user_id, counters)
    VALUES (v_user_id, jsonb_build_object(v_counter_key, 1))
    ON CONFLICT (user_id) DO UPDATE
    SET counters = jsonb_set(
      public.user_stats.counters,
      ARRAY[v_counter_key],
      to_jsonb(COALESCE((public.user_stats.counters->>v_counter_key)::int, 0) + 1)
    );
  END IF;

  RETURN QUERY
    SELECT
      (CASE WHEN v_inserted THEN v_points ELSE 0 END),
      u.points_total,
      u.points_level,
      NOT v_inserted
    FROM public.users u
    WHERE u.id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.award_points(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_points(TEXT, TEXT, TEXT) TO authenticated;

-- 3. Take a card's create reward back when it's deleted or unpublished -------
CREATE OR REPLACE FUNCTION public.food_cards_reverse_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_key TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NOT (OLD.status = 'PUBLISHED' AND NEW.status IS DISTINCT FROM 'PUBLISHED') THEN
    RETURN NULL;
  END IF;

  FOR r IN
    DELETE FROM public.points_ledger l
    WHERE l.user_id = OLD.user_id AND l.source_type = 'food_card' AND l.source_id = OLD.id::text
      AND l.action_type LIKE 'create\_%'
    RETURNING l.action_type, l.points
  LOOP
    UPDATE public.users
      SET points_total = GREATEST(points_total - r.points, 0),
          points_level = FLOOR(GREATEST(points_total - r.points, 0) / 200.0)::INT + 1
      WHERE id = OLD.user_id;

    v_key := CASE r.action_type
      WHEN 'create_recipe' THEN 'recipe_cards'
      WHEN 'create_restaurant' THEN 'restaurant_cards'
      WHEN 'create_video' THEN 'video_cards'
      WHEN 'create_discovery' THEN 'discovery_cards'
    END;
    UPDATE public.user_stats
      SET counters = jsonb_set(
        counters,
        ARRAY[v_key],
        to_jsonb(GREATEST(COALESCE((counters->>v_key)::int, 0) - 1, 0))
      )
      WHERE user_id = OLD.user_id AND counters ? v_key;
  END LOOP;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.food_cards_reverse_points() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS food_cards_reverse_points ON public.food_cards;
CREATE TRIGGER food_cards_reverse_points
  AFTER DELETE OR UPDATE OF status ON public.food_cards
  FOR EACH ROW EXECUTE FUNCTION public.food_cards_reverse_points();
