-- Social profiles: also allow YouTube and X handles (stored as bare handles,
-- like the others - the app builds the URLs, see socialLinksService.ts).

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_social_links_shape;
ALTER TABLE public.users
  ADD CONSTRAINT users_social_links_shape CHECK (
    jsonb_typeof(social_links) = 'object'
    AND social_links - ARRAY['instagram', 'facebook', 'tiktok', 'pinterest', 'youtube', 'x'] = '{}'::jsonb
    AND pg_column_size(social_links) < 2048
  );
