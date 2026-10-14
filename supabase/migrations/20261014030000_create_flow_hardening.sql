-- ============================================================================
-- Create flow security review fixes (plan: docs/CREATE_FLOW_PLAN.md, phase 10)
-- ============================================================================
-- 1. Post photos must be the poster's own uploads. Camera posts (Vibe, Food,
--    Restaurant, Recipe) only accept photo URLs in FUZO storage, in the
--    poster's own folder (food-card-media/<their id>/...). Before this, a post
--    could carry any image link (another site, someone else's photo), and
--    restaurant photo posts show up in that restaurant's gallery.
--    Older recipe-studio covers (data: images, or a URL the card already had)
--    still work when such a recipe is edited.
-- 2. Visits: a Google place that a verified FUZO restaurant owns is measured
--    against the restaurant's own pin, and at most 20 posts per person per day
--    can count visits. (The phone's position comes from the app, so visit
--    counts are a soft signal - this limits how far anyone can push them.)
-- ============================================================================

-- 1. Photos ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.food_cards_check_post_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_own TEXT := '^https://[^/?#\s]+/storage/v1/object/public/food-card-media/' || NEW.user_id::text || '/[A-Za-z0-9._-]+$';
  v_old TEXT[] := '{}';
BEGIN
  IF NEW.card_type NOT IN ('VIBE_PHOTO', 'FOOD_PHOTO', 'RESTAURANT_PHOTO', 'RECIPE') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.photos IS NOT DISTINCT FROM OLD.photos AND NEW.image_url IS NOT DISTINCT FROM OLD.image_url AND NEW.card_type = OLD.card_type THEN
      RETURN NEW;
    END IF;
    -- Photos the card already had may stay (older cards).
    SELECT coalesce(array_agg(x), '{}') INTO v_old
      FROM (SELECT jsonb_array_elements_text(coalesce(OLD.photos, '[]'::jsonb)) AS x UNION SELECT OLD.image_url) s
      WHERE x IS NOT NULL;
  END IF;

  FOR v_url IN SELECT jsonb_array_elements_text(coalesce(NEW.photos, '[]'::jsonb)) LOOP
    CONTINUE WHEN v_url ~ v_own;
    CONTINUE WHEN v_url = ANY (v_old);
    CONTINUE WHEN NEW.card_type = 'RECIPE' AND v_url LIKE 'data:image/%';
    RAISE EXCEPTION 'Photos must be uploaded with the post.' USING ERRCODE = '22023';
  END LOOP;

  -- The new photo types: the cover is one of the photos (or none).
  IF NEW.card_type <> 'RECIPE' AND NEW.image_url IS NOT NULL
     AND NOT (to_jsonb(NEW.image_url) <@ coalesce(NEW.photos, '[]'::jsonb))
     AND NOT (NEW.image_url = ANY (v_old)) THEN
    RAISE EXCEPTION 'Photos must be uploaded with the post.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.food_cards_check_post_photos() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS food_cards_check_post_photos ON public.food_cards;
CREATE TRIGGER food_cards_check_post_photos
  BEFORE INSERT OR UPDATE OF photos, image_url, card_type ON public.food_cards
  FOR EACH ROW EXECUTE FUNCTION public.food_cards_check_post_photos();

-- 2. Visits ------------------------------------------------------------------------
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
     OR c.card_type NOT IN ('VIBE_PHOTO', 'FOOD_PHOTO', 'RESTAURANT_PHOTO')
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
