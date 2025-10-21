-- Type-Aware Saved Items Table
-- Handles different types of saved content with appropriate metadata

CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Item classification
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('RECIPE', 'RESTAURANT', 'VIDEO', 'PHOTO')),
    item_id VARCHAR(255) NOT NULL,
    
    -- Original card reference (if saved from feed)
    card_id UUID REFERENCES feed_cards(id) ON DELETE SET NULL,
    swipe_event_id UUID REFERENCES swipe_events(id) ON DELETE SET NULL,
    
    -- Flexible metadata storage
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Organization features
    collection_name VARCHAR(100), -- user-defined collections like "Dinner Ideas", "Date Night"
    tags TEXT[], -- searchable tags
    notes TEXT, -- user's personal notes about the item
    
    -- Privacy and sharing
    is_private BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    
    -- User engagement tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    
    -- Timestamps
    saved_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_items_type ON saved_items(item_type, user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_collection ON saved_items(collection_name, user_id) WHERE collection_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_items_tags ON saved_items USING GIN(tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_items_favorites ON saved_items(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_saved_items_card_id ON saved_items(card_id) WHERE card_id IS NOT NULL;

-- Unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_unique ON saved_items(user_id, item_type, item_id);

-- Row Level Security
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own saved items
CREATE POLICY "Users can manage own saved items" ON saved_items
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Users can view public saved items (for sharing features)
CREATE POLICY "Users can view public saved items" ON saved_items
    FOR SELECT USING (is_private = false);

-- Policy: Service role can read all saved items
CREATE POLICY "Service role can read all saved items" ON saved_items
    FOR SELECT USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_saved_items_updated_at
    BEFORE UPDATE ON saved_items
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_items_updated_at();

-- Function to save item (idempotent)
CREATE OR REPLACE FUNCTION save_item(
    p_user_id UUID,
    p_item_type VARCHAR(20),
    p_item_id VARCHAR(255),
    p_metadata JSONB,
    p_card_id UUID DEFAULT NULL,
    p_swipe_event_id UUID DEFAULT NULL,
    p_collection_name VARCHAR(100) DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_existing_id UUID;
    v_new_id UUID;
BEGIN
    -- Check if item already exists
    SELECT id INTO v_existing_id 
    FROM saved_items 
    WHERE user_id = p_user_id 
      AND item_type = p_item_type 
      AND item_id = p_item_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing item with new metadata
        UPDATE saved_items 
        SET 
            metadata = p_metadata,
            card_id = COALESCE(p_card_id, card_id),
            swipe_event_id = COALESCE(p_swipe_event_id, swipe_event_id),
            collection_name = COALESCE(p_collection_name, collection_name),
            tags = COALESCE(p_tags, tags),
            notes = COALESCE(p_notes, notes),
            updated_at = now()
        WHERE id = v_existing_id;
        
        RETURN v_existing_id;
    END IF;
    
    -- Insert new saved item
    INSERT INTO saved_items (
        user_id, item_type, item_id, metadata, card_id, swipe_event_id,
        collection_name, tags, notes
    ) VALUES (
        p_user_id, p_item_type, p_item_id, p_metadata, p_card_id, p_swipe_event_id,
        p_collection_name, p_tags, p_notes
    ) RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_saved_item_views(p_saved_item_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE saved_items 
    SET 
        view_count = view_count + 1,
        last_viewed_at = now()
    WHERE id = p_saved_item_id 
      AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get saved items by collection
CREATE OR REPLACE FUNCTION get_saved_items_by_collection(
    p_user_id UUID, 
    p_collection_name VARCHAR(100) DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    item_type VARCHAR(20),
    item_id VARCHAR(255),
    metadata JSONB,
    collection_name VARCHAR(100),
    tags TEXT[],
    notes TEXT,
    is_favorite BOOLEAN,
    view_count INTEGER,
    saved_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.item_type, s.item_id, s.metadata, s.collection_name,
        s.tags, s.notes, s.is_favorite, s.view_count, s.saved_at, s.last_viewed_at
    FROM saved_items s
    WHERE s.user_id = p_user_id
      AND (p_collection_name IS NULL OR s.collection_name = p_collection_name)
    ORDER BY s.saved_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to search saved items
CREATE OR REPLACE FUNCTION search_saved_items(
    p_user_id UUID,
    p_search_query TEXT,
    p_item_type VARCHAR(20) DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    item_type VARCHAR(20),
    item_id VARCHAR(255),
    metadata JSONB,
    collection_name VARCHAR(100),
    tags TEXT[],
    notes TEXT,
    is_favorite BOOLEAN,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.item_type, s.item_id, s.metadata, s.collection_name,
        s.tags, s.notes, s.is_favorite,
        -- Simple text search relevance scoring
        GREATEST(
            similarity(COALESCE(s.metadata->>'title', ''), p_search_query),
            similarity(COALESCE(s.notes, ''), p_search_query),
            similarity(array_to_string(s.tags, ' '), p_search_query)
        ) as relevance_score
    FROM saved_items s
    WHERE s.user_id = p_user_id
      AND (p_item_type IS NULL OR s.item_type = p_item_type)
      AND (
        s.metadata::text ILIKE '%' || p_search_query || '%' OR
        s.notes ILIKE '%' || p_search_query || '%' OR
        array_to_string(s.tags, ' ') ILIKE '%' || p_search_query || '%'
      )
    ORDER BY relevance_score DESC, s.saved_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Example metadata structures for different item types:
/*
RECIPE saved item metadata:
{
  "title": "Spicy Thai Basil Chicken",
  "image": "https://...",
  "source_url": "https://...",
  "cook_time": 30,
  "servings": 4,
  "cuisine": "Thai",
  "difficulty": "Medium",
  "ingredients": ["chicken", "basil", "chilies"],
  "instructions": ["Step 1...", "Step 2..."],
  "nutrition": {
    "calories": 350,
    "protein": 25
  }
}

RESTAURANT saved item metadata:
{
  "name": "Joe's Pizza",
  "image": "https://...",
  "address": "123 Main St",
  "phone": "+1234567890",
  "rating": 4.5,
  "price_level": 2,
  "cuisine": "Italian",
  "hours": "11:00 AM - 10:00 PM",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}

VIDEO saved item metadata:
{
  "title": "How to Make Perfect Pasta",
  "channel": "Chef's Kitchen",
  "thumbnail": "https://...",
  "video_url": "https://...",
  "duration": 600,
  "published_at": "2024-01-15T10:00:00Z",
  "cuisine": "Italian",
  "category": "Cooking Tutorial"
}

PHOTO saved item metadata:
{
  "user_id": "uuid...",
  "username": "foodie_sarah",
  "user_avatar": "https://...",
  "image": "https://...",
  "caption": "Amazing brunch at the local cafe!",
  "location": "Downtown Cafe",
  "tags": ["brunch", "coffee", "avocado"],
  "taken_at": "2024-01-15T10:00:00Z"
}
*/