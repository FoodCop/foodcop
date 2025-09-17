-- Master Bot Evolution Plan - Phase 2 Migration
-- Transforms static bot system into dynamic AI-powered content generation
-- From 14 static posts to unlimited daily fresh content

-- =====================================================
-- 1. ENHANCE EXISTING BOT_POSTS TABLE
-- =====================================================

-- Add new columns to bot_posts for recipe support and automation
DO $$ BEGIN
    -- Add kind to support both restaurant and recipe posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_posts' AND column_name='kind') THEN
        ALTER TABLE bot_posts ADD COLUMN kind TEXT DEFAULT 'restaurant' CHECK (kind IN ('restaurant', 'recipe'));
    END IF;

    -- Add recipe_data for storing recipe information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_posts' AND column_name='recipe_data') THEN
        ALTER TABLE bot_posts ADD COLUMN recipe_data JSONB;
    END IF;

    -- Add CTA fields for calls to action
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_posts' AND column_name='cta_label') THEN
        ALTER TABLE bot_posts ADD COLUMN cta_label TEXT DEFAULT 'Open';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_posts' AND column_name='cta_url') THEN
        ALTER TABLE bot_posts ADD COLUMN cta_url TEXT;
    END IF;

    -- Add hero_url for better image management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_posts' AND column_name='hero_url') THEN
        ALTER TABLE bot_posts ADD COLUMN hero_url TEXT;
    END IF;

    -- Add automation tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_posts' AND column_name='is_automated') THEN
        ALTER TABLE bot_posts ADD COLUMN is_automated BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add AI generation metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_posts' AND column_name='ai_metadata') THEN
        ALTER TABLE bot_posts ADD COLUMN ai_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- =====================================================
-- 2. RECIPES TABLE (Spoonacular Integration)
-- =====================================================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spoon_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  source_url TEXT,
  ready_in_minutes INTEGER,
  servings INTEGER,
  health_score INTEGER,
  nutrients JSONB,
  instructions TEXT[],
  ingredients JSONB,
  cuisines TEXT[],
  diets TEXT[],
  dish_types TEXT[],
  occasions TEXT[],
  tags TEXT[],
  
  -- Spoonacular metadata
  very_healthy BOOLEAN DEFAULT FALSE,
  very_popular BOOLEAN DEFAULT FALSE,
  whole30 BOOLEAN DEFAULT FALSE,
  
  -- Our metadata
  is_featured BOOLEAN DEFAULT FALSE,
  quality_score INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TAGS MAP (Bot Specialty to Content Mapping)
-- =====================================================

CREATE TABLE IF NOT EXISTS tags_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag TEXT UNIQUE NOT NULL,
  restaurant_keywords TEXT[],
  recipe_filters JSONB,
  bot_specialties TEXT[],
  priority_score INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. BOT HISTORY (90-Day Rotation Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS bot_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES users(id),
  entity_ref TEXT NOT NULL, -- restaurant place_id or recipe spoon_id
  entity_kind TEXT NOT NULL CHECK (entity_kind IN ('restaurant', 'recipe')),
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicates within rotation period
  UNIQUE(bot_id, entity_ref, entity_kind)
);

-- =====================================================
-- 5. DAILY GENERATION LOG (Track Automation)
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_generation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_date DATE NOT NULL,
  bot_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  posts_generated INTEGER DEFAULT 0,
  restaurant_post_id UUID REFERENCES bot_posts(id),
  recipe_post_id UUID REFERENCES bot_posts(id),
  error_message TEXT,
  execution_time_ms INTEGER,
  ai_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One entry per bot per day
  UNIQUE(generation_date, bot_id)
);

-- =====================================================
-- 6. OPENAI PROMPTS (Bot Personality Templates)
-- =====================================================

CREATE TABLE IF NOT EXISTS openai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID NOT NULL REFERENCES users(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('restaurant', 'recipe', 'general')),
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One active prompt per bot per content type
  UNIQUE(bot_id, content_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Recipes indexes
CREATE INDEX IF NOT EXISTS idx_recipes_spoon_id ON recipes(spoon_id);
CREATE INDEX IF NOT EXISTS idx_recipes_health_score ON recipes(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisines ON recipes USING GIN(cuisines);
CREATE INDEX IF NOT EXISTS idx_recipes_diets ON recipes USING GIN(diets);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_ready_time ON recipes(ready_in_minutes);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- Bot posts enhancement indexes
CREATE INDEX IF NOT EXISTS idx_bot_posts_kind ON bot_posts(kind);
CREATE INDEX IF NOT EXISTS idx_bot_posts_is_automated ON bot_posts(is_automated);
CREATE INDEX IF NOT EXISTS idx_bot_posts_published_at ON bot_posts(published_at DESC);

-- Bot history indexes
CREATE INDEX IF NOT EXISTS idx_bot_history_bot_id ON bot_history(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_history_posted_at ON bot_history(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_history_entity_kind ON bot_history(entity_kind);

-- Tags map indexes
CREATE INDEX IF NOT EXISTS idx_tags_map_keywords ON tags_map USING GIN(restaurant_keywords);
CREATE INDEX IF NOT EXISTS idx_tags_map_specialties ON tags_map USING GIN(bot_specialties);

-- Daily generation log indexes
CREATE INDEX IF NOT EXISTS idx_daily_generation_date ON daily_generation_log(generation_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_generation_bot_id ON daily_generation_log(bot_id);
CREATE INDEX IF NOT EXISTS idx_daily_generation_status ON daily_generation_log(status);

-- OpenAI prompts indexes
CREATE INDEX IF NOT EXISTS idx_openai_prompts_bot_id ON openai_prompts(bot_id);
CREATE INDEX IF NOT EXISTS idx_openai_prompts_content_type ON openai_prompts(content_type);
CREATE INDEX IF NOT EXISTS idx_openai_prompts_active ON openai_prompts(is_active);

-- =====================================================
-- 8. SEED INITIAL TAGS MAP DATA
-- =====================================================

INSERT INTO tags_map (tag, restaurant_keywords, recipe_filters, bot_specialties, priority_score) VALUES
('street_food', 
 ARRAY['hawker', 'street food', 'food court', 'cart', 'stall', 'market', 'food truck'], 
 '{"cuisines": ["asian", "indian", "mexican", "thai"], "diets": [], "maxReadyTime": 30, "minHealthScore": 50}',
 ARRAY['Street Food Explorer'], 
 5),

('fine_dining', 
 ARRAY['fine dining', 'michelin', 'tasting menu', 'prix fixe', 'upscale', 'gourmet'], 
 '{"cuisines": ["french", "european", "contemporary"], "diets": [], "minHealthScore": 70}',
 ARRAY['Fine Dining Expert'], 
 5),

('vegan', 
 ARRAY['vegan', 'plant-based', 'vegetarian', 'plant based', 'veggie'], 
 '{"diets": ["vegan", "vegetarian"], "cuisines": [], "minHealthScore": 80}',
 ARRAY['Vegan Specialist'], 
 5),

('coffee', 
 ARRAY['coffee', 'cafe', 'espresso', 'latte', 'cappuccino', 'roastery', 'coffee shop'], 
 '{"cuisines": [], "diets": [], "includeIngredients": ["coffee", "espresso"]}',
 ARRAY['Coffee Culture Expert'], 
 4),

('japanese', 
 ARRAY['sushi', 'ramen', 'japanese', 'izakaya', 'tempura', 'yakitori', 'udon', 'soba'], 
 '{"cuisines": ["japanese"], "diets": [], "minHealthScore": 65}',
 ARRAY['Japanese Master'], 
 5),

('spicy', 
 ARRAY['spicy', 'hot', 'chili', 'pepper', 'fire', 'heat', 'curry'], 
 '{"cuisines": ["indian", "thai", "mexican", "korean"], "diets": [], "includeIngredients": ["chili", "pepper", "spicy"]}',
 ARRAY['Indian/Asian Expert'], 
 4),

('bbq', 
 ARRAY['bbq', 'barbecue', 'grill', 'smoked', 'brisket', 'ribs'], 
 '{"cuisines": ["american", "southern"], "diets": [], "includeIngredients": ["meat", "beef", "pork"]}',
 ARRAY['Adventure Foodie'], 
 4),

('healthy', 
 ARRAY['healthy', 'organic', 'fresh', 'salad', 'juice', 'smoothie'], 
 '{"diets": ["healthy"], "minHealthScore": 85, "cuisines": []}',
 ARRAY['Vegan Specialist'], 
 3),

('asian', 
 ARRAY['asian', 'chinese', 'thai', 'vietnamese', 'korean', 'dim sum'], 
 '{"cuisines": ["asian", "chinese", "thai", "vietnamese", "korean"], "diets": []}',
 ARRAY['Indian/Asian Expert'], 
 4)

ON CONFLICT (tag) DO UPDATE SET
  restaurant_keywords = EXCLUDED.restaurant_keywords,
  recipe_filters = EXCLUDED.recipe_filters,
  bot_specialties = EXCLUDED.bot_specialties,
  priority_score = EXCLUDED.priority_score;

-- =====================================================
-- 9. ENHANCED RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_prompts ENABLE ROW LEVEL SECURITY;

-- Public read access for recipes (content discovery)
CREATE POLICY IF NOT EXISTS "Public read recipes" ON recipes FOR SELECT USING (true);

-- Public read access for tags_map (content categorization)
CREATE POLICY IF NOT EXISTS "Public read tags_map" ON tags_map FOR SELECT USING (true);

-- Service role only for bot_history (prevent gaming/manipulation)
CREATE POLICY IF NOT EXISTS "Service role bot_history" ON bot_history FOR ALL USING (auth.role() = 'service_role');

-- Service role only for daily_generation_log (automation tracking)
CREATE POLICY IF NOT EXISTS "Service role daily_generation_log" ON daily_generation_log FOR ALL USING (auth.role() = 'service_role');

-- Service role only for openai_prompts (AI configuration)
CREATE POLICY IF NOT EXISTS "Service role openai_prompts" ON openai_prompts FOR ALL USING (auth.role() = 'service_role');

-- Enhanced bot_posts policy to include recipe support
DROP POLICY IF EXISTS "Users can view bot posts" ON bot_posts;
CREATE POLICY "Public read bot posts and recipes" ON bot_posts FOR SELECT USING (
    is_published = true AND (
        kind = 'restaurant' OR 
        kind = 'recipe' OR 
        kind IS NULL  -- Support existing posts
    )
);

-- Service role write access for bot_posts (automation)
CREATE POLICY IF NOT EXISTS "Service role write bot_posts" ON bot_posts FOR INSERT USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Service role update bot_posts" ON bot_posts FOR UPDATE USING (auth.role() = 'service_role');

-- =====================================================
-- 10. FUNCTIONS FOR CONTENT SELECTION
-- =====================================================

-- Function to get available restaurant for bot (excluding 90-day history)
CREATE OR REPLACE FUNCTION get_available_restaurant_for_bot(
    p_bot_id UUID,
    p_tags TEXT[] DEFAULT NULL,
    p_exclude_days INTEGER DEFAULT 90
) RETURNS TABLE (
    place_id TEXT,
    name TEXT,
    rating DECIMAL,
    image_url TEXT,
    restaurant_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_history AS (
        SELECT entity_ref
        FROM bot_history
        WHERE bot_id = p_bot_id
        AND entity_kind = 'restaurant'
        AND posted_at >= NOW() - (p_exclude_days || ' days')::INTERVAL
    ),
    filtered_restaurants AS (
        SELECT bp.restaurant_place_id, bp.restaurant_data
        FROM bot_posts bp
        WHERE bp.restaurant_place_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM recent_history rh WHERE rh.entity_ref = bp.restaurant_place_id)
        AND (p_tags IS NULL OR bp.tags && p_tags)
        AND bp.restaurant_data->>'rating' IS NOT NULL
    )
    SELECT 
        fr.restaurant_place_id,
        fr.restaurant_data->>'name' as name,
        (fr.restaurant_data->>'rating')::DECIMAL as rating,
        fr.restaurant_data->>'image_url' as image_url,
        fr.restaurant_data
    FROM filtered_restaurants fr
    ORDER BY (fr.restaurant_data->>'rating')::DECIMAL DESC NULLS LAST, RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get available recipe for bot (excluding 90-day history)
CREATE OR REPLACE FUNCTION get_available_recipe_for_bot(
    p_bot_id UUID,
    p_cuisines TEXT[] DEFAULT NULL,
    p_diets TEXT[] DEFAULT NULL,
    p_exclude_days INTEGER DEFAULT 90
) RETURNS TABLE (
    spoon_id INTEGER,
    title TEXT,
    health_score INTEGER,
    image_url TEXT,
    recipe_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_history AS (
        SELECT entity_ref::INTEGER as recipe_id
        FROM bot_history
        WHERE bot_id = p_bot_id
        AND entity_kind = 'recipe'
        AND posted_at >= NOW() - (p_exclude_days || ' days')::INTERVAL
    ),
    filtered_recipes AS (
        SELECT r.*
        FROM recipes r
        WHERE NOT EXISTS (SELECT 1 FROM recent_history rh WHERE rh.recipe_id = r.spoon_id)
        AND (p_cuisines IS NULL OR r.cuisines && p_cuisines)
        AND (p_diets IS NULL OR r.diets && p_diets)
        AND r.health_score IS NOT NULL
        AND r.health_score >= 50
    )
    SELECT 
        fr.spoon_id,
        fr.title,
        fr.health_score,
        fr.image_url,
        row_to_json(fr)::JSONB as recipe_data
    FROM filtered_recipes fr
    ORDER BY fr.health_score DESC NULLS LAST, RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to record bot history
CREATE OR REPLACE FUNCTION record_bot_history(
    p_bot_id UUID,
    p_entity_ref TEXT,
    p_entity_kind TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO bot_history (bot_id, entity_ref, entity_kind, posted_at)
    VALUES (p_bot_id, p_entity_ref, p_entity_kind, NOW())
    ON CONFLICT (bot_id, entity_ref, entity_kind) DO UPDATE SET
        posted_at = NOW();
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

-- Trigger to update updated_at on bot_posts
CREATE TRIGGER update_bot_posts_updated_at
    BEFORE UPDATE ON bot_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE recipes IS 'Recipe content from Spoonacular API for Master Bot recommendations with 90-day rotation';
COMMENT ON TABLE tags_map IS 'Content tagging system mapping bot specialties to restaurant keywords and recipe filters';
COMMENT ON TABLE bot_history IS 'Track Master Bot content history to ensure 90-day rotation without repeats';
COMMENT ON TABLE daily_generation_log IS 'Log daily automation execution for monitoring and debugging';
COMMENT ON TABLE openai_prompts IS 'AI prompt templates for generating bot personalities in content';

COMMENT ON FUNCTION get_available_restaurant_for_bot IS 'Get random restaurant for bot avoiding 90-day history';
COMMENT ON FUNCTION get_available_recipe_for_bot IS 'Get random recipe for bot avoiding 90-day history with health score filtering';
COMMENT ON FUNCTION record_bot_history IS 'Record entity usage in bot history for rotation tracking';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration transforms the Master Bot system from static to dynamic:
-- ✅ Enhanced bot_posts table with recipe support
-- ✅ New recipes table for Spoonacular integration  
-- ✅ Tags mapping system for bot specialties
-- ✅ 90-day rotation tracking with bot_history
-- ✅ Daily automation logging and monitoring
-- ✅ OpenAI prompt management for personalities
-- ✅ Robust RLS policies for security
-- ✅ Performance indexes for scale
-- ✅ Helper functions for content selection
-- 
-- Ready for Phase 2B: API Integration and Phase 2C: Automation Engine

