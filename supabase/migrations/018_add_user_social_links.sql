-- Migration 018: Add editable profile + social link fields on users
-- Supports in-app Settings editing and Profile social link rendering.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT;

COMMENT ON COLUMN public.users.bio IS 'User biography shown on profile page.';
COMMENT ON COLUMN public.users.phone IS 'User contact phone set in settings.';
COMMENT ON COLUMN public.users.location IS 'User location string set in settings.';
COMMENT ON COLUMN public.users.instagram_url IS 'External Instagram profile URL or handle.';
COMMENT ON COLUMN public.users.facebook_url IS 'External Facebook profile URL or handle.';
COMMENT ON COLUMN public.users.tiktok_url IS 'External TikTok profile URL or handle.';
COMMENT ON COLUMN public.users.pinterest_url IS 'External Pinterest profile URL or handle.';
