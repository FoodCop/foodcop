-- ==========================================
-- App-level users, taste profiles, and stats
-- ==========================================
-- schema.sql / the initial migration only ever created public.profiles,
-- but the app (login, auth callback, onboarding, chatService) was written
-- against public.users, public.taste_profiles, and public.user_stats -
-- none of which existed, so registration and onboarding writes were
-- silently failing against the real (local Docker) Supabase instance.
-- This migration adds the tables the app already expects. public.profiles
-- is left in place (recipes/user_interactions still reference it) even
-- though nothing in src/ queries it anymore.

-- 1. USERS TABLE (app-level profile row, keyed 1:1 to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  phone TEXT,
  profile_type TEXT CHECK (profile_type IN ('foodlover', 'creator', 'business')),
  profile_subtype TEXT,
  is_onboarded BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ,
  is_master_bot BOOLEAN NOT NULL DEFAULT false,
  points_total INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TASTE PROFILES TABLE (Path A - Discover Food onboarding result)
CREATE TABLE IF NOT EXISTS public.taste_profiles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  cuisines TEXT[] DEFAULT '{}',
  dietary TEXT[] DEFAULT '{}',
  result_emoji TEXT,
  result_title TEXT,
  result_desc TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER STATS TABLE (seeded at onboarding finish; rewards/gamification
-- columns to be added when that feature is wired to real data)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend the auth.users insert trigger to also seed public.users, so every
-- sign-up path (email/password, OAuth callback, anonymous guest) reliably
-- gets a row - the guest sign-in path in particular never calls the
-- client-side upsert in login/page.tsx.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users: readable by everyone (chatService lists other users as contacts),
-- writable only by the row's own owner.
CREATE POLICY "Users are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own row." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own row." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Taste profiles / user stats: owner-only, nothing else reads these cross-user yet.
CREATE POLICY "Users can view own taste profile." ON public.taste_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own taste profile." ON public.taste_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own taste profile." ON public.taste_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats." ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats." ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats." ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.taste_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_stats TO anon, authenticated, service_role;
