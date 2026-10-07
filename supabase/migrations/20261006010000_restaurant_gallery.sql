-- Restaurant photo gallery (client, 2026-10-06).
-- The owner uploads photos in the Dashboard tab; they show in the profile's
-- Gallery tab and the Scout map pop-up's Photos tab. Each entry:
--   { "url": text, "category": "Food" | "Ambience" | "Interior" | "Bar", "caption"?: text }
-- Up to 40 photos.

ALTER TABLE public.restaurant_profiles
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(gallery) = 'array' AND jsonb_array_length(gallery) <= 40);
