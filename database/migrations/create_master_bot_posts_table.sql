-- Migration: Create master_bot_posts table for CRON job
-- Created: October 14, 2025

CREATE TABLE master_bot_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    master_bot_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Post Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    
    -- Restaurant Information
    restaurant_id TEXT, -- External restaurant ID from Google Places/etc
    restaurant_name VARCHAR(255) NOT NULL,
    restaurant_location TEXT,
    restaurant_rating DECIMAL(3,2),
    restaurant_price_range VARCHAR(50),
    restaurant_cuisine VARCHAR(100),
    
    -- Bot Characteristics
    content_type VARCHAR(50) NOT NULL, -- 'adventure', 'review', 'recommendation', etc.
    personality_trait VARCHAR(100), -- Bot's personality characteristics
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Social Stats
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    
    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_master_bot_posts_bot_id ON master_bot_posts(master_bot_id);
CREATE INDEX idx_master_bot_posts_created_at ON master_bot_posts(created_at DESC);
CREATE INDEX idx_master_bot_posts_restaurant_name ON master_bot_posts(restaurant_name);
CREATE INDEX idx_master_bot_posts_published ON master_bot_posts(is_published, published_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_master_bot_posts_updated_at 
    BEFORE UPDATE ON master_bot_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set published_at when is_published becomes true
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = TRUE AND OLD.is_published = FALSE THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_published_at_trigger
    BEFORE UPDATE ON master_bot_posts
    FOR EACH ROW EXECUTE FUNCTION set_published_at();