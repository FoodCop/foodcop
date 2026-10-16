-- ============================================================================
-- Video & URL posts security review fixes (plan: docs/VIDEO_URL_PLAN.md, phase 8)
-- ============================================================================
-- Imported posts (URL import: source_url set) no longer earn create points.
-- Before this, importing 100 TikTok links would earn 25 points each for other
-- people's content. Your own photos and videos still earn as before, and so
-- does sharing. award_points is the 20261016000000 version plus that one rule.
-- ============================================================================

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
      WHEN 'create_restaurant' THEN ARRAY['RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD', 'RESTAURANT_PHOTO']
      WHEN 'create_video' THEN ARRAY['BITE_VIDEO', 'RECIPE_VIDEO', 'REVIEW_VIDEO', 'TOUR_VIDEO']
      WHEN 'create_discovery' THEN ARRAY['FOOD_REVIEW', 'FOOD_EXPLORATION', 'FOOD_RECOMMENDATION', 'FOOD_COLLECTION', 'VIBE_PHOTO', 'FOOD_PHOTO']
    END;
    IF p_source_type IS DISTINCT FROM 'food_card' OR NOT EXISTS (
      SELECT 1 FROM public.food_cards c
      WHERE c.id = v_source
        AND c.user_id = v_user_id
        AND c.status = 'PUBLISHED'
        AND c.card_type = ANY (v_card_types)
        -- Imported posts (URL import) are someone else's content: no create reward.
        AND c.source_url IS NULL
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
