-- ============================================================================
-- Undiscovered restaurants (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md, phase 7)
-- ============================================================================
-- 1. community_places: restaurants FUZO members add from Create -> Restaurant
--    when the place isn't on the map yet. They show on Scout as
--    "Community Added".
-- 2. Duplicate check: a new place is refused when a FUZO restaurant or another
--    community place with a similar name is within ~150 m (the app also checks
--    Google before submitting). At most 5 new places per person per day.
-- 3. Community check: everyone, the creator included, votes once - "Yes, it's
--    real" or "Not real". At 100 votes, 2/3 Yes -> Verified by Community,
--    2/3 Not real -> removed from the map, otherwise it stays Community Added.
-- 4. Posts link to the place (food_cards.community_place_id); posting from
--    there counts a visit like any other place (key 'c:<id>').
-- Every write goes through the SECURITY DEFINER functions below.
-- ============================================================================

-- Helpers ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meters_between(lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- "The Spice Route Cafe!" -> "spiceroutecafe" (letters/digits in any script).
CREATE OR REPLACE FUNCTION public.place_name_key(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(regexp_replace(lower(coalesce(p_name, '')), '^\s*the\s+', ''), '[^[:alnum:]]+', '', 'g');
$$;

-- Same name, or one name contains the other ("Spice Route" / "Spice Route Cafe").
CREATE OR REPLACE FUNCTION public.place_names_match(a TEXT, b TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.place_name_key(a) = '' OR public.place_name_key(b) = '' THEN false
    WHEN public.place_name_key(a) = public.place_name_key(b) THEN true
    WHEN least(char_length(public.place_name_key(a)), char_length(public.place_name_key(b))) >= 4
      THEN position(public.place_name_key(a) IN public.place_name_key(b)) > 0
        OR position(public.place_name_key(b) IN public.place_name_key(a)) > 0
    ELSE false
  END;
$$;

-- 1. Places ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  address TEXT CHECK (char_length(address) <= 300),
  category TEXT NOT NULL,
  business_identity TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(business_identity) <= 12),
  cuisines TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(cuisines) <= 12),
  price_level TEXT CHECK (price_level IN ('$', '$$', '$$$', '$$$$')),
  hours TEXT CHECK (char_length(hours) <= 200),
  phone TEXT CHECK (char_length(phone) <= 40),
  website TEXT CHECK (char_length(website) <= 300),
  status TEXT NOT NULL DEFAULT 'community' CHECK (status IN ('community', 'verified', 'removed')),
  yes_votes INT NOT NULL DEFAULT 0,
  no_votes INT NOT NULL DEFAULT 0,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_places_geo_idx ON public.community_places (lat, lng);
CREATE INDEX IF NOT EXISTS community_places_creator_idx ON public.community_places (created_by, created_at);

ALTER TABLE public.community_places ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Community places are public until removed" ON public.community_places;
CREATE POLICY "Community places are public until removed" ON public.community_places
  FOR SELECT USING (status <> 'removed' OR created_by = auth.uid());
REVOKE ALL ON public.community_places FROM anon, authenticated;
GRANT SELECT ON public.community_places TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_place_votes (
  place_id UUID NOT NULL REFERENCES public.community_places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_real BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (place_id, user_id)
);
ALTER TABLE public.community_place_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their own votes" ON public.community_place_votes;
CREATE POLICY "Users see their own votes" ON public.community_place_votes FOR SELECT USING (auth.uid() = user_id);
REVOKE ALL ON public.community_place_votes FROM anon, authenticated;
GRANT SELECT ON public.community_place_votes TO authenticated;

-- 2. Duplicate check ---------------------------------------------------------------
-- FUZO restaurants and community places with a similar name within 150 m.
CREATE OR REPLACE FUNCTION public.find_place_duplicates(p_name TEXT, p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS TABLE (kind TEXT, id UUID, name TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION, place_id TEXT, meters DOUBLE PRECISION)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH box AS (SELECT p_lat AS la, p_lng AS lo, 0.0015 AS d, 0.0015 / greatest(0.01, cos(radians(p_lat))) AS dl)
  SELECT * FROM (
    SELECT 'restaurant'::text, rp.user_id, coalesce(nullif(u.display_name, ''), rp.place_name), rp.lat, rp.lng,
           CASE WHEN rp.place_verified THEN rp.place_id END,
           public.meters_between(p_lat, p_lng, rp.lat, rp.lng)
    FROM public.restaurant_profiles rp
    JOIN public.users u ON u.id = rp.user_id, box
    WHERE rp.lat BETWEEN box.la - box.d AND box.la + box.d
      AND rp.lng BETWEEN box.lo - box.dl AND box.lo + box.dl
      AND (public.place_names_match(p_name, u.display_name) OR public.place_names_match(p_name, rp.place_name))
    UNION ALL
    SELECT 'community'::text, cp.id, cp.name, cp.lat, cp.lng, NULL::text,
           public.meters_between(p_lat, p_lng, cp.lat, cp.lng)
    FROM public.community_places cp, box
    WHERE cp.status <> 'removed'
      AND cp.lat BETWEEN box.la - box.d AND box.la + box.d
      AND cp.lng BETWEEN box.lo - box.dl AND box.lo + box.dl
      AND public.place_names_match(p_name, cp.name)
  ) found (kind, id, name, lat, lng, place_id, meters)
  WHERE meters <= 150
  ORDER BY meters
  LIMIT 5;
$$;
REVOKE ALL ON FUNCTION public.find_place_duplicates(TEXT, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_place_duplicates(TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Adds a place. Returns {"ok": true, "id": ...} or {"ok": false, "reason": ...,
-- "duplicate": {...}} so the app can send the user to the existing place.
CREATE OR REPLACE FUNCTION public.add_community_place(
  p_name TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_category TEXT,
  p_address TEXT DEFAULT NULL,
  p_business_identity TEXT[] DEFAULT '{}',
  p_cuisines TEXT[] DEFAULT '{}',
  p_price_level TEXT DEFAULT NULL,
  p_hours TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_uid UUID := auth.uid();
  v_name TEXT := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_website TEXT := nullif(btrim(coalesce(p_website, '')), '');
  v_dup RECORD;
  v_id UUID;
  clean_list TEXT[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in.' USING ERRCODE = '42501';
  END IF;
  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'name');
  END IF;
  IF p_lat IS NULL OR p_lng IS NULL OR abs(p_lat) > 90 OR abs(p_lng) > 180 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'location');
  END IF;
  IF p_category IS NULL OR p_category NOT IN ('Restaurant', 'Café', 'Street food', 'Bakery', 'Dessert', 'Bar', 'Food truck', 'Dhaba', 'Other') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'category');
  END IF;
  -- Websites: plain http(s) links or bare domains only (never javascript: etc.).
  IF v_website IS NOT NULL AND v_website !~* '^(https?://)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{1,5})?(/[^\s]*)?$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'website');
  END IF;

  IF (SELECT count(*) FROM public.community_places WHERE created_by = v_uid AND created_at > NOW() - INTERVAL '1 day') >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'limit');
  END IF;

  SELECT * INTO v_dup FROM public.find_place_duplicates(v_name, p_lat, p_lng) LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'duplicate', 'duplicate', jsonb_build_object(
      'kind', v_dup.kind, 'id', v_dup.id, 'name', v_dup.name, 'lat', v_dup.lat, 'lng', v_dup.lng, 'placeId', v_dup.place_id
    ));
  END IF;

  INSERT INTO public.community_places (created_by, name, lat, lng, address, category, business_identity, cuisines, price_level, hours, phone, website)
  VALUES (
    v_uid, v_name, p_lat, p_lng,
    left(nullif(btrim(coalesce(p_address, '')), ''), 300),
    p_category,
    (SELECT coalesce(array_agg(DISTINCT left(btrim(x), 40)), '{}') FROM unnest(coalesce(p_business_identity, '{}')) x WHERE btrim(x) <> '')[1:12],
    (SELECT coalesce(array_agg(DISTINCT left(btrim(x), 30)), '{}') FROM unnest(coalesce(p_cuisines, '{}')) x WHERE btrim(x) <> '')[1:12],
    CASE WHEN p_price_level IN ('$', '$$', '$$$', '$$$$') THEN p_price_level END,
    left(nullif(btrim(coalesce(p_hours, '')), ''), 200),
    left(nullif(btrim(coalesce(p_phone, '')), ''), 40),
    v_website
  )
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$fn$;
REVOKE ALL ON FUNCTION public.add_community_place(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_community_place(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. Voting ------------------------------------------------------------------------
-- One vote per person (can't be changed). Decides at 100 votes.
CREATE OR REPLACE FUNCTION public.vote_community_place(p_place_id UUID, p_is_real BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  p RECORD;
  v_rows INT;
  v_total INT;
  v_status TEXT;
  v_mine BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in.' USING ERRCODE = '42501';
  END IF;
  IF p_is_real IS NULL THEN
    RAISE EXCEPTION 'Missing vote.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO p FROM public.community_places WHERE id = p_place_id FOR UPDATE;
  IF NOT FOUND OR (p.status = 'removed' AND p.created_by <> v_uid) THEN
    RAISE EXCEPTION 'Place not found.' USING ERRCODE = 'P0002';
  END IF;

  -- Voting closes once the community has decided.
  IF p.status = 'community' THEN
    INSERT INTO public.community_place_votes (place_id, user_id, is_real) VALUES (p_place_id, v_uid, p_is_real)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
      UPDATE public.community_places
        SET yes_votes = yes_votes + CASE WHEN p_is_real THEN 1 ELSE 0 END,
            no_votes = no_votes + CASE WHEN p_is_real THEN 0 ELSE 1 END
        WHERE id = p_place_id
        RETURNING * INTO p;
      v_total := p.yes_votes + p.no_votes;
      IF v_total >= 100 THEN
        v_status := CASE
          WHEN p.yes_votes * 3 >= v_total * 2 THEN 'verified'
          WHEN p.no_votes * 3 >= v_total * 2 THEN 'removed'
          ELSE 'community'
        END;
        IF v_status <> 'community' THEN
          UPDATE public.community_places SET status = v_status, decided_at = NOW() WHERE id = p_place_id RETURNING * INTO p;
        END IF;
      END IF;
    END IF;
  END IF;

  SELECT is_real INTO v_mine FROM public.community_place_votes WHERE place_id = p_place_id AND user_id = v_uid;
  RETURN jsonb_build_object('status', p.status, 'yes', p.yes_votes, 'no', p.no_votes, 'myVote', v_mine);
END;
$$;
REVOKE ALL ON FUNCTION public.vote_community_place(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vote_community_place(UUID, BOOLEAN) TO authenticated;

-- 4. Posts link to the place -----------------------------------------------------
ALTER TABLE public.food_cards ADD COLUMN IF NOT EXISTS community_place_id UUID REFERENCES public.community_places(id) ON DELETE SET NULL;
-- A draft's "new restaurant" details, until it's published (then the place is created).
ALTER TABLE public.food_cards ADD COLUMN IF NOT EXISTS new_place JSONB;
ALTER TABLE public.food_cards DROP CONSTRAINT IF EXISTS food_cards_new_place_check;
ALTER TABLE public.food_cards ADD CONSTRAINT food_cards_new_place_check
  CHECK (new_place IS NULL OR (jsonb_typeof(new_place) = 'object' AND pg_column_size(new_place) <= 4000));
CREATE INDEX IF NOT EXISTS food_cards_community_place_idx ON public.food_cards (community_place_id) WHERE community_place_id IS NOT NULL;

-- Visits (from 20261014010000) now also count at community places.
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

  -- Where the place is: its own pin (FUZO restaurant or community place) when
  -- there is one, so a post can't move the place to wherever the poster stands.
  v_place_lat := c.lat;
  v_place_lng := c.lng;
  IF c.restaurant_id IS NOT NULL THEN
    SELECT rp.lat, rp.lng INTO v_place_lat, v_place_lng FROM public.restaurant_profiles rp WHERE rp.user_id = c.restaurant_id;
  ELSIF c.community_place_id IS NOT NULL THEN
    SELECT cp.lat, cp.lng INTO v_place_lat, v_place_lng FROM public.community_places cp WHERE cp.id = c.community_place_id AND cp.status <> 'removed';
    IF NOT FOUND THEN
      RETURN false;
    END IF;
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
