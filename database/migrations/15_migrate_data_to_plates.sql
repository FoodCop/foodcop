-- Migration: Migrate data from users table to plates table
-- This migration moves existing user data to the new plates structure

-- Insert data from users table to plates table
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
    plates_count as saved_places_count, -- Map plates_count to saved_places_count
    0 as saved_recipes_count, -- Initialize new fields
    0 as saved_photos_count,
    0 as saved_videos_count,
    created_at,
    updated_at
FROM users
WHERE id IS NOT NULL;

-- Migrate existing plates data to saved_places
INSERT INTO saved_places (
    plate_id,
    restaurant_id,
    saved_type,
    notes,
    tags,
    priority,
    user_rating,
    visit_date,
    spent_amount,
    created_at,
    updated_at
)
SELECT
    p.id as plate_id,
    pl.restaurant_id,
    pl.saved_type,
    pl.notes,
    pl.tags,
    pl.priority,
    pl.user_rating,
    pl.visit_date,
    pl.spent_amount,
    pl.created_at,
    pl.updated_at
FROM plates p
JOIN users u ON p.user_id = u.id
JOIN plates pl ON pl.user_id = u.id
WHERE pl.restaurant_id IS NOT NULL;

-- Update saved_places_count in plates table
UPDATE plates
SET saved_places_count = (
    SELECT COUNT(*)
    FROM saved_places
    WHERE saved_places.plate_id = plates.id
);

-- Update saved_photos_count in plates table
UPDATE plates
SET saved_photos_count = (
    SELECT COUNT(*)
    FROM photos
    WHERE photos.user_id = plates.user_id
);

-- Update saved_recipes_count in plates table (if recipes table exists)
-- UPDATE plates
-- SET saved_recipes_count = (
--     SELECT COUNT(*)
--     FROM saved_recipes
--     WHERE saved_recipes.user_id = plates.user_id
-- );

-- Update saved_videos_count in plates table (if videos table exists)
-- UPDATE plates
-- SET saved_videos_count = (
--     SELECT COUNT(*)
--     FROM saved_videos
--     WHERE saved_videos.user_id = plates.user_id
-- );
