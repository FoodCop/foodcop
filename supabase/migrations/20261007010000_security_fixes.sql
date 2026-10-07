-- ============================================================================
-- Security fixes (security review, 2026-10-07)
-- ============================================================================
-- 1. award_points_for_user could be called by anyone (even signed out) to
--    credit any account: Postgres lets PUBLIC execute new functions and the
--    migration never revoked that. Now service_role only.
-- 2. award_points trusted whatever card / share id the app sent, so a user
--    could claim "created a recipe" again and again with made-up ids. It now
--    only awards points for the caller's own published card of the matching
--    kind, or a message the caller really sent.
-- 3. is_blocked_between told anyone whether two OTHER users had blocked each
--    other. It now answers only for pairs that include the caller (every
--    policy that uses it already passes the caller as one side).
-- 4. Users could write their own food_cards.stats (likes / saves) and
--    user_stats.counters (reward progress) directly. Those columns now only
--    change through the database's own functions.
-- 5. Any account could switch itself to "business" and claim a popular
--    restaurant's Google place, so Scout showed that restaurant with the
--    attacker's name, phone and website and sent Reserve / Order there. A
--    Google place link now has to be verified (place_verified, set by FUZO
--    staff in the Supabase dashboard) before it takes over the Google pin,
--    and each place can have only one verified owner. Links that existed
--    before this migration and aren't shared with another account are
--    kept as verified, so current restaurants keep working.
--
-- "App users" below means requests made with the anon / authenticated roles
-- (current_user). Database functions that run as their owner
-- (SECURITY DEFINER, e.g. award_points) and the service role are not
-- affected by the guards.
-- ============================================================================

-- 1. award_points_for_user: service role only ---------------------------------
REVOKE ALL ON FUNCTION public.award_points_for_user(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_points_for_user(UUID, TEXT, TEXT, TEXT) TO service_role;

-- 2. award_points: only for real, owned sources -------------------------------
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
    -- A message the caller really sent (DM or group).
    IF p_source_type IS DISTINCT FROM 'share' OR NOT (
      EXISTS (SELECT 1 FROM public.dm_messages m WHERE m.id = v_source AND m.sender_id = v_user_id)
      OR EXISTS (SELECT 1 FROM public.group_messages m WHERE m.id = v_source AND m.sender_id = v_user_id)
    ) THEN
      RAISE EXCEPTION 'Not eligible for points' USING ERRCODE = '42501';
    END IF;
  ELSE
    -- The caller's own published card of the matching kind.
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
  END IF;

  BEGIN
    INSERT INTO public.points_ledger (user_id, action_type, points, source_type, source_id)
    VALUES (v_user_id, p_action_type, v_points, p_source_type, p_source_id);
  EXCEPTION WHEN unique_violation THEN
    v_inserted := false;
  END;

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

-- 3. is_blocked_between: only for pairs that include the caller ---------------
CREATE OR REPLACE FUNCTION public.is_blocked_between(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.uid() IS NULL OR auth.uid() IN (p_a, p_b))
    AND EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = p_a AND b.blocked_id = p_b) OR (b.blocker_id = p_b AND b.blocked_id = p_a)
    );
$$;

-- 4. Like / save counts and reward counters: not writable by app users ------
CREATE OR REPLACE FUNCTION public.food_cards_guard_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.stats := '{"likes": 0, "saves": 0}'::jsonb;
    ELSE
      NEW.stats := OLD.stats;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS food_cards_guard_stats ON public.food_cards;
CREATE TRIGGER food_cards_guard_stats
  BEFORE INSERT OR UPDATE ON public.food_cards
  FOR EACH ROW EXECUTE FUNCTION public.food_cards_guard_stats();

CREATE OR REPLACE FUNCTION public.user_stats_guard_counters()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.counters := '{}'::jsonb;
    ELSE
      NEW.counters := OLD.counters;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_stats_guard_counters ON public.user_stats;
CREATE TRIGGER user_stats_guard_counters
  BEFORE INSERT OR UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.user_stats_guard_counters();

-- 5. Verified Google place links for restaurants ------------------------------
ALTER TABLE public.restaurant_profiles
  ADD COLUMN IF NOT EXISTS place_verified BOOLEAN NOT NULL DEFAULT false;

-- Keep today's links working, except a place two or more accounts both claim.
UPDATE public.restaurant_profiles rp
SET place_verified = true
WHERE rp.place_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.restaurant_profiles other
    WHERE other.place_id = rp.place_id AND other.user_id <> rp.user_id
  );

-- One verified owner per Google place.
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_profiles_verified_place_key
  ON public.restaurant_profiles (place_id)
  WHERE place_verified AND place_id IS NOT NULL;

-- App users can't mark themselves verified; changing the linked place
-- needs verifying again.
CREATE OR REPLACE FUNCTION public.restaurant_profiles_guard_verified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.place_verified := false;
    ELSIF NEW.place_id IS DISTINCT FROM OLD.place_id THEN
      NEW.place_verified := false;
    ELSE
      NEW.place_verified := OLD.place_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restaurant_profiles_guard_verified ON public.restaurant_profiles;
CREATE TRIGGER restaurant_profiles_guard_verified
  BEFORE INSERT OR UPDATE ON public.restaurant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.restaurant_profiles_guard_verified();
