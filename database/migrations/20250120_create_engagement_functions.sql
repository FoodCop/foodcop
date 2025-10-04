-- Create function to increment engagement counters
CREATE OR REPLACE FUNCTION increment_engagement(
  post_id UUID,
  engagement_type TEXT
)
RETURNS VOID AS $$
BEGIN
  IF engagement_type = 'likes' THEN
    UPDATE master_bot_posts
    SET engagement_likes = engagement_likes + 1,
        updated_at = NOW()
    WHERE id = post_id;
  ELSIF engagement_type = 'comments' THEN
    UPDATE master_bot_posts
    SET engagement_comments = engagement_comments + 1,
        updated_at = NOW()
    WHERE id = post_id;
  ELSIF engagement_type = 'shares' THEN
    UPDATE master_bot_posts
    SET engagement_shares = engagement_shares + 1,
        updated_at = NOW()
    WHERE id = post_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get post statistics
CREATE OR REPLACE FUNCTION get_post_statistics()
RETURNS TABLE (
  total_posts BIGINT,
  posts_by_bot JSONB,
  posts_by_type JSONB,
  posts_by_trait JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_posts,
    jsonb_object_agg(bot_username, bot_count) as posts_by_bot,
    jsonb_object_agg(content_type, type_count) as posts_by_type,
    jsonb_object_agg(personality_trait, trait_count) as posts_by_trait
  FROM (
    SELECT
      bot_username,
      content_type,
      personality_trait,
      COUNT(*) as bot_count,
      COUNT(*) as type_count,
      COUNT(*) as trait_count
    FROM public_master_bot_posts
    GROUP BY bot_username, content_type, personality_trait
  ) stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to get trending posts
CREATE OR REPLACE FUNCTION get_trending_posts(
  hours_back INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  bot_username TEXT,
  bot_display_name TEXT,
  total_engagement BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.image_url,
    p.bot_username,
    p.bot_display_name,
    (p.engagement_likes + p.engagement_comments + p.engagement_shares) as total_engagement,
    p.created_at
  FROM public_master_bot_posts p
  WHERE p.created_at >= NOW() - INTERVAL '1 hour' * hours_back
  ORDER BY total_engagement DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get posts by location
CREATE OR REPLACE FUNCTION get_posts_by_location(
  location_query TEXT,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  restaurant_name TEXT,
  restaurant_location TEXT,
  restaurant_rating DECIMAL,
  bot_username TEXT,
  bot_display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.image_url,
    p.restaurant_name,
    p.restaurant_location,
    p.restaurant_rating,
    p.bot_username,
    p.bot_display_name,
    p.created_at
  FROM public_master_bot_posts p
  WHERE p.restaurant_location ILIKE '%' || location_query || '%'
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_engagement(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_post_statistics() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_trending_posts(INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_posts_by_location(TEXT, INTEGER) TO anon, authenticated;
