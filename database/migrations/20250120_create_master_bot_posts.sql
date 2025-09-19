-- Create master_bot_posts table
CREATE TABLE IF NOT EXISTS master_bot_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_bot_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  image_storage_path TEXT,
  restaurant_id TEXT,
  restaurant_name TEXT,
  restaurant_location TEXT,
  restaurant_rating DECIMAL(3,2),
  restaurant_price_range TEXT,
  restaurant_cuisine TEXT,
  tags TEXT[] DEFAULT '{}',
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  personality_trait TEXT,
  content_type TEXT, -- 'review', 'story', 'tip', 'travel', 'philosophy'
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_bot_id ON master_bot_posts(master_bot_id);
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_created_at ON master_bot_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_published ON master_bot_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_content_type ON master_bot_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_tags ON master_bot_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_engagement ON master_bot_posts(engagement_likes + engagement_comments + engagement_shares DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_master_bot_posts_updated_at
    BEFORE UPDATE ON master_bot_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE master_bot_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access to published posts
CREATE POLICY "Allow public read access to published posts" ON master_bot_posts
    FOR SELECT USING (is_published = true);

-- Allow master bots to manage their own posts
CREATE POLICY "Allow master bots to manage their own posts" ON master_bot_posts
    FOR ALL USING (
        master_bot_id IN (
            SELECT id FROM users
            WHERE is_master_bot = true
            AND id = auth.uid()
        )
    );

-- Allow authenticated users to read all posts (for admin purposes)
CREATE POLICY "Allow authenticated users to read all posts" ON master_bot_posts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create a view for public posts with engagement metrics
CREATE OR REPLACE VIEW public_master_bot_posts AS
SELECT
    p.id,
    p.master_bot_id,
    u.username as bot_username,
    u.display_name as bot_display_name,
    u.avatar_url as bot_avatar_url,
    p.title,
    p.content,
    p.image_url,
    p.restaurant_name,
    p.restaurant_location,
    p.restaurant_rating,
    p.restaurant_price_range,
    p.restaurant_cuisine,
    p.tags,
    p.engagement_likes,
    p.engagement_comments,
    p.engagement_shares,
    (p.engagement_likes + p.engagement_comments + p.engagement_shares) as total_engagement,
    p.personality_trait,
    p.content_type,
    p.created_at,
    p.updated_at
FROM master_bot_posts p
JOIN users u ON p.master_bot_id = u.id
WHERE p.is_published = true
ORDER BY p.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public_master_bot_posts TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE master_bot_posts IS 'Stores posts created by master bots for the content feed';
COMMENT ON COLUMN master_bot_posts.content_type IS 'Type of content: review, story, tip, travel, philosophy';
COMMENT ON COLUMN master_bot_posts.personality_trait IS 'The personality trait that influenced this post';
COMMENT ON COLUMN master_bot_posts.image_storage_path IS 'Path to image in Supabase Storage';
COMMENT ON COLUMN master_bot_posts.restaurant_id IS 'External restaurant ID from the dataset';
