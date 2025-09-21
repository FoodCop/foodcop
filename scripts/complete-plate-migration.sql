-- Complete Plate Migration Script
-- Run this in your Supabase SQL Editor to set up the plate system

-- Step 1: Add missing columns to existing plates table
ALTER TABLE plates ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE plates ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE plates ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS location_city VARCHAR(100);
ALTER TABLE plates ADD COLUMN IF NOT EXISTS location_state VARCHAR(100);
ALTER TABLE plates ADD COLUMN IF NOT EXISTS location_country VARCHAR(100);
ALTER TABLE plates ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT '[]'::jsonb;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS cuisine_preferences JSONB DEFAULT '[]'::jsonb;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_places_count INTEGER DEFAULT 0;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_recipes_count INTEGER DEFAULT 0;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_photos_count INTEGER DEFAULT 0;
ALTER TABLE plates ADD COLUMN IF NOT EXISTS saved_videos_count INTEGER DEFAULT 0;

-- Step 2: Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Create saved_places table
CREATE TABLE IF NOT EXISTS saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_id UUID NOT NULL REFERENCES plates(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Save Details
    saved_type VARCHAR(20) DEFAULT 'want_to_try' CHECK (saved_type IN ('want_to_try', 'favorite', 'visited', 'wishlist')),
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),

    -- User Experience
    user_rating DECIMAL(3,2),
    visit_date DATE,
    spent_amount DECIMAL(10,2),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(plate_id, restaurant_id)
);

-- Step 4: Create plate_items table
CREATE TABLE IF NOT EXISTS plate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_id UUID NOT NULL REFERENCES plates(id) ON DELETE CASCADE,

    -- Item Details
    item_type TEXT NOT NULL CHECK (item_type IN ('restaurant', 'recipe', 'photo', 'video')),
    item_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint for idempotency
    UNIQUE(plate_id, item_type, item_id)
);

-- Step 5: Create indexes for saved_places table
CREATE INDEX IF NOT EXISTS idx_saved_places_plate_id ON saved_places(plate_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_restaurant_id ON saved_places(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_saved_type ON saved_places(saved_type);
CREATE INDEX IF NOT EXISTS idx_saved_places_created_at ON saved_places(created_at DESC);

-- Step 6: Create indexes for plate_items table
CREATE INDEX IF NOT EXISTS idx_plate_items_plate_id ON plate_items(plate_id);
CREATE INDEX IF NOT EXISTS idx_plate_items_item_type ON plate_items(item_type);
CREATE INDEX IF NOT EXISTS idx_plate_items_item_id ON plate_items(item_id);
CREATE INDEX IF NOT EXISTS idx_plate_items_created_at ON plate_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plate_items_plate_type ON plate_items(plate_id, item_type);

-- Step 7: Create indexes for plates table
CREATE INDEX IF NOT EXISTS idx_plates_user_id ON plates(user_id);
CREATE INDEX IF NOT EXISTS idx_plates_username ON plates(username);
CREATE INDEX IF NOT EXISTS idx_plates_created_at ON plates(created_at);
CREATE INDEX IF NOT EXISTS idx_plates_total_points ON plates(total_points DESC);

-- Step 8: Enable RLS on all tables
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE plate_items ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for plates table
DROP POLICY IF EXISTS "Users can view public plates" ON plates;
CREATE POLICY "Users can view public plates" ON plates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own plate" ON plates;
CREATE POLICY "Users can update own plate" ON plates FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plate" ON plates;
CREATE POLICY "Users can insert own plate" ON plates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plate" ON plates;
CREATE POLICY "Users can delete own plate" ON plates FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create RLS policies for saved_places table
DROP POLICY IF EXISTS "Users can manage own saved places" ON saved_places;
CREATE POLICY "Users can manage own saved places" ON saved_places
    FOR ALL USING (plate_id IN (
        SELECT id FROM plates WHERE user_id = auth.uid()
    ));

-- Step 11: Create RLS policies for plate_items table
DROP POLICY IF EXISTS "Users can manage own plate items" ON plate_items;
CREATE POLICY "Users can manage own plate items" ON plate_items
    FOR ALL USING (plate_id IN (
        SELECT id FROM plates WHERE user_id = auth.uid()
    ));

-- Step 12: Create triggers for updated_at
DROP TRIGGER IF EXISTS update_plates_updated_at ON plates;
CREATE TRIGGER update_plates_updated_at
    BEFORE UPDATE ON plates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_places_updated_at ON saved_places;
CREATE TRIGGER update_saved_places_updated_at
    BEFORE UPDATE ON saved_places
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plate_items_updated_at ON plate_items;
CREATE TRIGGER update_plate_items_updated_at
    BEFORE UPDATE ON plate_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Migrate existing data (if any)
-- This will only run if there's existing data in the users table
INSERT INTO plates (
    user_id,
    display_name,
    username,
    bio,
    avatar_url,
    cover_photo_url,
    location_city,
    location_state,
    location_country,
    dietary_preferences,
    cuisine_preferences,
    total_points,
    current_level,
    streak_count,
    friends_count,
    saved_places_count,
    saved_recipes_count,
    saved_photos_count,
    saved_videos_count,
    created_at,
    updated_at
)
SELECT
    id as user_id,
    COALESCE(display_name, 'User') as display_name,
    COALESCE(username, split_part(email, '@', 1)) as username,
    bio,
    avatar_url,
    cover_photo_url,
    location_city,
    location_state,
    location_country,
    COALESCE(dietary_preferences, '[]'::jsonb) as dietary_preferences,
    COALESCE(cuisine_preferences, '[]'::jsonb) as cuisine_preferences,
    COALESCE(total_points, 0) as total_points,
    COALESCE(current_level, 1) as current_level,
    COALESCE(streak_count, 0) as streak_count,
    COALESCE(friends_count, 0) as friends_count,
    COALESCE(plates_count, 0) as saved_places_count,
    0 as saved_recipes_count,
    0 as saved_photos_count,
    0 as saved_videos_count,
    created_at,
    updated_at
FROM users
WHERE id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 14: Update saved_places_count in plates table
UPDATE plates
SET saved_places_count = (
    SELECT COUNT(*)
    FROM saved_places
    WHERE saved_places.plate_id = plates.id
);

-- Success message
SELECT 'Plate migration completed successfully! All tables and policies are now set up.' as status;
