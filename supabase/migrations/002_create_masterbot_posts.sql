-- Create masterbot_posts table
-- Social feed content from the FUZO AI bot and community

CREATE TABLE IF NOT EXISTS public.masterbot_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_type TEXT NOT NULL DEFAULT 'masterbot' CHECK (author_type IN ('masterbot', 'user', 'system')),
  
  -- Content
  title TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'recommendation' CHECK (content_type IN ('recommendation', 'tip', 'trend', 'recipe', 'restaurant', 'announcement')),
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  restaurant_data JSONB,
  recipe_data JSONB,
  
  -- Engagement
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  
  -- Visibility
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tags and categorization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  cuisine_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_masterbot_posts_published ON public.masterbot_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_masterbot_posts_author ON public.masterbot_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_masterbot_posts_content_type ON public.masterbot_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_masterbot_posts_featured ON public.masterbot_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_masterbot_posts_tags ON public.masterbot_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_masterbot_posts_cuisine ON public.masterbot_posts USING GIN(cuisine_types);

-- Enable Row Level Security
ALTER TABLE public.masterbot_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view published posts
CREATE POLICY "Anyone can view published posts"
  ON public.masterbot_posts
  FOR SELECT
  USING (is_published = true);

-- Authors can view their own unpublished posts
CREATE POLICY "Authors can view own posts"
  ON public.masterbot_posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Only authenticated users can create posts (for UGC)
CREATE POLICY "Authenticated users can create posts"
  ON public.masterbot_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id OR author_type = 'masterbot');

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
  ON public.masterbot_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
  ON public.masterbot_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Grant permissions
GRANT SELECT ON public.masterbot_posts TO anon;
GRANT ALL ON public.masterbot_posts TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_masterbot_posts_updated_at
  BEFORE UPDATE ON public.masterbot_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE public.masterbot_posts IS 'Social feed content including AI recommendations, tips, and community posts';

-- Seed initial masterbot posts
INSERT INTO public.masterbot_posts (author_type, title, content, content_type, image_url, tags, is_featured) VALUES
  ('masterbot', '🍕 Welcome to FUZO!', 'Discover amazing restaurants and recipes tailored just for you. Start exploring now!', 'announcement', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', ARRAY['welcome', 'announcement'], true),
  ('masterbot', '🌮 Taco Tuesday Trending', 'The best taco spots in your area are buzzing today! Check out these local favorites.', 'trend', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800', ARRAY['tacos', 'mexican', 'trending'], true),
  ('masterbot', '🍜 Ramen Revolution', 'Authentic ramen bowls that will transport you to Tokyo. Here are our top picks.', 'recommendation', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', ARRAY['ramen', 'japanese', 'soup'], false),
  ('masterbot', '🥗 Healthy Eating Tips', 'Balance is key! Here are 5 tips for enjoying delicious food while staying healthy.', 'tip', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', ARRAY['health', 'tips', 'lifestyle'], false),
  ('masterbot', '🍔 Burger Battle', 'The ultimate burger showdown: Classic vs Gourmet. Which side are you on?', 'trend', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', ARRAY['burgers', 'american', 'debate'], true),
  ('masterbot', '🍕 Perfect Pizza at Home', 'Master the art of homemade pizza with this simple 4-ingredient dough recipe.', 'recipe', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', ARRAY['pizza', 'recipe', 'cooking'], false),
  ('masterbot', '☕ Coffee Culture', 'Exploring the best coffee shops that are more than just caffeine stops.', 'recommendation', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', ARRAY['coffee', 'cafes', 'lifestyle'], false),
  ('masterbot', '🍱 Meal Prep Magic', 'Save time and eat better with these meal prep strategies for busy weeks.', 'tip', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800', ARRAY['meal-prep', 'tips', 'productivity'], false),
  ('masterbot', '🌶️ Spice It Up!', 'Think you can handle the heat? These restaurants serve the spiciest dishes in town.', 'recommendation', 'https://images.unsplash.com/photo-1622493908448-0de34cb09812?w=800', ARRAY['spicy', 'challenge', 'adventure'], false),
  ('masterbot', '🍰 Dessert Dreams', 'Life is short, eat dessert first! Discover the sweetest spots near you.', 'recommendation', 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800', ARRAY['dessert', 'sweets', 'bakery'], true)
ON CONFLICT DO NOTHING;
