-- Restaurant view: business info + working hours, menu management, ratings &
-- reviews, and restaurant posts. "Restaurant" = a users row with
-- profile_type = 'business'. Customer posts that mention a restaurant are NOT
-- a new table - they're existing food_cards whose place_id matches the
-- restaurant's linked Google place (restaurant_profiles.place_id).

-- Helper: is this user a business account?
CREATE OR REPLACE FUNCTION public.is_business(p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = p_user AND profile_type = 'business');
$$;
GRANT EXECUTE ON FUNCTION public.is_business(UUID) TO anon, authenticated;

-- ------------------------------------------------------------------
-- 1. Business info + working hours (the "Restaurant Dashboard" data)
-- ------------------------------------------------------------------
-- hours: { "mon": { "closed": false, "open": "09:00", "close": "22:00" }, ... }
-- A close time earlier than the open time means "past midnight".
CREATE TABLE IF NOT EXISTS public.restaurant_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  place_id TEXT,
  place_name TEXT,
  tagline TEXT CHECK (char_length(tagline) <= 200),
  cuisines TEXT[] NOT NULL DEFAULT '{}',
  price_tier TEXT CHECK (price_tier IN ('$', '$$', '$$$', '$$$$')),
  address TEXT CHECK (char_length(address) <= 300),
  phone TEXT CHECK (char_length(phone) <= 40),
  website TEXT CHECK (char_length(website) <= 300),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  hours JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(hours) = 'object'),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS restaurant_profiles_place_idx ON public.restaurant_profiles (place_id) WHERE place_id IS NOT NULL;

ALTER TABLE public.restaurant_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurant profiles are public" ON public.restaurant_profiles;
CREATE POLICY "Restaurant profiles are public" ON public.restaurant_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners manage their restaurant profile" ON public.restaurant_profiles;
CREATE POLICY "Owners manage their restaurant profile" ON public.restaurant_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.is_business(user_id));

GRANT SELECT ON public.restaurant_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.restaurant_profiles TO authenticated;

-- ------------------------------------------------------------------
-- 2. Menu items
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT CHECK (char_length(description) <= 500),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL DEFAULT 'Mains' CHECK (char_length(category) BETWEEN 1 AND 60),
  is_veg BOOLEAN NOT NULL DEFAULT true,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS menu_items_restaurant_idx ON public.menu_items (restaurant_id, category, position);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Menus are public" ON public.menu_items;
CREATE POLICY "Menus are public" ON public.menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners manage their menu" ON public.menu_items;
CREATE POLICY "Owners manage their menu" ON public.menu_items
  FOR ALL TO authenticated
  USING (auth.uid() = restaurant_id)
  WITH CHECK (auth.uid() = restaurant_id AND public.is_business(restaurant_id));

GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;

-- ------------------------------------------------------------------
-- 3. Ratings & reviews (one per customer per restaurant, editable)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT CHECK (char_length(body) <= 2000),
  photos TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(photos) <= 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, user_id),
  CHECK (restaurant_id <> user_id)
);
CREATE INDEX IF NOT EXISTS restaurant_reviews_restaurant_idx ON public.restaurant_reviews (restaurant_id, created_at DESC);

ALTER TABLE public.restaurant_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public" ON public.restaurant_reviews;
CREATE POLICY "Reviews are public" ON public.restaurant_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Customers write their own review" ON public.restaurant_reviews;
CREATE POLICY "Customers write their own review" ON public.restaurant_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_business(restaurant_id));
DROP POLICY IF EXISTS "Customers edit their own review" ON public.restaurant_reviews;
CREATE POLICY "Customers edit their own review" ON public.restaurant_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Customers delete their own review" ON public.restaurant_reviews;
CREATE POLICY "Customers delete their own review" ON public.restaurant_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT ON public.restaurant_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.restaurant_reviews TO authenticated;

-- Average + count + 1-5 breakdown, always computed from the reviews themselves,
-- so it updates the moment a review is added, edited or removed.
CREATE OR REPLACE VIEW public.restaurant_rating_summary AS
  SELECT
    restaurant_id,
    ROUND(AVG(rating)::numeric, 1) AS average_rating,
    COUNT(*)::int AS review_count,
    COUNT(*) FILTER (WHERE rating = 5)::int AS stars_5,
    COUNT(*) FILTER (WHERE rating = 4)::int AS stars_4,
    COUNT(*) FILTER (WHERE rating = 3)::int AS stars_3,
    COUNT(*) FILTER (WHERE rating = 2)::int AS stars_2,
    COUNT(*) FILTER (WHERE rating = 1)::int AS stars_1
  FROM public.restaurant_reviews
  GROUP BY restaurant_id;
GRANT SELECT ON public.restaurant_rating_summary TO anon, authenticated;

-- ------------------------------------------------------------------
-- 4. Restaurant posts (announcements, launches, offers, events, photos, videos, updates)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('announcement', 'menu_launch', 'offer', 'event', 'photo', 'video', 'update')),
  title TEXT CHECK (char_length(title) <= 120),
  body TEXT CHECK (char_length(body) <= 2000),
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS restaurant_posts_restaurant_idx ON public.restaurant_posts (restaurant_id, created_at DESC);

ALTER TABLE public.restaurant_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurant posts are public" ON public.restaurant_posts;
CREATE POLICY "Restaurant posts are public" ON public.restaurant_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners manage their posts" ON public.restaurant_posts;
CREATE POLICY "Owners manage their posts" ON public.restaurant_posts
  FOR ALL TO authenticated
  USING (auth.uid() = restaurant_id)
  WITH CHECK (auth.uid() = restaurant_id AND public.is_business(restaurant_id));

GRANT SELECT ON public.restaurant_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.restaurant_posts TO authenticated;
