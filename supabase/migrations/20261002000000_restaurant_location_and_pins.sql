-- A) Restaurants get their own map location, so Scout can show every FUZO
--    restaurant in view (even ones that aren't on Google).
-- B) Community pins (fuzo_locations) remember the Google place they were
--    dropped on, so a pin at a FUZO restaurant can link to its profile.

-- ------------------------------------------------------------------
-- A. restaurant_profiles.lat / lng
-- ------------------------------------------------------------------
ALTER TABLE public.restaurant_profiles
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180);

CREATE INDEX IF NOT EXISTS restaurant_profiles_geo_idx
  ON public.restaurant_profiles (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ------------------------------------------------------------------
-- B. fuzo_locations.place_id (+ backfill from the matching food card)
-- ------------------------------------------------------------------
ALTER TABLE public.fuzo_locations ADD COLUMN IF NOT EXISTS place_id TEXT;
CREATE INDEX IF NOT EXISTS fuzo_locations_place_idx ON public.fuzo_locations (place_id) WHERE place_id IS NOT NULL;

-- Restaurant-family food cards dual-write a fuzo_locations row with the same
-- user and coordinates; copy the card's place_id across where they match.
UPDATE public.fuzo_locations AS f
SET place_id = fc.place_id
FROM public.food_cards AS fc
WHERE f.place_id IS NULL
  AND fc.place_id IS NOT NULL
  AND fc.user_id = f.user_id
  AND fc.lat IS NOT NULL AND fc.lng IS NOT NULL
  AND abs(fc.lat - f.latitude) < 0.000001
  AND abs(fc.lng - f.longitude) < 0.000001;
