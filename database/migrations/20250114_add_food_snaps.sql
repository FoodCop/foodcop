-- Migration: Add food_snaps table for enhanced snap functionality
-- Created: 2025-01-14

-- Create food_snaps table
CREATE TABLE IF NOT EXISTS food_snaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Image data
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    
    -- Restaurant and food info
    restaurant_name VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
    food_tags TEXT[] DEFAULT '{}',
    additional_tags TEXT[] DEFAULT '{}',
    review TEXT,
    price_range VARCHAR(50),
    
    -- Visit info
    visit_date TIMESTAMP WITH TIME ZONE,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Location data
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    
    -- Social stats
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- Metadata
    is_public BOOLEAN DEFAULT TRUE,
    tenant_id VARCHAR(50) DEFAULT 'foodcop',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_snaps_user_id ON food_snaps(user_id);
CREATE INDEX IF NOT EXISTS idx_food_snaps_restaurant_name ON food_snaps(restaurant_name);
CREATE INDEX IF NOT EXISTS idx_food_snaps_food_tags ON food_snaps USING GIN(food_tags);
CREATE INDEX IF NOT EXISTS idx_food_snaps_additional_tags ON food_snaps USING GIN(additional_tags);
CREATE INDEX IF NOT EXISTS idx_food_snaps_location ON food_snaps(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_food_snaps_created_at ON food_snaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_snaps_tenant_id ON food_snaps(tenant_id);

-- Create RLS policies
ALTER TABLE food_snaps ENABLE ROW LEVEL SECURITY;

-- Users can view their own snaps
CREATE POLICY "Users can view own snaps" ON food_snaps
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own snaps
CREATE POLICY "Users can insert own snaps" ON food_snaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own snaps
CREATE POLICY "Users can update own snaps" ON food_snaps
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own snaps
CREATE POLICY "Users can delete own snaps" ON food_snaps
    FOR DELETE USING (auth.uid() = user_id);

-- Public snaps can be viewed by anyone (for social features)
CREATE POLICY "Public snaps are viewable" ON food_snaps
    FOR SELECT USING (is_public = true);

-- Create helper functions for points system
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, points_to_add INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_points INTEGER;
BEGIN
    UPDATE users 
    SET total_points = COALESCE(total_points, 0) + points_to_add
    WHERE id = user_id
    RETURNING total_points INTO current_points;
    
    RETURN COALESCE(current_points, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_experience(user_id UUID, exp_to_add INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_exp INTEGER;
BEGIN
    UPDATE users 
    SET experience_points = COALESCE(experience_points, 0) + exp_to_add
    WHERE id = user_id
    RETURNING experience_points INTO current_exp;
    
    RETURN COALESCE(current_exp, 0);
END;
$$ LANGUAGE plpgsql;

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    points_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    tenant_id VARCHAR(50) DEFAULT 'foodcop',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);

-- RLS for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update saved_items to support photo snaps if not already done
DO $$
BEGIN
    -- Check if 'photo' is already in the item_type check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%saved_items_item_type%' 
        AND check_clause LIKE '%photo%'
    ) THEN
        -- Add photo to allowed item types
        ALTER TABLE saved_items DROP CONSTRAINT IF EXISTS saved_items_item_type_check;
        ALTER TABLE saved_items ADD CONSTRAINT saved_items_item_type_check 
            CHECK (item_type IN ('restaurant', 'recipe', 'video', 'photo', 'other'));
    END IF;
END $$;