-- User Preferences Table
-- Tracks user taste preferences with incremental learning

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Preference classification
    preference_type VARCHAR(50) NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    
    -- Confidence and learning metrics
    confidence_score DECIMAL(3, 2) DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
    interaction_count INTEGER DEFAULT 1,
    positive_interactions INTEGER DEFAULT 0,
    negative_interactions INTEGER DEFAULT 0,
    
    -- Source tracking
    source VARCHAR(20) DEFAULT 'swipe' CHECK (source IN ('swipe', 'explicit', 'onboarding', 'import')),
    
    -- Metadata for complex preferences
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    first_learned_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON user_preferences(preference_type, user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_confidence ON user_preferences(user_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated ON user_preferences(updated_at DESC);

-- Unique constraint for preference keys per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_unique ON user_preferences(user_id, preference_type, preference_key);

-- Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can read all preferences (for recommendations)
CREATE POLICY "Service role can read all preferences" ON user_preferences
    FOR SELECT USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Function to update user preferences incrementally
CREATE OR REPLACE FUNCTION update_user_preference(
    p_user_id UUID,
    p_preference_type VARCHAR(50),
    p_preference_key VARCHAR(100),
    p_preference_value JSONB,
    p_is_positive BOOLEAN,
    p_source VARCHAR(20) DEFAULT 'swipe',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_existing_id UUID;
    v_new_confidence DECIMAL(3, 2);
    v_new_id UUID;
BEGIN
    -- Check if preference already exists
    SELECT id INTO v_existing_id 
    FROM user_preferences 
    WHERE user_id = p_user_id 
      AND preference_type = p_preference_type 
      AND preference_key = p_preference_key;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing preference with incremental learning
        UPDATE user_preferences 
        SET 
            preference_value = p_preference_value,
            interaction_count = interaction_count + 1,
            positive_interactions = positive_interactions + CASE WHEN p_is_positive THEN 1 ELSE 0 END,
            negative_interactions = negative_interactions + CASE WHEN NOT p_is_positive THEN 1 ELSE 0 END,
            confidence_score = LEAST(1.0, GREATEST(0.0, 
                (positive_interactions + CASE WHEN p_is_positive THEN 1 ELSE 0 END)::DECIMAL / 
                (interaction_count + 1)::DECIMAL
            )),
            metadata = p_metadata,
            updated_at = now()
        WHERE id = v_existing_id;
        
        RETURN v_existing_id;
    END IF;
    
    -- Calculate initial confidence score
    v_new_confidence := CASE WHEN p_is_positive THEN 0.8 ELSE 0.2 END;
    
    -- Insert new preference
    INSERT INTO user_preferences (
        user_id, preference_type, preference_key, preference_value,
        confidence_score, interaction_count, 
        positive_interactions, negative_interactions,
        source, metadata
    ) VALUES (
        p_user_id, p_preference_type, p_preference_key, p_preference_value,
        v_new_confidence, 1,
        CASE WHEN p_is_positive THEN 1 ELSE 0 END,
        CASE WHEN NOT p_is_positive THEN 1 ELSE 0 END,
        p_source, p_metadata
    ) RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process swipe event for preference learning
CREATE OR REPLACE FUNCTION learn_from_swipe_event(
    p_user_id UUID,
    p_card_type VARCHAR(20),
    p_content_metadata JSONB,
    p_swipe_action VARCHAR(10)
)
RETURNS VOID AS $$
DECLARE
    v_is_positive BOOLEAN;
    v_cuisine TEXT;
    v_difficulty TEXT;
    v_price_level INTEGER;
    v_category TEXT;
BEGIN
    -- Determine if action is positive
    v_is_positive := p_swipe_action IN ('LIKE', 'SAVE', 'SHARE');
    
    -- Learn cuisine preferences (all card types)
    v_cuisine := p_content_metadata->>'cuisine';
    IF v_cuisine IS NOT NULL THEN
        PERFORM update_user_preference(
            p_user_id, 'cuisine', v_cuisine, 
            jsonb_build_object('name', v_cuisine),
            v_is_positive, 'swipe'
        );
    END IF;
    
    -- Card type specific learning
    CASE p_card_type
        WHEN 'RECIPE' THEN
            -- Learn difficulty preferences
            v_difficulty := p_content_metadata->>'difficulty';
            IF v_difficulty IS NOT NULL THEN
                PERFORM update_user_preference(
                    p_user_id, 'recipe_difficulty', v_difficulty,
                    jsonb_build_object('level', v_difficulty),
                    v_is_positive, 'swipe'
                );
            END IF;
            
            -- Learn cooking time preferences
            IF p_content_metadata->>'cook_time' IS NOT NULL THEN
                PERFORM update_user_preference(
                    p_user_id, 'cook_time', 
                    CASE 
                        WHEN (p_content_metadata->>'cook_time')::INTEGER <= 15 THEN 'quick'
                        WHEN (p_content_metadata->>'cook_time')::INTEGER <= 45 THEN 'medium'
                        ELSE 'long'
                    END,
                    jsonb_build_object('minutes', p_content_metadata->>'cook_time'),
                    v_is_positive, 'swipe'
                );
            END IF;
            
        WHEN 'RESTAURANT_NEARBY' THEN
            -- Learn price level preferences
            v_price_level := (p_content_metadata->>'price_level')::INTEGER;
            IF v_price_level IS NOT NULL THEN
                PERFORM update_user_preference(
                    p_user_id, 'price_level', v_price_level::TEXT,
                    jsonb_build_object('level', v_price_level),
                    v_is_positive, 'swipe'
                );
            END IF;
            
        WHEN 'VIDEO' THEN
            -- Learn video category preferences
            v_category := p_content_metadata->>'category';
            IF v_category IS NOT NULL THEN
                PERFORM update_user_preference(
                    p_user_id, 'video_category', v_category,
                    jsonb_build_object('name', v_category),
                    v_is_positive, 'swipe'
                );
            END IF;
            
        ELSE
            -- Handle other card types as needed
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user preferences for recommendations
CREATE OR REPLACE FUNCTION get_user_preferences(
    p_user_id UUID,
    p_preference_type VARCHAR(50) DEFAULT NULL,
    p_min_confidence DECIMAL(3, 2) DEFAULT 0.6
)
RETURNS TABLE (
    preference_type VARCHAR(50),
    preference_key VARCHAR(100),
    preference_value JSONB,
    confidence_score DECIMAL(3, 2),
    interaction_count INTEGER,
    positive_interactions INTEGER,
    negative_interactions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.preference_type, up.preference_key, up.preference_value,
        up.confidence_score, up.interaction_count, 
        up.positive_interactions, up.negative_interactions
    FROM user_preferences up
    WHERE up.user_id = p_user_id
      AND (p_preference_type IS NULL OR up.preference_type = p_preference_type)
      AND up.confidence_score >= p_min_confidence
    ORDER BY up.confidence_score DESC, up.interaction_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get preference recommendations for feed composition
CREATE OR REPLACE FUNCTION get_feed_composition_preferences(p_user_id UUID)
RETURNS TABLE (
    preferred_cuisines TEXT[],
    preferred_difficulty_levels TEXT[],
    preferred_cook_times TEXT[],
    preferred_price_levels INTEGER[],
    preferred_video_categories TEXT[]
) AS $$
DECLARE
    v_cuisines TEXT[];
    v_difficulties TEXT[];
    v_cook_times TEXT[];
    v_price_levels INTEGER[];
    v_video_categories TEXT[];
BEGIN
    -- Get preferred cuisines
    SELECT array_agg(preference_key) INTO v_cuisines
    FROM user_preferences 
    WHERE user_id = p_user_id 
      AND preference_type = 'cuisine' 
      AND confidence_score >= 0.6;
    
    -- Get preferred recipe difficulties
    SELECT array_agg(preference_key) INTO v_difficulties
    FROM user_preferences 
    WHERE user_id = p_user_id 
      AND preference_type = 'recipe_difficulty' 
      AND confidence_score >= 0.6;
    
    -- Get preferred cooking times
    SELECT array_agg(preference_key) INTO v_cook_times
    FROM user_preferences 
    WHERE user_id = p_user_id 
      AND preference_type = 'cook_time' 
      AND confidence_score >= 0.6;
    
    -- Get preferred price levels
    SELECT array_agg(preference_key::INTEGER) INTO v_price_levels
    FROM user_preferences 
    WHERE user_id = p_user_id 
      AND preference_type = 'price_level' 
      AND confidence_score >= 0.6;
    
    -- Get preferred video categories
    SELECT array_agg(preference_key) INTO v_video_categories
    FROM user_preferences 
    WHERE user_id = p_user_id 
      AND preference_type = 'video_category' 
      AND confidence_score >= 0.6;
    
    RETURN QUERY SELECT v_cuisines, v_difficulties, v_cook_times, v_price_levels, v_video_categories;
END;
$$ LANGUAGE plpgsql;

-- Example preference types and structures:
/*
Preference Types:
- 'cuisine': 'italian', 'thai', 'mexican', etc.
- 'recipe_difficulty': 'easy', 'medium', 'hard'
- 'cook_time': 'quick' (<=15min), 'medium' (16-45min), 'long' (>45min)
- 'price_level': '1', '2', '3', '4' ($ to $$$$)
- 'video_category': 'tutorial', 'review', 'documentary', etc.
- 'dietary_restriction': 'vegetarian', 'vegan', 'gluten_free', etc.
- 'meal_type': 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'
- 'cooking_method': 'grilling', 'baking', 'frying', 'slow_cooking', etc.
*/