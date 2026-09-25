-- Social profiles shown on the back of the Profile hero card (mobile flip).
-- Stored as handles, not URLs: { "instagram": "name", "facebook": "name",
-- "tiktok": "name", "pinterest": "name" }. The app builds the profile URLs
-- itself, so a stored value can never point somewhere arbitrary.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_social_links_shape;
ALTER TABLE public.users
  ADD CONSTRAINT users_social_links_shape CHECK (
    jsonb_typeof(social_links) = 'object'
    AND social_links - ARRAY['instagram', 'facebook', 'tiktok', 'pinterest'] = '{}'::jsonb
    AND pg_column_size(social_links) < 2048
  );

-- 20260919010000_privacy_hardening.sql granted users' columns one by one, so a
-- column added later is NOT readable/writable until granted. Public like bio:
-- anyone who can see the profile can see the links; only the owner edits them
-- (the existing users UPDATE policy already limits rows to auth.uid()).
GRANT SELECT (social_links) ON public.users TO anon, authenticated;
GRANT INSERT (social_links), UPDATE (social_links) ON public.users TO authenticated;
