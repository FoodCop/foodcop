-- User Swipe Events Table
-- Tracks all user interactions with feed cards (idempotent design)

CREATE TABLE IF NOT EXISTS swipe_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Stable event identifier for idempotency
    event_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- User and card references
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES feed_cards(id) ON DELETE CASCADE,
    
    -- Swipe direction and resulting action
    swipe_direction VARCHAR(10) NOT NULL CHECK (swipe_direction IN ('LEFT', 'RIGHT', 'UP', 'DOWN')),
    swipe_action VARCHAR(10) NOT NULL CHECK (swipe_action IN ('DISLIKE', 'LIKE', 'SHARE', 'SAVE')),
    
    -- Additional context
    card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('RECIPE', 'RESTAURANT_NEARBY', 'VIDEO', 'PHOTO', 'AD')),
    content_id VARCHAR(255) NOT NULL,
    
    -- Session and device context
    session_id VARCHAR(255),
    device_type VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
    user_agent TEXT,
    
    -- Swipe mechanics data
    swipe_velocity DECIMAL(8, 4), -- pixels per second
    swipe_distance DECIMAL(8, 2), -- total swipe distance in pixels
    interaction_duration INTEGER DEFAULT 0, -- milliseconds
    
    -- Geolocation (for location-aware recommendations)
    user_lat DECIMAL(10, 8),
    user_lng DECIMAL(11, 8),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_swipe_events_user_id ON swipe_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swipe_events_card_type ON swipe_events(card_type, swipe_action);
CREATE INDEX IF NOT EXISTS idx_swipe_events_content_id ON swipe_events(content_id, card_type);
CREATE INDEX IF NOT EXISTS idx_swipe_events_session ON swipe_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_swipe_events_created_at ON swipe_events(created_at DESC);

-- Composite index for preference analysis
CREATE INDEX IF NOT EXISTS idx_swipe_events_preferences ON swipe_events(user_id, card_type, swipe_action, created_at DESC);

-- Row Level Security
ALTER TABLE swipe_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own swipe events
CREATE POLICY "Users can view own swipe events" ON swipe_events
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own swipe events
CREATE POLICY "Users can insert own swipe events" ON swipe_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can read all events (for analytics)
CREATE POLICY "Service role can read all swipe events" ON swipe_events
    FOR SELECT USING (auth.role() = 'service_role');

-- Function to generate stable event IDs
CREATE OR REPLACE FUNCTION generate_swipe_event_id(
    p_user_id UUID,
    p_card_id UUID,
    p_swipe_direction VARCHAR(10),
    p_timestamp TIMESTAMPTZ DEFAULT now()
)
RETURNS VARCHAR(255) AS $$
BEGIN
    -- Create a stable ID based on user, card, direction, and rounded timestamp (to nearest minute)
    -- This prevents duplicate events for the same action within a short time window
    RETURN encode(
        digest(
            p_user_id::text || 
            p_card_id::text || 
            p_swipe_direction || 
            date_trunc('minute', p_timestamp)::text,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to insert swipe event (idempotent)
CREATE OR REPLACE FUNCTION insert_swipe_event(
    p_user_id UUID,
    p_card_id UUID,
    p_swipe_direction VARCHAR(10),
    p_swipe_action VARCHAR(10),
    p_card_type VARCHAR(20),
    p_content_id VARCHAR(255),
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_device_type VARCHAR(20) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_swipe_velocity DECIMAL(8, 4) DEFAULT NULL,
    p_swipe_distance DECIMAL(8, 2) DEFAULT NULL,
    p_interaction_duration INTEGER DEFAULT 0,
    p_user_lat DECIMAL(10, 8) DEFAULT NULL,
    p_user_lng DECIMAL(11, 8) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id VARCHAR(255);
    v_existing_id UUID;
    v_new_id UUID;
BEGIN
    -- Generate stable event ID
    v_event_id := generate_swipe_event_id(p_user_id, p_card_id, p_swipe_direction);
    
    -- Check if event already exists
    SELECT id INTO v_existing_id 
    FROM swipe_events 
    WHERE event_id = v_event_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Event already exists, return existing ID
        RETURN v_existing_id;
    END IF;
    
    -- Insert new event
    INSERT INTO swipe_events (
        event_id, user_id, card_id, swipe_direction, swipe_action,
        card_type, content_id, session_id, device_type, user_agent,
        swipe_velocity, swipe_distance, interaction_duration,
        user_lat, user_lng
    ) VALUES (
        v_event_id, p_user_id, p_card_id, p_swipe_direction, p_swipe_action,
        p_card_type, p_content_id, p_session_id, p_device_type, p_user_agent,
        p_swipe_velocity, p_swipe_distance, p_interaction_duration,
        p_user_lat, p_user_lng
    ) RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user swipe statistics
CREATE OR REPLACE FUNCTION get_user_swipe_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_swipes BIGINT,
    likes BIGINT,
    dislikes BIGINT,
    saves BIGINT,
    shares BIGINT,
    recipes_liked BIGINT,
    restaurants_liked BIGINT,
    videos_liked BIGINT,
    photos_liked BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_swipes,
        COUNT(*) FILTER (WHERE swipe_action = 'LIKE') as likes,
        COUNT(*) FILTER (WHERE swipe_action = 'DISLIKE') as dislikes,
        COUNT(*) FILTER (WHERE swipe_action = 'SAVE') as saves,
        COUNT(*) FILTER (WHERE swipe_action = 'SHARE') as shares,
        COUNT(*) FILTER (WHERE swipe_action = 'LIKE' AND card_type = 'RECIPE') as recipes_liked,
        COUNT(*) FILTER (WHERE swipe_action = 'LIKE' AND card_type = 'RESTAURANT_NEARBY') as restaurants_liked,
        COUNT(*) FILTER (WHERE swipe_action = 'LIKE' AND card_type = 'VIDEO') as videos_liked,
        COUNT(*) FILTER (WHERE swipe_action = 'LIKE' AND card_type = 'PHOTO') as photos_liked
    FROM swipe_events 
    WHERE user_id = p_user_id 
      AND created_at >= now() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql;