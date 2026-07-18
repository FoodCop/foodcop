-- ==========================================
-- Service-role points award path (for masterbot/seed content)
-- ==========================================
-- award_points() (20260719000000_points_and_gamification.sql) hardcodes
-- v_user_id := auth.uid(), so it can only ever credit whoever the caller's
-- JWT says they are - there is no way to pass an explicit user id, and it's
-- only GRANTed to `authenticated`. That's correct for the real Create Card
-- flow (a client can't fabricate points for someone else), but it means
-- masterbot content - inserted directly via the service-role key by
-- scripts/seed_masterbots.ts / scripts/seed_masterbot_dish_cards.ts, with no
-- authenticated session at all - could never earn points through it.
--
-- Per explicit decision to have masterbots earn points and appear on
-- /leaderboard (reversing the earlier is_master_bot leaderboard exclusion,
-- see pointsService.ts), this adds a second, explicit-user-id entry point
-- with the exact same points/counter logic, restricted to service_role only
-- (GRANT EXECUTE ... TO service_role, nothing to authenticated/anon) so a
-- real client still can never credit an arbitrary account.
CREATE OR REPLACE FUNCTION public.award_points_for_user(
  p_user_id UUID,
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
  v_points INT;
  v_counter_key TEXT;
  v_inserted BOOLEAN := true;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  v_points := CASE p_action_type
    WHEN 'create_recipe' THEN 40
    WHEN 'create_video' THEN 25
    WHEN 'create_restaurant' THEN 20
    WHEN 'create_discovery' THEN 15
    WHEN 'share_card' THEN 10
    ELSE 0
  END;

  v_counter_key := CASE p_action_type
    WHEN 'create_recipe' THEN 'recipe_cards'
    WHEN 'create_restaurant' THEN 'restaurant_cards'
    WHEN 'create_video' THEN 'video_cards'
    WHEN 'create_discovery' THEN 'discovery_cards'
    WHEN 'share_card' THEN 'cards_shared'
    ELSE NULL
  END;

  BEGIN
    INSERT INTO public.points_ledger (user_id, action_type, points, source_type, source_id)
    VALUES (p_user_id, p_action_type, v_points, p_source_type, p_source_id);
  EXCEPTION WHEN unique_violation THEN
    v_inserted := false;
  END;

  IF v_inserted THEN
    UPDATE public.users
      SET points_total = points_total + v_points,
          points_level = FLOOR((points_total + v_points) / 200.0)::INT + 1
      WHERE id = p_user_id;

    INSERT INTO public.user_stats (user_id, counters)
    VALUES (p_user_id, jsonb_build_object(v_counter_key, 1))
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
    WHERE u.id = p_user_id;
END;
$$;

-- service_role only - no GRANT to authenticated/anon, so a real client can
-- never call this to credit an arbitrary account.
GRANT EXECUTE ON FUNCTION public.award_points_for_user(UUID, TEXT, TEXT, TEXT) TO service_role;
