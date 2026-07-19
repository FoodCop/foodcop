-- Adds real coordinates behind users.location (currently free text only),
-- so the map-based location picker + "detect my location" button (Group 1
-- item 8) has somewhere to store the pin, not just the reverse-geocoded
-- address string. Mirrors food_cards' lat/lng column naming.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
