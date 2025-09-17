-- Master Bots Feed Migration
-- Extends existing schema with tables needed for Master Bot feed system
-- Based on MASTERBOT_FEED.md specifications

-- =====================================================
-- 1. RESTAURANTS ENHANCEMENTS (for Google Maps scraper)
-- =====================================================

-- Add columns for Google Maps integration if they don't exist
DO $$ BEGIN
    -- Add place_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='place_id') THEN
        ALTER TABLE restaurants ADD COLUMN place_id TEXT UNIQUE;
    END IF;

    -- Add categories array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='categories') THEN
        ALTER TABLE restaurants ADD COLUMN categories TEXT[];
    END IF;

    -- Add reviews_count if different from review_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='reviews_count') THEN
        ALTER TABLE restaurants ADD COLUMN reviews_count INT DEFAULT 0;
    END IF;

    -- Add lat/lng as separate columns for easier querying
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='lat') THEN
        ALTER TABLE restaurants ADD COLUMN lat DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='lng') THEN
        ALTER TABLE restaurants ADD COLUMN lng DOUBLE PRECISION;
    END IF;

    -- Add google_url for direct links
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='google_url') THEN
        ALTER TABLE restaurants ADD COLUMN google_url TEXT;
    END IF;

    -- Add photo_url for primary image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='photo_url') THEN
        ALTER TABLE restaurants ADD COLUMN photo_url TEXT;
    END IF;

    -- Add source tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='restaurants' AND column_name='source') THEN
        ALTER TABLE restaurants ADD COLUMN source TEXT DEFAULT 'manual';
    END IF;
END $$;

-- =====================================================
-- 2. RECIPES TABLE (from Spoonacular)
-- =====================================================

CREATE TABLE IF NOT EXISTS recipes (
  spoon_id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  cuisines TEXT[],
  diets TEXT[],
  health_score INT,
  image_url TEXT,
  source_url TEXT,
  ready_in_minutes INT,
  servings INT,
  nutrients JSONB,       -- macro/micro snapshot
  source TEXT DEFAULT 'spoonacular',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. PERSONA PROMPTS (Bot AI Configuration)
-- =====================================================

CREATE TABLE IF NOT EXISTS bot_prompts (
  bot_id UUID REFERENCES master_bots(user_id) ON DELETE CASCADE,
  system_prompt TEXT NOT NULL,
  style_guide JSONB,                   -- tone, emoji rules, do/don't
  PRIMARY KEY (bot_id)
);

-- =====================================================
-- 4. TAGS MAP (Content Targeting)
-- =====================================================

CREATE TABLE IF NOT EXISTS tags_map (
  tag TEXT PRIMARY KEY,                -- 'street_food' | 'fine_dining' | ...
  restaurant_keywords TEXT[],          -- ['hawker','street food','food court']
  recipe_filters JSONB                 -- { diets:['vegan'], cuisines:['japanese'] }
);

-- =====================================================
-- 5. ENHANCED POSTS (Master Bot Content)
-- =====================================================

-- Add bot-specific columns to existing posts table
DO $$ BEGIN
    -- Add bot_id reference if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='bot_id') THEN
        ALTER TABLE posts ADD COLUMN bot_id UUID REFERENCES users(id);
    END IF;

    -- Add kind for post type classification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='kind') THEN
        ALTER TABLE posts ADD COLUMN kind TEXT CHECK (kind IN ('restaurant','recipe','tip'));
    END IF;

    -- Add title for post headlines
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='title') THEN
        ALTER TABLE posts ADD COLUMN title TEXT;
    END IF;

    -- Add subtitle for additional context
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='subtitle') THEN
        ALTER TABLE posts ADD COLUMN subtitle TEXT;
    END IF;

    -- Add hero_url for primary image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='hero_url') THEN
        ALTER TABLE posts ADD COLUMN hero_url TEXT;
    END IF;

    -- Add payload for normalized content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='payload') THEN
        ALTER TABLE posts ADD COLUMN payload JSONB;
    END IF;

    -- Add CTA fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='cta_label') THEN
        ALTER TABLE posts ADD COLUMN cta_label TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='cta_url') THEN
        ALTER TABLE posts ADD COLUMN cta_url TEXT;
    END IF;

    -- Add tags array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='tags') THEN
        ALTER TABLE posts ADD COLUMN tags TEXT[];
    END IF;

    -- Add posted_at for scheduling
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='posted_at') THEN
        ALTER TABLE posts ADD COLUMN posted_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add unique constraint for bot post rotation
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='posts_bot_rotation_unique') THEN
        ALTER TABLE posts ADD CONSTRAINT posts_bot_rotation_unique UNIQUE (bot_id, posted_at, title);
    END IF;
END $$;

-- =====================================================
-- 6. BOT HISTORY (Prevent Repeats)
-- =====================================================

CREATE TABLE IF NOT EXISTS bot_history (
  bot_id UUID REFERENCES users(id),
  entity_ref TEXT,                     -- place_id or spoon_id
  entity_kind TEXT CHECK (entity_kind IN ('restaurant','recipe')),
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (bot_id, entity_ref, entity_kind)
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Recipe indexes
CREATE INDEX IF NOT EXISTS idx_recipes_cuisines ON recipes USING GIN(cuisines);
CREATE INDEX IF NOT EXISTS idx_recipes_diets ON recipes USING GIN(diets);
CREATE INDEX IF NOT EXISTS idx_recipes_health_score ON recipes(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- Enhanced posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_bot_id ON posts(bot_id);
CREATE INDEX IF NOT EXISTS idx_posts_kind ON posts(kind);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

-- Bot history indexes
CREATE INDEX IF NOT EXISTS idx_bot_history_bot_id ON bot_history(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_history_posted_at ON bot_history(posted_at DESC);

-- Tags map indexes
CREATE INDEX IF NOT EXISTS idx_tags_map_keywords ON tags_map USING GIN(restaurant_keywords);

-- Restaurant enhancements indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_place_id ON restaurants(place_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_categories ON restaurants USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_restaurants_lat_lng ON restaurants(lat, lng);
CREATE INDEX IF NOT EXISTS idx_restaurants_source ON restaurants(source);

-- =====================================================
-- 8. SEED INITIAL TAGS MAP
-- =====================================================

INSERT INTO tags_map (tag, restaurant_keywords, recipe_filters) VALUES
('street_food', ARRAY['hawker', 'street food', 'food court', 'cart', 'stall', 'market'], '{"diets": [], "cuisines": ["asian", "indian", "mexican", "thai"]}'),
('fine_dining', ARRAY['fine dining', 'michelin', 'tasting menu', 'prix fixe', 'upscale'], '{"diets": [], "cuisines": ["french", "european", "contemporary"]}'),
('vegan', ARRAY['vegan', 'plant-based', 'vegetarian', 'plant based'], '{"diets": ["vegan", "vegetarian"], "cuisines": []}'),
('coffee', ARRAY['coffee', 'cafe', 'espresso', 'latte', 'cappuccino', 'roastery'], '{"diets": [], "cuisines": []}'),
('japanese', ARRAY['sushi', 'ramen', 'japanese', 'izakaya', 'tempura', 'yakitori'], '{"diets": [], "cuisines": ["japanese"]}'),
('spicy', ARRAY['spicy', 'hot', 'chili', 'pepper', 'fire', 'heat'], '{"diets": [], "cuisines": ["indian", "thai", "mexican", "korean"]}'),
('seafood', ARRAY['seafood', 'fish', 'sushi', 'crab', 'lobster', 'oyster', 'shrimp'], '{"diets": [], "cuisines": ["japanese", "mediterranean", "coastal"]}')
ON CONFLICT (tag) DO NOTHING;

-- =====================================================
-- 9. RLS POLICIES FOR FEED
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_history ENABLE ROW LEVEL SECURITY;

-- Public read access for recipes (content discovery)
CREATE POLICY IF NOT EXISTS "Public read recipes" ON recipes FOR SELECT USING (true);

-- Public read access for tags_map (content categorization)
CREATE POLICY IF NOT EXISTS "Public read tags_map" ON tags_map FOR SELECT USING (true);

-- Bot prompts: Service role only
CREATE POLICY IF NOT EXISTS "Service role bot_prompts" ON bot_prompts FOR ALL USING (auth.role() = 'service_role');

-- Bot history: Service role only (prevents gaming)
CREATE POLICY IF NOT EXISTS "Service role bot_history" ON bot_history FOR ALL USING (auth.role() = 'service_role');

-- Update posts policy to include bot content
DROP POLICY IF EXISTS "Users can view posts" ON posts;
CREATE POLICY "Users can view posts and bot content" ON posts FOR SELECT USING (
    visibility = 'public' OR
    user_id = auth.uid() OR
    bot_id IS NOT NULL OR  -- Bot posts are always public
    (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM user_relationships
        WHERE follower_id = auth.uid()
        AND following_id = posts.user_id
        AND status = 'accepted'
    ))
);

-- =====================================================
-- 10. FUNCTIONS FOR FEED OPERATIONS
-- =====================================================

-- Function to get random restaurant for bot (excluding recent history)
CREATE OR REPLACE FUNCTION get_random_restaurant_for_bot(
    p_bot_id UUID,
    p_tags TEXT[] DEFAULT NULL,
    p_days_exclude INT DEFAULT 90
) RETURNS TABLE (
    restaurant_id UUID,
    place_id TEXT,
    name TEXT,
    rating DECIMAL,
    photo_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_posts AS (
        SELECT entity_ref
        FROM bot_history
        WHERE bot_id = p_bot_id
        AND entity_kind = 'restaurant'
        AND posted_at >= NOW() - (p_days_exclude || ' days')::INTERVAL
    ),
    filtered_restaurants AS (
        SELECT r.id, r.place_id, r.name, r.rating, r.photo_url
        FROM restaurants r
        WHERE NOT EXISTS (SELECT 1 FROM recent_posts rp WHERE rp.entity_ref = r.place_id)
        AND (p_tags IS NULL OR r.categories && p_tags)
        AND r.rating IS NOT NULL
        AND r.is_open = true
    )
    SELECT fr.id, fr.place_id, fr.name, fr.rating, fr.photo_url
    FROM filtered_restaurants fr
    ORDER BY fr.rating DESC NULLS LAST, RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get random recipe for bot
CREATE OR REPLACE FUNCTION get_random_recipe_for_bot(
    p_bot_id UUID,
    p_cuisines TEXT[] DEFAULT NULL,
    p_diets TEXT[] DEFAULT NULL,
    p_days_exclude INT DEFAULT 90
) RETURNS TABLE (
    spoon_id BIGINT,
    title TEXT,
    health_score INT,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_posts AS (
        SELECT entity_ref::BIGINT as recipe_id
        FROM bot_history
        WHERE bot_id = p_bot_id
        AND entity_kind = 'recipe'
        AND posted_at >= NOW() - (p_days_exclude || ' days')::INTERVAL
    ),
    filtered_recipes AS (
        SELECT r.spoon_id, r.title, r.health_score, r.image_url
        FROM recipes r
        WHERE NOT EXISTS (SELECT 1 FROM recent_posts rp WHERE rp.recipe_id = r.spoon_id)
        AND (p_cuisines IS NULL OR r.cuisines && p_cuisines)
        AND (p_diets IS NULL OR r.diets && p_diets)
        AND r.health_score IS NOT NULL
    )
    SELECT fr.spoon_id, fr.title, fr.health_score, fr.image_url
    FROM filtered_recipes fr
    ORDER BY fr.health_score DESC NULLS LAST, RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGERS FOR AUTOMATION
-- =====================================================

-- Trigger to update updated_at on recipes
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE MASTER BOTS FEED SCHEMA
-- =====================================================

COMMENT ON TABLE recipes IS 'Recipe content from Spoonacular API for Master Bot recommendations';
COMMENT ON TABLE bot_prompts IS 'AI system prompts and style guides for Master Bot personalities';
COMMENT ON TABLE tags_map IS 'Content tagging system for restaurant and recipe categorization';
COMMENT ON TABLE bot_history IS 'Track Master Bot content history to prevent repeats';

COMMENT ON FUNCTION get_random_restaurant_for_bot IS 'Get random restaurant for bot avoiding recent history';
COMMENT ON FUNCTION get_random_recipe_for_bot IS 'Get random recipe for bot avoiding recent history';









