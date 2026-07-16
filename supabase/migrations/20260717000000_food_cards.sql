-- ==========================================
-- Food Cards — unified UGC creation schema
-- ==========================================
-- Backs the new master "Create Card" flow (12 card types across 4 families:
-- Recipe, Restaurant, Video, Discovery). Fixes the gap flagged in
-- card_creation_analysis.md / fuzo-recommendation-engine-solution.md: the old
-- demo flow only wrote flavor_profile + ingredients for RECIPE cards, leaving
-- every other type without the data the Discover feed needs to match on.
-- flavor_profile and tags are now written for every card type.

CREATE TABLE IF NOT EXISTS public.food_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN (
    'RECIPE', 'HOME_COOKING', 'DESSERT', 'DRINK',
    'RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD',
    'BITE_VIDEO',
    'FOOD_REVIEW', 'FOOD_EXPLORATION', 'FOOD_RECOMMENDATION', 'FOOD_COLLECTION'
  )),
  title TEXT NOT NULL DEFAULT 'Untitled',
  caption TEXT,
  tags JSONB NOT NULL DEFAULT '{}'::jsonb,             -- CardTags: cuisine/food_type/meal_type/cooking_style/diet/occasion/season/price_level
  flavor_profile JSONB NOT NULL DEFAULT '{}'::jsonb,    -- FlavorVector, written for ALL types
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Recipe family only
  nutrition JSONB NOT NULL DEFAULT '{}'::jsonb,         -- Recipe family only
  place_id TEXT,                                        -- Restaurant family
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  media_url TEXT,                                       -- Video family
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
  stats JSONB NOT NULL DEFAULT '{"likes": 0, "saves": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS food_cards_user_idx ON public.food_cards (user_id);
CREATE INDEX IF NOT EXISTS food_cards_status_idx ON public.food_cards (status);
CREATE INDEX IF NOT EXISTS food_cards_geo_idx ON public.food_cards (lat, lng) WHERE lat IS NOT NULL;

ALTER TABLE public.food_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published food cards are viewable by everyone." ON public.food_cards
  FOR SELECT USING (status = 'PUBLISHED' OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own food cards." ON public.food_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own food cards." ON public.food_cards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own food cards." ON public.food_cards
  FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE public.food_cards TO anon, authenticated, service_role;


-- ==========================================
-- Defensive: tables already written to by shipped code
-- ==========================================
-- ScoutAddPinModal -> ScoutPersistence, PlateService, IdempotencyService all
-- already insert into these tables, but no migration in this repo creates
-- them. Adding them here (IF NOT EXISTS) so a fresh/local Supabase instance
-- actually has somewhere for those existing writes to land — this is what the
-- new food_cards dual-write (Restaurant family -> fuzo_locations, for Scout
-- map compatibility) depends on. No-op against an environment where these
-- already exist.

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  rating NUMERIC,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fuzo_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_snap_id TEXT,
  source_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  location_name TEXT,
  restaurant_name TEXT,
  cuisine TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  timings JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fuzo_locations_geo_idx ON public.fuzo_locations (latitude, longitude);

CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001',
  result JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (key, user_id, tenant_id)
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuzo_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Posts are viewable by everyone.') THEN
    CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Users can insert their own posts.') THEN
    CREATE POLICY "Users can insert their own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuzo_locations' AND policyname = 'Fuzo locations are viewable by everyone.') THEN
    CREATE POLICY "Fuzo locations are viewable by everyone." ON public.fuzo_locations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuzo_locations' AND policyname = 'Users can insert their own fuzo locations.') THEN
    CREATE POLICY "Users can insert their own fuzo locations." ON public.fuzo_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_items' AND policyname = 'Users can view own saved items.') THEN
    CREATE POLICY "Users can view own saved items." ON public.saved_items FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_items' AND policyname = 'Users can manage own saved items.') THEN
    CREATE POLICY "Users can manage own saved items." ON public.saved_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'idempotency_keys' AND policyname = 'Users can manage own idempotency keys.') THEN
    CREATE POLICY "Users can manage own idempotency keys." ON public.idempotency_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON TABLE public.posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.fuzo_locations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.saved_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.idempotency_keys TO anon, authenticated, service_role;
