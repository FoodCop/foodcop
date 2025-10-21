-- Migration: Add Cuisine Dislikes for Better Personalization
-- Date: October 18, 2025
-- Purpose: Allow users to specify cuisines they want to avoid, improving feed quality

-- =====================================================
-- 1. Add cuisine_dislikes Column to Users Table
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cuisine_dislikes JSONB DEFAULT '[]'::jsonb;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_cuisine_dislikes 
ON users USING GIN(cuisine_dislikes);

COMMENT ON COLUMN users.cuisine_dislikes IS 'Array of cuisine types user wants to avoid (e.g., ["Seafood", "Fast Food"]). Used for negative scoring in feed.';

-- =====================================================
-- 2. Update get_personalized_feed Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_user_lat NUMERIC DEFAULT NULL,
  p_user_lng NUMERIC DEFAULT NULL,
  p_max_distance_km INTEGER DEFAULT 500
)
RETURNS TABLE(
  post_id UUID,
  master_bot_id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  restaurant_id TEXT,
  restaurant_name TEXT,
  restaurant_location TEXT,
  restaurant_rating NUMERIC,
  restaurant_price_range TEXT,
  restaurant_cuisine TEXT,
  tags TEXT[],
  content_type TEXT,
  personality_trait TEXT,
  engagement_likes INTEGER,
  engagement_comments INTEGER,
  engagement_shares INTEGER,
  created_at TIMESTAMPTZ,
  bot_username VARCHAR,
  bot_display_name VARCHAR,
  bot_avatar_url TEXT,
  distance_km NUMERIC,
  relevance_score NUMERIC
) AS $$
DECLARE
  v_cuisine_prefs JSONB;
  v_dietary_prefs JSONB;
  v_cuisine_dislikes JSONB;  -- NEW
  v_price_pref INTEGER;
BEGIN
  -- Fetch user preferences once (including new dislikes)
  SELECT 
    COALESCE(cuisine_preferences, '[]'::jsonb),
    COALESCE(dietary_preferences, '[]'::jsonb),
    COALESCE(cuisine_dislikes, '[]'::jsonb),  -- NEW
    COALESCE(price_range_preference, 2)
  INTO v_cuisine_prefs, v_dietary_prefs, v_cuisine_dislikes, v_price_pref
  FROM users
  WHERE users.id = p_user_id;
  
  RETURN QUERY
  SELECT 
    mbp.id as post_id,
    mbp.master_bot_id,
    mbp.title,
    mbp.content,
    mbp.image_url,
    mbp.restaurant_id,
    mbp.restaurant_name,
    mbp.restaurant_location,
    mbp.restaurant_rating,
    mbp.restaurant_price_range,
    mbp.restaurant_cuisine,
    mbp.tags,
    mbp.content_type,
    mbp.personality_trait,
    mbp.engagement_likes,
    mbp.engagement_comments,
    mbp.engagement_shares,
    mbp.created_at,
    u.username as bot_username,
    u.display_name as bot_display_name,
    u.avatar_url as bot_avatar_url,
    -- Calculate distance
    CASE 
      WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL 
           AND mbp.latitude IS NOT NULL AND mbp.longitude IS NOT NULL
      THEN calculate_distance_km(p_user_lat, p_user_lng, mbp.latitude, mbp.longitude)
      ELSE NULL
    END::NUMERIC as distance_km,
    -- Calculate relevance score (UPDATED with cuisine dislikes penalty)
    (
      100.0  -- Base score
      
      -- POSITIVE FACTORS
      + CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_cuisine_prefs) AS pref
          WHERE LOWER(mbp.restaurant_cuisine) LIKE '%' || LOWER(pref) || '%'
        ) THEN 40.0 ELSE 0.0 END  -- Cuisine preference match
        
      + CASE WHEN mbp.restaurant_price_range IS NOT NULL 
             AND LENGTH(mbp.restaurant_price_range) = v_price_pref 
        THEN 20.0 ELSE 0.0 END  -- Price match
        
      + CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_dietary_prefs) AS diet_pref
          WHERE LOWER(diet_pref) = ANY(SELECT LOWER(unnest(mbp.tags)))
        ) THEN 30.0 ELSE 0.0 END  -- Dietary preference match
        
      + (COALESCE(mbp.restaurant_rating, 0) * 2.0)  -- Rating bonus
      
      + CASE WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL 
             AND mbp.latitude IS NOT NULL AND mbp.longitude IS NOT NULL
        THEN GREATEST(0, 20.0 - (
          calculate_distance_km(p_user_lat, p_user_lng, mbp.latitude, mbp.longitude) / p_max_distance_km * 20.0
        )) ELSE 10.0 END  -- Distance bonus
        
      + CASE WHEN mbp.created_at > NOW() - INTERVAL '7 days' THEN 5.0
             WHEN mbp.created_at > NOW() - INTERVAL '30 days' THEN 3.0
             ELSE 1.0 END  -- Recency bonus
             
      + (LOG(1 + COALESCE(mbp.engagement_likes, 0)) * 2.0)  -- Engagement bonus
      
      -- NEGATIVE FACTORS (NEW!)
      - CASE WHEN EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_cuisine_dislikes) AS dislike
          WHERE LOWER(mbp.restaurant_cuisine) LIKE '%' || LOWER(dislike) || '%'
        ) THEN 60.0 ELSE 0.0 END  -- Cuisine dislike penalty (heavy penalty to push to bottom)
        
    )::NUMERIC as relevance_score
  FROM master_bot_posts mbp
  INNER JOIN users u ON u.id = mbp.master_bot_id
  WHERE mbp.is_published = true
    AND mbp.id NOT IN (
      SELECT restaurant_card_id FROM user_swipe_history WHERE user_swipe_history.user_id = p_user_id
    )
    AND (
      p_user_lat IS NULL OR p_user_lng IS NULL OR mbp.latitude IS NULL OR mbp.longitude IS NULL
      OR calculate_distance_km(p_user_lat, p_user_lng, mbp.latitude, mbp.longitude) <= p_max_distance_km
    )
  ORDER BY relevance_score DESC, mbp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_personalized_feed IS 'Returns personalized restaurant feed with relevance scoring. Now includes cuisine dislike penalty (-60 points) to push unwanted cuisines to bottom of feed.';

-- =====================================================
-- 3. Sample Data / Testing
-- =====================================================

-- Example: Set cuisine dislikes for test user
-- UPDATE users 
-- SET cuisine_dislikes = '["Seafood", "Fast Food", "Fish"]'::jsonb
-- WHERE email = 'fuzo.foodcop@gmail.com';

-- Test query to verify dislike penalty works:
-- SELECT 
--   restaurant_name,
--   restaurant_cuisine,
--   relevance_score
-- FROM get_personalized_feed(
--   '0bb7272a-953d-4ce6-b1ae-3fd51e2ba7a9'::UUID,
--   20,
--   0,
--   13.0853,
--   80.2239,
--   5000
-- )
-- ORDER BY relevance_score DESC;
-- 
-- Expected: Seafood restaurants should have ~60 points lower score

-- =====================================================
-- 4. Migration Complete
-- =====================================================

-- Rollback instructions (if needed):
-- ALTER TABLE users DROP COLUMN IF EXISTS cuisine_dislikes;
-- DROP INDEX IF EXISTS idx_users_cuisine_dislikes;
-- Then restore previous version of get_personalized_feed function
