-- FUZO Database Utilities
-- Helper functions and procedures for common database operations

-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create a new user with default settings
CREATE OR REPLACE FUNCTION create_user_profile(
    p_email VARCHAR(255),
    p_username VARCHAR(50),
    p_display_name VARCHAR(100),
    p_first_name VARCHAR(50) DEFAULT NULL,
    p_last_name VARCHAR(50) DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO users (
        email, username, display_name, first_name, last_name, avatar_url,
        onboarding_completed
    ) VALUES (
        p_email, p_username, p_display_name, p_first_name, p_last_name, p_avatar_url,
        false
    ) RETURNING id INTO new_user_id;
    
    -- Grant initial "First Bite" achievement
    INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_completed, completed_at)
    SELECT new_user_id, id, 0, false, null
    FROM achievements 
    WHERE name = 'First Bite';
    
    -- Log user creation activity
    INSERT INTO activity_logs (user_id, activity_type, description, points_earned)
    VALUES (new_user_id, 'user_signup', 'User joined FUZO', 100);
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete user onboarding
CREATE OR REPLACE FUNCTION complete_user_onboarding(
    p_user_id UUID,
    p_dietary_preferences JSONB DEFAULT '[]'::jsonb,
    p_cuisine_preferences JSONB DEFAULT '[]'::jsonb,
    p_spice_tolerance INTEGER DEFAULT 3,
    p_price_range_preference INTEGER DEFAULT 2,
    p_location_city VARCHAR(100) DEFAULT NULL,
    p_location_state VARCHAR(100) DEFAULT NULL,
    p_location_country VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users SET 
        dietary_preferences = p_dietary_preferences,
        cuisine_preferences = p_cuisine_preferences,
        spice_tolerance = p_spice_tolerance,
        price_range_preference = p_price_range_preference,
        location_city = p_location_city,
        location_state = p_location_state,
        location_country = p_location_country,
        onboarding_completed = true,
        total_points = total_points + 200
    WHERE id = p_user_id;
    
    -- Log onboarding completion
    INSERT INTO activity_logs (user_id, activity_type, description, points_earned)
    VALUES (p_user_id, 'onboarding_complete', 'Completed FUZO onboarding', 200);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SOCIAL FUNCTIONS
-- =====================================================

-- Function to send friend request or follow user
CREATE OR REPLACE FUNCTION create_user_relationship(
    p_follower_id UUID,
    p_following_id UUID,
    p_relationship_type VARCHAR(20) DEFAULT 'follow'
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_relationship user_relationships%ROWTYPE;
BEGIN
    -- Check if relationship already exists
    SELECT * INTO existing_relationship 
    FROM user_relationships 
    WHERE follower_id = p_follower_id AND following_id = p_following_id;
    
    IF existing_relationship.id IS NOT NULL THEN
        -- Update existing relationship
        UPDATE user_relationships 
        SET relationship_type = p_relationship_type, status = 'pending', updated_at = NOW()
        WHERE id = existing_relationship.id;
    ELSE
        -- Create new relationship
        INSERT INTO user_relationships (follower_id, following_id, relationship_type, status)
        VALUES (p_follower_id, p_following_id, p_relationship_type, 'pending');
    END IF;
    
    -- Log activity
    INSERT INTO activity_logs (user_id, activity_type, description, target_user_id, points_earned)
    VALUES (p_follower_id, 'relationship_request', 'Sent ' || p_relationship_type || ' request', p_following_id, 10);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to accept/reject relationship request
CREATE OR REPLACE FUNCTION respond_to_relationship(
    p_relationship_id UUID,
    p_response VARCHAR(20) -- 'accepted' or 'rejected'
)
RETURNS BOOLEAN AS $$
DECLARE
    relationship_record user_relationships%ROWTYPE;
BEGIN
    -- Get the relationship record
    SELECT * INTO relationship_record 
    FROM user_relationships 
    WHERE id = p_relationship_id;
    
    IF relationship_record.id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update the relationship status
    UPDATE user_relationships 
    SET status = p_response, updated_at = NOW()
    WHERE id = p_relationship_id;
    
    -- If accepted, update user counters and award points
    IF p_response = 'accepted' THEN
        IF relationship_record.relationship_type = 'friend' THEN
            UPDATE users SET friends_count = friends_count + 1 WHERE id = relationship_record.follower_id;
            UPDATE users SET friends_count = friends_count + 1 WHERE id = relationship_record.following_id;
            
            -- Award points for making a friend
            UPDATE users SET total_points = total_points + 50 WHERE id = relationship_record.follower_id;
            UPDATE users SET total_points = total_points + 50 WHERE id = relationship_record.following_id;
        ELSE
            UPDATE users SET following_count = following_count + 1 WHERE id = relationship_record.follower_id;
            UPDATE users SET followers_count = followers_count + 1 WHERE id = relationship_record.following_id;
            
            -- Award points for gaining a follower
            UPDATE users SET total_points = total_points + 25 WHERE id = relationship_record.following_id;
        END IF;
        
        -- Log activities
        INSERT INTO activity_logs (user_id, activity_type, description, target_user_id, points_earned)
        VALUES (relationship_record.following_id, 'relationship_accepted', 'Accepted ' || relationship_record.relationship_type || ' request', relationship_record.follower_id, 25);
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RESTAURANT & CONTENT FUNCTIONS
-- =====================================================

-- Function to save restaurant to user's plate
CREATE OR REPLACE FUNCTION save_restaurant_to_plate(
    p_user_id UUID,
    p_restaurant_id UUID,
    p_saved_type VARCHAR(20) DEFAULT 'want_to_try',
    p_notes TEXT DEFAULT NULL,
    p_tags JSONB DEFAULT '[]'::jsonb,
    p_priority INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO saved_items (user_id, restaurant_id, saved_type, notes, tags, priority)
    VALUES (p_user_id, p_restaurant_id, p_saved_type, p_notes, p_tags, p_priority)
    ON CONFLICT (user_id, restaurant_id) 
    DO UPDATE SET 
        saved_type = EXCLUDED.saved_type,
        notes = EXCLUDED.notes,
        tags = EXCLUDED.tags,
        priority = EXCLUDED.priority,
        updated_at = NOW();
    
    -- Update restaurant save count
    UPDATE restaurants SET save_count = save_count + 1 WHERE id = p_restaurant_id;
    
    -- Award points and log activity
    UPDATE users SET total_points = total_points + 10 WHERE id = p_user_id;
    INSERT INTO activity_logs (user_id, activity_type, description, restaurant_id, points_earned)
    VALUES (p_user_id, 'restaurant_save', 'Saved restaurant to plate', p_restaurant_id, 10);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create a post with automatic point calculation
CREATE OR REPLACE FUNCTION create_user_post(
    p_user_id UUID,
    p_restaurant_id UUID DEFAULT NULL,
    p_content TEXT,
    p_post_type VARCHAR(20) DEFAULT 'general',
    p_images JSONB DEFAULT '[]'::jsonb,
    p_rating DECIMAL(3,2) DEFAULT NULL,
    p_visit_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_post_id UUID;
    points_to_award INTEGER := 25;
BEGIN
    -- Create the post
    INSERT INTO posts (
        user_id, restaurant_id, content, post_type, images, rating, visit_date
    ) VALUES (
        p_user_id, p_restaurant_id, p_content, p_post_type, p_images, p_rating, p_visit_date
    ) RETURNING id INTO new_post_id;
    
    -- Calculate points based on post type
    CASE p_post_type
        WHEN 'review' THEN points_to_award := 50;
        WHEN 'photo' THEN points_to_award := 30;
        WHEN 'check_in' THEN points_to_award := 20;
        ELSE points_to_award := 25;
    END CASE;
    
    -- Award extra points for including rating
    IF p_rating IS NOT NULL THEN
        points_to_award := points_to_award + 25;
    END IF;
    
    -- Update user points and experience
    UPDATE users SET 
        total_points = total_points + points_to_award,
        experience_points = experience_points + points_to_award
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (user_id, activity_type, description, restaurant_id, post_id, points_earned)
    VALUES (p_user_id, 'post_created', 'Created ' || p_post_type || ' post', p_restaurant_id, new_post_id, points_to_award);
    
    RETURN new_post_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEARCH FUNCTIONS
-- =====================================================

-- Function to search users by name or username
CREATE OR REPLACE FUNCTION search_users(
    p_query TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    location_city VARCHAR(100),
    followers_count INTEGER,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.bio, u.location_city,
        u.followers_count, u.is_verified
    FROM users u
    WHERE 
        u.is_active = true 
        AND u.is_master_bot = false
        AND u.search_vector @@ plainto_tsquery('english', p_query)
    ORDER BY 
        u.followers_count DESC,
        ts_rank(u.search_vector, plainto_tsquery('english', p_query)) DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to search restaurants
CREATE OR REPLACE FUNCTION search_restaurants(
    p_query TEXT,
    p_user_lat DECIMAL DEFAULT NULL,
    p_user_lng DECIMAL DEFAULT NULL,
    p_max_distance_km INTEGER DEFAULT 50,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    cuisine_types JSONB,
    rating DECIMAL(3,2),
    review_count INTEGER,
    price_level INTEGER,
    distance_km DECIMAL,
    cover_image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id, r.name, r.address, r.city, r.cuisine_types, r.rating, r.review_count,
        r.price_level,
        CASE 
            WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
                ST_Distance(r.coordinates, ST_Point(p_user_lng, p_user_lat)::geography) / 1000
            ELSE NULL
        END as distance_km,
        r.cover_image_url
    FROM restaurants r
    WHERE 
        r.search_vector @@ plainto_tsquery('english', p_query)
        AND (
            p_user_lat IS NULL OR p_user_lng IS NULL OR
            ST_DWithin(r.coordinates, ST_Point(p_user_lng, p_user_lat)::geography, p_max_distance_km * 1000)
        )
    ORDER BY 
        CASE 
            WHEN p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
                ST_Distance(r.coordinates, ST_Point(p_user_lng, p_user_lat)::geography)
            ELSE 0
        END,
        r.rating DESC,
        ts_rank(r.search_vector, plainto_tsquery('english', p_query)) DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RECOMMENDATION FUNCTIONS
-- =====================================================

-- Function to get restaurant recommendations for a user
CREATE OR REPLACE FUNCTION get_restaurant_recommendations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    cuisine_types JSONB,
    rating DECIMAL(3,2),
    price_level INTEGER,
    recommendation_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        SELECT cuisine_preferences, price_range_preference
        FROM users 
        WHERE id = p_user_id
    ),
    user_saved_cuisines AS (
        SELECT DISTINCT jsonb_array_elements_text(r.cuisine_types) as cuisine
        FROM saved_items si
        JOIN restaurants r ON si.restaurant_id = r.id
        WHERE si.user_id = p_user_id
    ),
    restaurant_scores AS (
        SELECT 
            r.id, r.name, r.cuisine_types, r.rating, r.price_level,
            (
                -- Base score from rating
                (r.rating / 5.0) * 40 +
                
                -- Cuisine preference match
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM jsonb_array_elements_text(up.cuisine_preferences) as pref
                        WHERE EXISTS (
                            SELECT 1 FROM jsonb_array_elements_text(r.cuisine_types) as cuisine
                            WHERE cuisine = pref
                        )
                    ) THEN 30
                    ELSE 0
                END +
                
                -- Price preference match
                CASE 
                    WHEN r.price_level = up.price_range_preference THEN 20
                    WHEN ABS(r.price_level - up.price_range_preference) = 1 THEN 10
                    ELSE 0
                END +
                
                -- Bonus for cuisines user has saved before
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM user_saved_cuisines usc
                        WHERE EXISTS (
                            SELECT 1 FROM jsonb_array_elements_text(r.cuisine_types) as cuisine
                            WHERE cuisine = usc.cuisine
                        )
                    ) THEN 10
                    ELSE 0
                END
            ) as recommendation_score
        FROM restaurants r
        CROSS JOIN user_preferences up
        WHERE r.id NOT IN (
            SELECT restaurant_id FROM saved_items WHERE user_id = p_user_id
        )
    )
    SELECT rs.id, rs.name, rs.cuisine_types, rs.rating, rs.price_level, rs.recommendation_score
    FROM restaurant_scores rs
    ORDER BY rs.recommendation_score DESC, rs.rating DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_posts INTEGER,
    total_photos INTEGER,
    total_saves INTEGER,
    total_points_earned INTEGER,
    days_active INTEGER,
    favorite_cuisine TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH activity_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE al.activity_type = 'post_created') as posts,
            COUNT(*) FILTER (WHERE al.activity_type = 'photo_upload') as photos,
            COUNT(*) FILTER (WHERE al.activity_type = 'restaurant_save') as saves,
            SUM(al.points_earned) as points_earned,
            COUNT(DISTINCT DATE(al.created_at)) as days_active
        FROM activity_logs al
        WHERE al.user_id = p_user_id 
        AND al.created_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    top_cuisine AS (
        SELECT jsonb_array_elements_text(r.cuisine_types) as cuisine
        FROM saved_items si
        JOIN restaurants r ON si.restaurant_id = r.id
        WHERE si.user_id = p_user_id
        GROUP BY cuisine
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        COALESCE(ast.posts, 0)::INTEGER,
        COALESCE(ast.photos, 0)::INTEGER,
        COALESCE(ast.saves, 0)::INTEGER,
        COALESCE(ast.points_earned, 0)::INTEGER,
        COALESCE(ast.days_active, 0)::INTEGER,
        COALESCE(tc.cuisine, 'None')
    FROM activity_stats ast
    CROSS JOIN top_cuisine tc;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to update user levels based on experience points
CREATE OR REPLACE FUNCTION update_user_levels()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    new_level INTEGER;
    level_threshold INTEGER;
    users_updated INTEGER := 0;
BEGIN
    FOR user_record IN 
        SELECT id, experience_points, current_level 
        FROM users 
        WHERE is_active = true 
    LOOP
        -- Calculate new level (simple formula: level = floor(exp_points / 1000) + 1)
        new_level := FLOOR(user_record.experience_points / 1000) + 1;
        
        IF new_level > user_record.current_level THEN
            UPDATE users 
            SET current_level = new_level
            WHERE id = user_record.id;
            
            -- Log level up activity
            INSERT INTO activity_logs (user_id, activity_type, description, points_earned)
            VALUES (user_record.id, 'level_up', 'Reached level ' || new_level, 100);
            
            users_updated := users_updated + 1;
        END IF;
    END LOOP;
    
    RETURN users_updated;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example: Create a new user
/*
SELECT create_user_profile(
    'newuser@example.com',
    'newuser123',
    'New User',
    'John',
    'Doe',
    'https://example.com/avatar.jpg'
);
*/

-- Example: Complete onboarding
/*
SELECT complete_user_onboarding(
    '550e8400-e29b-41d4-a716-446655440001',
    '["vegetarian"]'::jsonb,
    '["italian", "japanese"]'::jsonb,
    3,
    2,
    'San Francisco',
    'CA',
    'USA'
);
*/

-- Example: Search for users
/*
SELECT * FROM search_users('alex', 10, 0);
*/

-- Example: Get restaurant recommendations
/*
SELECT * FROM get_restaurant_recommendations('550e8400-e29b-41d4-a716-446655440001', 5);
*/