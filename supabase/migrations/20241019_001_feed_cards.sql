-- Multi-Stream Feed Cards Table
-- This table stores normalized cards from different content sources

CREATE TABLE IF NOT EXISTS feed_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Card type classification
    card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('RECIPE', 'RESTAURANT_NEARBY', 'VIDEO', 'PHOTO', 'AD')),
    
    -- External content identifier
    content_id VARCHAR(255) NOT NULL,
    
    -- Flexible metadata storage for different card types
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Content source information
    source_api VARCHAR(50), -- 'spoonacular', 'google_places', 'youtube', etc.
    source_url TEXT,
    
    -- Location-based filtering (for restaurants mainly)
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_radius_km INTEGER DEFAULT 50,
    
    -- Content quality and relevance scoring
    relevance_score DECIMAL(3, 2) DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),
    quality_score DECIMAL(3, 2) DEFAULT 0.5 CHECK (quality_score BETWEEN 0 AND 1),
    
    -- Cache and lifecycle management
    cache_expiry TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feed_cards_type ON feed_cards(card_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_feed_cards_location ON feed_cards USING GIST(point(location_lng, location_lat)) WHERE card_type = 'RESTAURANT_NEARBY';
CREATE INDEX IF NOT EXISTS idx_feed_cards_relevance ON feed_cards(relevance_score DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_feed_cards_content_id ON feed_cards(content_id, card_type);
CREATE INDEX IF NOT EXISTS idx_feed_cards_cache_expiry ON feed_cards(cache_expiry) WHERE cache_expiry IS NOT NULL;

-- Unique constraint to prevent duplicate content
CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_cards_unique_content ON feed_cards(card_type, content_id) WHERE is_active = true;

-- Row Level Security
ALTER TABLE feed_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active feed cards (for feed composition)
CREATE POLICY "Anyone can read active feed cards" ON feed_cards
    FOR SELECT USING (is_active = true);

-- Policy: Only service role can insert/update feed cards
CREATE POLICY "Service role can manage feed cards" ON feed_cards
    FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feed_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_feed_cards_updated_at
    BEFORE UPDATE ON feed_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_feed_cards_updated_at();

-- Function to clean up expired cards
CREATE OR REPLACE FUNCTION cleanup_expired_feed_cards()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE feed_cards 
    SET is_active = false 
    WHERE cache_expiry IS NOT NULL 
      AND cache_expiry < now() 
      AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Example metadata structures for different card types:
/*
RECIPE metadata example:
{
  "title": "Spicy Thai Basil Chicken",
  "image": "https://...",
  "cook_time": 30,
  "servings": 4,
  "cuisine": "Thai",
  "difficulty": "Medium",
  "ingredients_count": 12,
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 15,
    "fat": 20
  }
}

RESTAURANT_NEARBY metadata example:
{
  "name": "Joe's Pizza",
  "image": "https://...",
  "rating": 4.5,
  "price_level": 2,
  "cuisine": "Italian",
  "address": "123 Main St",
  "phone": "+1234567890",
  "hours": "11:00 AM - 10:00 PM",
  "distance_km": 1.2
}

VIDEO metadata example:
{
  "title": "How to Make Perfect Pasta",
  "channel": "Chef's Kitchen",
  "thumbnail": "https://...",
  "duration": 600,
  "views": 1500000,
  "published_at": "2024-01-15T10:00:00Z",
  "cuisine": "Italian",
  "category": "Cooking Tutorial"
}

PHOTO metadata example:
{
  "user_id": "uuid...",
  "username": "foodie_sarah",
  "user_avatar": "https://...",
  "image": "https://...",
  "caption": "Amazing brunch at the local cafe!",
  "location": "Downtown Cafe",
  "tags": ["brunch", "coffee", "avocado"],
  "likes_count": 42
}

AD metadata example:
{
  "title": "Premium Kitchen Tools",
  "image": "https://...",
  "description": "Professional-grade cookware for home chefs",
  "cta_text": "Shop Now",
  "cta_url": "https://...",
  "sponsor": "Kitchen Co.",
  "campaign_id": "kitchen_tools_2024"
}
*/