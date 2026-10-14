-- ============================================================================
-- Restaurant photos and visits (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md, phase 6)
-- ============================================================================
-- 1. Visits: when someone publishes a post about a place (Vibe, Food at a
--    place, Restaurant photo) while their phone says they're within ~150 m of
--    it, that place gets a visit. At most one per person, per place, per day.
--    A place is identified by "place keys": the FUZO restaurant's id, and/or
--    "g:<Google place id>". The count is public; who visited is not.
-- 2. Community gallery: restaurant photo posts show in that restaurant's
--    gallery (read straight from food_cards). The restaurant's owner can hide
--    any of them from their gallery (restaurant_gallery_hidden).
-- ============================================================================

-- 1. Visits ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.place_visits (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  place_key TEXT NOT NULL CHECK (char_length(place_key) BETWEEN 3 AND 300),
  visited_on DATE NOT NULL DEFAULT CURRENT_DATE,
  card_id UUID REFERENCES public.food_cards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, place_key, visited_on)
);
CREATE INDEX IF NOT EXISTS place_visits_place_idx ON public.place_visits (place_key);

ALTER TABLE public.place_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their own visits" ON public.place_visits;
CREATE POLICY "Users see their own visits" ON public.place_visits FOR SELECT USING (auth.uid() = user_id);
-- Written only by record_post_visit() below.
REVOKE ALL ON public.place_visits FROM anon, authenticated;
GRANT SELECT ON public.place_visits TO authenticated;

-- Counts a visit for the caller's own published post, if they're within
-- 150 m of the post's place. Returns true when a new visit was counted.
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
  v_meters DOUBLE PRECISION;
  v_counted BOOLEAN := false;
  v_rows INT;
BEGIN
  IF v_uid IS NULL OR p_lat IS NULL OR p_lng IS NULL OR abs(p_lat) > 90 OR abs(p_lng) > 180 THEN
    RETURN false;
  END IF;

  SELECT id, user_id, status, card_type, is_home, lat, lng, restaurant_id, place_id
    INTO c FROM public.food_cards WHERE id = p_card_id;
  IF NOT FOUND OR c.user_id <> v_uid OR c.status <> 'PUBLISHED' OR c.is_home
     OR c.card_type NOT IN ('VIBE_PHOTO', 'FOOD_PHOTO', 'RESTAURANT_PHOTO')
     OR c.lat IS NULL OR c.lng IS NULL
     OR (c.restaurant_id IS NULL AND c.place_id IS NULL) THEN
    RETURN false;
  END IF;

  -- Where the place is: a FUZO restaurant's own map pin when it has one
  -- (so a post can't move the restaurant to wherever the poster stands),
  -- otherwise the post's place location.
  v_place_lat := c.lat;
  v_place_lng := c.lng;
  IF c.restaurant_id IS NOT NULL THEN
    SELECT COALESCE(rp.lat, c.lat), COALESCE(rp.lng, c.lng) INTO v_place_lat, v_place_lng
      FROM public.restaurant_profiles rp WHERE rp.user_id = c.restaurant_id;
    v_place_lat := COALESCE(v_place_lat, c.lat);
    v_place_lng := COALESCE(v_place_lng, c.lng);
  END IF;

  -- Distance between the user and the place (haversine, metres).
  v_meters := 2 * 6371000 * asin(sqrt(
    power(sin(radians(v_place_lat - p_lat) / 2), 2)
    + cos(radians(p_lat)) * cos(radians(v_place_lat)) * power(sin(radians(v_place_lng - p_lng) / 2), 2)
  ));
  IF v_meters > 150 THEN
    RETURN false;
  END IF;

  IF c.restaurant_id IS NOT NULL THEN
    INSERT INTO public.place_visits (user_id, place_key, card_id) VALUES (v_uid, c.restaurant_id::text, c.id)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_counted := v_counted OR v_rows > 0;
  END IF;
  IF c.place_id IS NOT NULL THEN
    INSERT INTO public.place_visits (user_id, place_key, card_id) VALUES (v_uid, 'g:' || c.place_id, c.id)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_counted := v_counted OR v_rows > 0;
  END IF;
  RETURN v_counted;
END;
$$;
REVOKE ALL ON FUNCTION public.record_post_visit(UUID, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_post_visit(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Visit counts for up to 50 place keys (no names, just numbers). A place
-- with both a FUZO id and a Google id counts each person once per day.
CREATE OR REPLACE FUNCTION public.get_place_visits(p_keys TEXT[])
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM (
    SELECT DISTINCT user_id, visited_on
    FROM public.place_visits
    WHERE place_key = ANY (p_keys[1:50])
  ) v;
$$;
REVOKE ALL ON FUNCTION public.get_place_visits(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_place_visits(TEXT[]) TO anon, authenticated;

-- 2. Community photos the owner hid from their gallery ---------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_gallery_hidden (
  restaurant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.food_cards(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL CHECK (char_length(photo_url) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (restaurant_id, card_id, photo_url)
);

-- True when the card was posted about the caller's own restaurant: linked to
-- it, or at its verified Google place. Definer so the policy below doesn't
-- depend on who can read restaurant_profiles / food_cards.
CREATE OR REPLACE FUNCTION public.card_is_about_my_restaurant(p_card_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.food_cards c
    WHERE c.id = p_card_id
      AND (
        c.restaurant_id = auth.uid()
        OR (c.place_id IS NOT NULL AND c.place_id = (
          SELECT rp.place_id FROM public.restaurant_profiles rp WHERE rp.user_id = auth.uid() AND rp.place_verified
        ))
      )
  );
$$;
REVOKE ALL ON FUNCTION public.card_is_about_my_restaurant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.card_is_about_my_restaurant(UUID) TO authenticated;

ALTER TABLE public.restaurant_gallery_hidden ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hidden gallery photos are public" ON public.restaurant_gallery_hidden;
CREATE POLICY "Hidden gallery photos are public" ON public.restaurant_gallery_hidden FOR SELECT USING (true);
-- Only the restaurant's owner, and only for photos posted about their restaurant
-- (linked to it, or at its verified Google place).
DROP POLICY IF EXISTS "Owners hide photos of their restaurant" ON public.restaurant_gallery_hidden;
CREATE POLICY "Owners hide photos of their restaurant" ON public.restaurant_gallery_hidden
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = restaurant_id AND public.card_is_about_my_restaurant(card_id)
  );
DROP POLICY IF EXISTS "Owners unhide photos of their restaurant" ON public.restaurant_gallery_hidden;
CREATE POLICY "Owners unhide photos of their restaurant" ON public.restaurant_gallery_hidden
  FOR DELETE TO authenticated USING (auth.uid() = restaurant_id);
REVOKE ALL ON public.restaurant_gallery_hidden FROM anon, authenticated;
GRANT SELECT ON public.restaurant_gallery_hidden TO anon, authenticated;
GRANT INSERT, DELETE ON public.restaurant_gallery_hidden TO authenticated;
