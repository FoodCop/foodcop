-- Restaurant "About" + service options (client, 2026-10-06).
-- Filled by the owner in the profile's Dashboard tab; shown on the restaurant
-- profile (About & Hours) and in the Scout map pop-up (Overview / About), the
-- same way Google's details show for Google places.
--   description - a longer write-up than the one-line tagline
--   services    - which of: dine_in, takeaway, delivery, reservations

ALTER TABLE public.restaurant_profiles
  ADD COLUMN IF NOT EXISTS description TEXT CHECK (char_length(description) <= 1500),
  ADD COLUMN IF NOT EXISTS services TEXT[] NOT NULL DEFAULT '{}'
    CHECK (services <@ ARRAY['dine_in', 'takeaway', 'delivery', 'reservations']::TEXT[]);
