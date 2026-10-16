-- ============================================================================
-- Video posts (client, 2026-10-16; plan: docs/VIDEO_URL_PLAN.md, phase 2)
-- ============================================================================
-- 1. Three post types: RECIPE_VIDEO (2a), REVIEW_VIDEO (2b), TOUR_VIDEO (2c).
--    They show in Trims and Profile -> Videos (not the Feed or Bites).
-- 2. New fields: the video's length and size, a tour's stops, and for URL
--    imports (3a) the original link, platform and creator. The video itself
--    is media_url and its cover image_url (both already on food_cards).
-- 3. Rules: a published video post has a video (or, for an import, its link)
--    and a cover; a review has its place; a tour has 2+ stops, each with a
--    place. The video and cover must be the poster's own uploads (like
--    photos, 20261014030000).
-- 4. Points: video posts earn the video reward (25), once per post.
-- 5. Visits: posting a review video from the place counts a visit.
-- ============================================================================

-- 1. Types ----------------------------------------------------------------------
ALTER TABLE public.food_cards DROP CONSTRAINT IF EXISTS food_cards_card_type_check;
ALTER TABLE public.food_cards ADD CONSTRAINT food_cards_card_type_check CHECK (card_type IN (
  'RECIPE', 'HOME_COOKING', 'DESSERT', 'DRINK',
  'RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD',
  'BITE_VIDEO',
  'FOOD_REVIEW', 'FOOD_EXPLORATION', 'FOOD_RECOMMENDATION', 'FOOD_COLLECTION',
  'VIBE_PHOTO', 'FOOD_PHOTO', 'RESTAURANT_PHOTO',
  'RECIPE_VIDEO', 'REVIEW_VIDEO', 'TOUR_VIDEO'
));

-- 2. Fields ---------------------------------------------------------------------
ALTER TABLE public.food_cards
  ADD COLUMN IF NOT EXISTS video_duration NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS video_width INT,
  ADD COLUMN IF NOT EXISTS video_height INT,
  -- Food tour stops: [{ name, address, lat, lng, placeId, restaurantId, communityPlaceId, dish }]
  ADD COLUMN IF NOT EXISTS stops JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_platform TEXT,
  ADD COLUMN IF NOT EXISTS source_author TEXT;

ALTER TABLE public.food_cards DROP CONSTRAINT IF EXISTS food_cards_video_fields_check;
ALTER TABLE public.food_cards ADD CONSTRAINT food_cards_video_fields_check CHECK (
  (video_duration IS NULL OR (video_duration > 0 AND video_duration <= 61))
  AND (video_width IS NULL OR video_width BETWEEN 1 AND 8192)
  AND (video_height IS NULL OR video_height BETWEEN 1 AND 8192)
  AND jsonb_typeof(stops) = 'array' AND jsonb_array_length(stops) <= 10 AND pg_column_size(stops) <= 12000
  AND (source_url IS NULL OR (source_url ~* '^https://[^\s]+$' AND char_length(source_url) <= 600))
  AND (source_platform IS NULL OR source_platform IN ('instagram', 'tiktok', 'facebook', 'pinterest', 'youtube', 'web'))
  AND (source_author IS NULL OR char_length(source_author) <= 120)
);

-- 3. Rules ----------------------------------------------------------------------
-- Published video posts: a video (or an import's link) with its length, and the type's must-haves.
ALTER TABLE public.food_cards DROP CONSTRAINT IF EXISTS food_cards_video_post_check;
ALTER TABLE public.food_cards ADD CONSTRAINT food_cards_video_post_check CHECK (
  status <> 'PUBLISHED'
  OR card_type NOT IN ('RECIPE_VIDEO', 'REVIEW_VIDEO', 'TOUR_VIDEO')
  OR (
    (media_url IS NOT NULL OR source_url IS NOT NULL)
    AND (media_url IS NULL OR (video_duration IS NOT NULL AND image_url IS NOT NULL))
    AND (card_type <> 'REVIEW_VIDEO' OR (lat IS NOT NULL AND lng IS NOT NULL))
    AND (card_type <> 'TOUR_VIDEO' OR jsonb_array_length(stops) >= 2)
  )
);

-- Own uploads only; tour stops are well-formed.
CREATE OR REPLACE FUNCTION public.food_cards_check_video_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_base TEXT := '^https://[^/?#\s]+/storage/v1/object/public/food-card-media/' || NEW.user_id::text || '/';
  v_stop JSONB;
BEGIN
  IF NEW.card_type NOT IN ('RECIPE_VIDEO', 'REVIEW_VIDEO', 'TOUR_VIDEO') THEN
    RETURN NEW;
  END IF;

  -- The video: the poster's own upload (or unchanged).
  IF NEW.media_url IS NOT NULL
     AND NOT (TG_OP = 'UPDATE' AND NEW.media_url IS NOT DISTINCT FROM OLD.media_url)
     AND NEW.media_url !~ (v_base || 'video-[0-9a-f-]{36}[.](mp4|webm|mov)$') THEN
    RAISE EXCEPTION 'The video must be uploaded with the post.' USING ERRCODE = '22023';
  END IF;
  -- The cover: the poster's own upload (or unchanged).
  IF NEW.image_url IS NOT NULL
     AND NOT (TG_OP = 'UPDATE' AND NEW.image_url IS NOT DISTINCT FROM OLD.image_url)
     AND NEW.image_url !~ (v_base || '[A-Za-z0-9._-]+$') THEN
    RAISE EXCEPTION 'The cover must be uploaded with the post.' USING ERRCODE = '22023';
  END IF;
  -- Video posts carry their picture as the cover, not a photo list.
  IF jsonb_array_length(coalesce(NEW.photos, '[]'::jsonb)) > 0 THEN
    RAISE EXCEPTION 'Video posts have a cover, not photos.' USING ERRCODE = '22023';
  END IF;

  -- Tour stops: each is an object with a name (<= 200) and a valid position.
  FOR v_stop IN SELECT jsonb_array_elements(coalesce(NEW.stops, '[]'::jsonb)) LOOP
    IF jsonb_typeof(v_stop) IS DISTINCT FROM 'object'
       -- (IS DISTINCT FROM: a missing position must fail, not slip through as NULL)
       OR jsonb_typeof(v_stop->'lat') IS DISTINCT FROM 'number' OR jsonb_typeof(v_stop->'lng') IS DISTINCT FROM 'number'
       OR abs((v_stop->>'lat')::float8) > 90 OR abs((v_stop->>'lng')::float8) > 180
       OR char_length(coalesce(v_stop->>'name', '')) > 200
       OR char_length(coalesce(v_stop->>'dish', '')) > 120 THEN
      RAISE EXCEPTION 'Each stop needs a place on the map.' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF NEW.card_type <> 'TOUR_VIDEO' AND jsonb_array_length(coalesce(NEW.stops, '[]'::jsonb)) > 0 THEN
    RAISE EXCEPTION 'Only food tours have stops.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.food_cards_check_video_post() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS food_cards_check_video_post ON public.food_cards;
CREATE TRIGGER food_cards_check_video_post
  BEFORE INSERT OR UPDATE OF media_url, image_url, photos, stops, card_type ON public.food_cards
  FOR EACH ROW EXECUTE FUNCTION public.food_cards_check_video_post();

CREATE INDEX IF NOT EXISTS food_cards_video_feed_idx ON public.food_cards (created_at DESC)
  WHERE status = 'PUBLISHED' AND card_type IN ('RECIPE_VIDEO', 'REVIEW_VIDEO', 'TOUR_VIDEO', 'BITE_VIDEO');

-- 4. Points (award_points from 20261014000000, with the video post types) -------
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

-- 5. Visits (record_post_visit from 20261014030000, plus review videos) ---------
CREATE OR REPLACE FUNCTION public.record_post_visit(p_card_id UUID, p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  c RECORD;
  v_place_lat DOUBLE PRECISION;
  v_place_lng DOUBLE PRECISION;
  v_counted BOOLEAN := false;
  v_rows INT;
BEGIN
  IF v_uid IS NULL OR p_lat IS NULL OR p_lng IS NULL OR abs(p_lat) > 90 OR abs(p_lng) > 180 THEN
    RETURN false;
  END IF;

  SELECT id, user_id, status, card_type, is_home, lat, lng, restaurant_id, place_id, community_place_id
    INTO c FROM public.food_cards WHERE id = p_card_id;
  IF NOT FOUND OR c.user_id <> v_uid OR c.status <> 'PUBLISHED' OR c.is_home
     OR c.card_type NOT IN ('VIBE_PHOTO', 'FOOD_PHOTO', 'RESTAURANT_PHOTO', 'REVIEW_VIDEO')
     OR c.lat IS NULL OR c.lng IS NULL
     OR (c.restaurant_id IS NULL AND c.place_id IS NULL AND c.community_place_id IS NULL) THEN
    RETURN false;
  END IF;

  -- At most 20 posts a day count visits (already-counted posts don't add up).
  IF (SELECT count(DISTINCT pv.card_id) FROM public.place_visits pv
       WHERE pv.user_id = v_uid AND pv.visited_on = CURRENT_DATE AND pv.card_id IS DISTINCT FROM c.id) >= 20 THEN
    RETURN false;
  END IF;

  -- Where the place is: its own pin when FUZO knows one (the restaurant, the
  -- verified restaurant at that Google place, or the community place), so a
  -- post can't move the place to wherever the poster stands.
  IF c.restaurant_id IS NOT NULL THEN
    SELECT rp.lat, rp.lng INTO v_place_lat, v_place_lng FROM public.restaurant_profiles rp WHERE rp.user_id = c.restaurant_id;
  ELSIF c.community_place_id IS NOT NULL THEN
    SELECT cp.lat, cp.lng INTO v_place_lat, v_place_lng FROM public.community_places cp WHERE cp.id = c.community_place_id AND cp.status <> 'removed';
    IF NOT FOUND THEN
      RETURN false;
    END IF;
  ELSIF c.place_id IS NOT NULL THEN
    SELECT rp.lat, rp.lng INTO v_place_lat, v_place_lng FROM public.restaurant_profiles rp
      WHERE rp.place_id = c.place_id AND rp.place_verified AND rp.lat IS NOT NULL LIMIT 1;
  END IF;
  v_place_lat := COALESCE(v_place_lat, c.lat);
  v_place_lng := COALESCE(v_place_lng, c.lng);

  IF public.meters_between(p_lat, p_lng, v_place_lat, v_place_lng) > 150 THEN
    RETURN false;
  END IF;

  IF c.restaurant_id IS NOT NULL THEN
    INSERT INTO public.place_visits (user_id, place_key, card_id) VALUES (v_uid, c.restaurant_id::text, c.id) ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_counted := v_counted OR v_rows > 0;
  END IF;
  IF c.place_id IS NOT NULL THEN
    INSERT INTO public.place_visits (user_id, place_key, card_id) VALUES (v_uid, 'g:' || c.place_id, c.id) ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_counted := v_counted OR v_rows > 0;
  END IF;
  IF c.community_place_id IS NOT NULL THEN
    INSERT INTO public.place_visits (user_id, place_key, card_id) VALUES (v_uid, 'c:' || c.community_place_id, c.id) ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_counted := v_counted OR v_rows > 0;
  END IF;
  RETURN v_counted;
END;
$$;
REVOKE ALL ON FUNCTION public.record_post_visit(UUID, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_post_visit(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
