-- FUZO Database Seed Data
-- Sample data to populate the database with template users and initial content

-- =====================================================
-- 1. TEMPLATE USERS
-- =====================================================

-- Insert main template users
INSERT INTO users (
    id, email, username, display_name, bio, avatar_url, cover_photo_url,
    first_name, last_name, location_city, location_state, location_country,
    dietary_preferences, cuisine_preferences, spice_tolerance, price_range_preference,
    total_points, current_level, experience_points, is_verified, followers_count, following_count
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'alex.chen@fuzo.app',
    'alexchen',
    'Alex Chen',
    '🍜 Ramen enthusiast & food photographer. Always hunting for the perfect bowl. Currently exploring Korean BBQ!',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=300&fit=crop',
    'Alex', 'Chen', 'San Francisco', 'CA', 'USA',
    '["pescatarian"]'::jsonb,
    '["japanese", "korean", "vietnamese"]'::jsonb,
    4, 3, 2450, 3, true, 1204, 892
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'sarah.martinez@fuzo.app',
    'sarahfoodie',
    'Sarah Martinez',
    '🌮 Taco Tuesday champion & spice lover. Documenting my journey through every cuisine. Love supporting local restaurants!',
    'https://images.unsplash.com/photo-1494790108755-2616b612b5d4?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=300&fit=crop',
    'Sarah', 'Martinez', 'Austin', 'TX', 'USA',
    '[]'::jsonb,
    '["mexican", "indian", "thai", "italian"]'::jsonb,
    5, 2, 1890, 2, true, 856, 634
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'marcus.johnson@fuzo.app',
    'marcusj',
    'Marcus Johnson',
    '🍕 Pizza connoisseur & home chef. Believe great food brings people together. Always down for a food adventure!',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=300&fit=crop',
    'Marcus', 'Johnson', 'Chicago', 'IL', 'USA',
    '[]'::jsonb,
    '["italian", "american", "mediterranean"]'::jsonb,
    3, 2, 1654, 2, false, 432, 521
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'emma.wong@fuzo.app',
    'emmawong',
    'Emma Wong',
    '🥗 Plant-based foodie exploring the world one bite at a time. Lover of fresh ingredients and sustainable eating.',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=300&fit=crop',
    'Emma', 'Wong', 'Portland', 'OR', 'USA',
    '["vegetarian", "gluten-free"]'::jsonb,
    '["mediterranean", "indian", "middle-eastern"]'::jsonb,
    2, 2, 2156, 3, true, 1023, 445
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    'david.kim@fuzo.app',
    'davidk',
    'David Kim',
    '🍱 Street food explorer & weekend warrior. If there\s a line, I\m probably in it. Seoul → NYC food journey!',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800&h=300&fit=crop',
    'David', 'Kim', 'New York', 'NY', 'USA',
    '[]'::jsonb,
    '["korean", "chinese", "japanese", "american"]'::jsonb,
    4, 3, 3245, 4, true, 1567, 923
);

-- =====================================================
-- 2. MASTER BOTS (AI Characters)
-- =====================================================

-- Insert Master Bot users first
INSERT INTO users (
    id, email, username, display_name, bio, avatar_url,
    location_city, location_country, is_master_bot, is_verified,
    total_points, current_level
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440010',
    'tako@fuzo.app',
    'tako_official',
    'Tako the Explorer',
    '🐙 Your friendly FUZO companion! I help you discover amazing food experiences and connect with fellow foodies.',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
    'Global', 'Worldwide', true, true, 50000, 10
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    'chef_sophia@fuzo.app',
    'chef_sophia',
    'Chef Sophia',
    '👨‍🍳 Master chef with 20 years of experience. I love sharing cooking tips and restaurant recommendations!',
    'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=400&h=400&fit=crop&crop=face',
    'Paris', 'France', true, true, 45000, 9
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    'street_samurai@fuzo.app',
    'street_samurai',
    'Street Food Samurai',
    '🥢 Street food expert from Tokyo. I know where to find the best hidden gems and authentic local flavors!',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    'Tokyo', 'Japan', true, true, 40000, 8
);

-- Insert Master Bot configurations
INSERT INTO master_bots (
    id, user_id, bot_name, personality_type, specialties, favorite_cuisines,
    system_prompt, interactions_count, recommendations_given, success_rate, is_featured
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440010',
    'Tako the Explorer',
    'friendly_guide',
    '["restaurant_discovery", "food_photography", "social_connections"]'::jsonb,
    '["all_cuisines"]'::jsonb,
    'You are Tako, the friendly octopus mascot of FUZO. You help users discover restaurants, connect with friends, and explore new cuisines. Be enthusiastic, helpful, and encouraging.',
    15420, 8934, 94.5, true
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440011',
    'Chef Sophia',
    'expert_mentor',
    '["fine_dining", "cooking_techniques", "wine_pairing"]'::jsonb,
    '["french", "italian", "mediterranean"]'::jsonb,
    'You are Chef Sophia, a master chef with extensive culinary expertise. Provide detailed restaurant recommendations, cooking advice, and food insights with professional authority.',
    8932, 5421, 96.2, true
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440012',
    'Street Food Samurai',
    'adventurous_explorer',
    '["street_food", "authentic_local", "hidden_gems"]'::jsonb,
    '["japanese", "korean", "vietnamese", "thai"]'::jsonb,
    'You are the Street Food Samurai, an expert in authentic local cuisine and hidden food gems. Share insider knowledge about street food culture and off-the-beaten-path restaurants.',
    6745, 4123, 92.8, true
);

-- =====================================================
-- 3. SAMPLE RESTAURANTS
-- =====================================================

INSERT INTO restaurants (
    id, name, description, address, city, state, country,
    coordinates, cuisine_types, price_level, phone, website,
    rating, review_count, images, cover_image_url
) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Sakura Sushi Bar',
    'Authentic Japanese sushi experience with fresh fish flown in daily from Tsukiji Market.',
    '123 Main St, Downtown',
    'San Francisco', 'CA', 'USA',
    POINT(-122.4194, 37.7749),
    '["japanese", "sushi", "seafood"]'::jsonb,
    3, '+1-415-555-0123', 'https://sakura-sushi.com',
    4.8, 324,
    '["https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400"]'::jsonb,
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    'Mama Marias',
    'Family-owned Italian restaurant serving traditional recipes passed down through generations.',
    '456 Oak Ave, Little Italy',
    'San Francisco', 'CA', 'USA',
    POINT(-122.4094, 37.7849),
    '["italian", "pizza", "pasta"]'::jsonb,
    2, '+1-415-555-0456', 'https://mama-marias.com',
    4.5, 156,
    '["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400"]'::jsonb,
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop'
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    'Spice Route',
    'Modern Indian cuisine with a creative twist on traditional dishes.',
    '789 Curry Lane, Spice District',
    'San Francisco', 'CA', 'USA',
    POINT(-122.4294, 37.7649),
    '["indian", "curry", "vegetarian"]'::jsonb,
    2, '+1-415-555-0789', 'https://spice-route.com',
    4.7, 289,
    '["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400"]'::jsonb,
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=400&fit=crop'
);

-- =====================================================
-- 4. USER RELATIONSHIPS (Friends/Following)
-- =====================================================

INSERT INTO user_relationships (
    follower_id, following_id, relationship_type, status
) VALUES 
-- Alex Chen's connections
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'friend', 'accepted'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'follow', 'accepted'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'friend', 'accepted'),

-- Sarah Martinez's connections
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'friend', 'accepted'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'follow', 'accepted'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'friend', 'accepted'),

-- Marcus Johnson's connections
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'follow', 'accepted'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'follow', 'accepted'),

-- Emma Wong's connections
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'follow', 'accepted'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'friend', 'accepted'),

-- David Kim's connections
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'friend', 'accepted'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'follow', 'accepted');

-- =====================================================
-- 5. SAVED ITEMS (User's Plate)
-- =====================================================

INSERT INTO saved_items (
    user_id, restaurant_id, saved_type, notes, tags, priority, user_rating, visit_date
) VALUES 
-- Alex Chen's saved items
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'favorite', 'Best omakase in the city!', '["sushi", "date-night", "special-occasion"]'::jsonb, 5, 4.9, '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'want_to_try', 'Heard they have amazing carbonara', '["italian", "pasta"]'::jsonb, 4, null, null),

-- Sarah Martinez's saved items
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'favorite', 'Love their butter chicken!', '["indian", "spicy", "comfort-food"]'::jsonb, 5, 4.8, '2024-01-20'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'want_to_try', 'Need to try their salmon roll', '["sushi", "weekend"]'::jsonb, 3, null, null),

-- Emma Wong's saved items
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 'favorite', 'Amazing vegetarian options!', '["vegetarian", "healthy", "flavorful"]'::jsonb, 5, 4.7, '2024-01-18');

-- =====================================================
-- 6. SAMPLE POSTS
-- =====================================================

INSERT INTO posts (
    id, user_id, restaurant_id, content, post_type, rating, images, likes_count, comments_count
) VALUES 
(
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'Just had the most incredible omakase experience at Sakura Sushi Bar! 🍣 The chef''s attention to detail was amazing, and every piece was perfectly crafted. Definitely coming back!',
    'review',
    4.9,
    '["https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600", "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600"]'::jsonb,
    24, 5
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440003',
    'Spice Route never disappoints! 🌶️ Their butter chicken is pure comfort in a bowl. Perfect for this rainy San Francisco evening.',
    'review',
    4.8,
    '["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600"]'::jsonb,
    18, 3
),
(
    '770e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    null,
    'Sunday meal prep complete! 🥗 This week''s theme: Mediterranean flavors with lots of fresh herbs and roasted vegetables. Nothing beats eating the rainbow!',
    'photo',
    null,
    '["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600"]'::jsonb,
    32, 7
);

-- =====================================================
-- 7. SAMPLE PHOTOS
-- =====================================================

INSERT INTO photos (
    id, user_id, post_id, restaurant_id, url, caption, photo_type, likes_count
) VALUES 
(
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600',
    'Omakase perfection 🍣',
    'food',
    15
),
(
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440003',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
    'Butter chicken heaven 🌶️',
    'food',
    12
);

-- =====================================================
-- 8. SAMPLE ACHIEVEMENTS
-- =====================================================

INSERT INTO achievements (
    id, name, description, achievement_type, requirement_count, points_reward
) VALUES 
(
    '990e8400-e29b-41d4-a716-446655440001',
    'First Bite',
    'Welcome to FUZO! Post your first restaurant review.',
    'posts', 1, 100
),
(
    '990e8400-e29b-41d4-a716-446655440002',
    'Social Butterfly',
    'Connect with 10 fellow food lovers.',
    'friends', 10, 250
),
(
    '990e8400-e29b-41d4-a716-446655440003',
    'Photo Pro',
    'Share 25 mouth-watering food photos.',
    'photos', 25, 500
),
(
    '990e8400-e29b-41d4-a716-446655440004',
    'Explorer',
    'Save 50 restaurants to your plate.',
    'saves', 50, 750
),
(
    '990e8400-e29b-41d4-a716-446655440005',
    'Streak Master',
    'Maintain a 30-day activity streak.',
    'streak', 30, 1000
);

-- =====================================================
-- 9. USER ACHIEVEMENTS (Progress)
-- =====================================================

INSERT INTO user_achievements (
    user_id, achievement_id, current_progress, is_completed, completed_at
) VALUES 
-- Alex Chen achievements
('550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 1, true, '2024-01-10'),
('550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', 8, false, null),
('550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440003', 15, false, null),

-- Sarah Martinez achievements
('550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 1, true, '2024-01-12'),
('550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', 6, false, null),

-- Emma Wong achievements
('550e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440001', 1, true, '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440003', 25, true, '2024-01-25');

-- =====================================================
-- 10. SAMPLE CONVERSATIONS
-- =====================================================

INSERT INTO conversations (
    id, name, conversation_type, created_by, participant_count, message_count
) VALUES 
(
    'aa0e8400-e29b-41d4-a716-446655440001',
    null,
    'direct',
    '550e8400-e29b-41d4-a716-446655440001',
    2, 12
),
(
    'aa0e8400-e29b-41d4-a716-446655440002',
    'Foodie Squad',
    'group',
    '550e8400-e29b-41d4-a716-446655440002',
    4, 28
);

-- =====================================================
-- 11. CONVERSATION PARTICIPANTS
-- =====================================================

INSERT INTO conversation_participants (
    conversation_id, user_id, role, unread_count
) VALUES 
-- Direct conversation between Alex and Sarah
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'member', 0),
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'member', 2),

-- Group conversation
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'admin', 0),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'member', 1),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'member', 1),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'member', 0);

-- =====================================================
-- 12. SAMPLE MESSAGES
-- =====================================================

INSERT INTO messages (
    id, conversation_id, sender_id, content, message_type, created_at
) VALUES 
(
    'bb0e8400-e29b-41d4-a716-446655440001',
    'aa0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Hey Sarah! Just tried that ramen place you recommended. It was amazing! 🍜',
    'text',
    NOW() - INTERVAL '2 hours'
),
(
    'bb0e8400-e29b-41d4-a716-446655440002',
    'aa0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'I knew you''d love it! Did you try their tonkotsu broth?',
    'text',
    NOW() - INTERVAL '1 hour 30 minutes'
),
(
    'bb0e8400-e29b-41d4-a716-446655440003',
    'aa0e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'Who''s up for dinner this weekend? I found a new Ethiopian place!',
    'text',
    NOW() - INTERVAL '45 minutes'
);

-- =====================================================
-- 13. SAMPLE ACTIVITY LOGS
-- =====================================================

INSERT INTO activity_logs (
    user_id, activity_type, description, restaurant_id, post_id, points_earned
) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'restaurant_review', 'Posted review for Sakura Sushi Bar', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 50),
('550e8400-e29b-41d4-a716-446655440001', 'photo_upload', 'Uploaded food photo', null, '770e8400-e29b-41d4-a716-446655440001', 25),
('550e8400-e29b-41d4-a716-446655440002', 'restaurant_save', 'Saved restaurant to plate', '660e8400-e29b-41d4-a716-446655440003', null, 10),
('550e8400-e29b-41d4-a716-446655440004', 'friend_connect', 'Connected with new friend', null, null, 20),
('550e8400-e29b-41d4-a716-446655440005', 'achievement_earned', 'Earned First Bite achievement', null, null, 100);

-- Update user counters to match actual data
UPDATE users SET 
    posts_count = (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id),
    photos_count = (SELECT COUNT(*) FROM photos WHERE photos.user_id = users.id),
    saved_items_count = (SELECT COUNT(*) FROM saved_items WHERE saved_items.user_id = users.id);

-- Update restaurant stats
UPDATE restaurants SET 
    save_count = (SELECT COUNT(*) FROM saved_items WHERE saved_items.restaurant_id = restaurants.id),
    review_count = (SELECT COUNT(*) FROM posts WHERE posts.restaurant_id = restaurants.id AND posts.post_type = 'review');

-- =====================================================
-- HELPFUL QUERIES FOR TESTING
-- =====================================================

-- View all users with their stats
/*
SELECT 
    username, 
    display_name, 
    location_city,
    posts_count,
    photos_count,
    saved_items_count,
    total_points,
    current_level
FROM users 
WHERE is_master_bot = false
ORDER BY total_points DESC;
*/

-- View user relationships
/*
SELECT 
    u1.username as follower,
    u2.username as following,
    ur.relationship_type,
    ur.status
FROM user_relationships ur
JOIN users u1 ON ur.follower_id = u1.id
JOIN users u2 ON ur.following_id = u2.id
ORDER BY ur.created_at DESC;
*/

-- View posts with user and restaurant info
/*
SELECT 
    p.content,
    u.username,
    r.name as restaurant_name,
    p.post_type,
    p.rating,
    p.likes_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN restaurants r ON p.restaurant_id = r.id
ORDER BY p.created_at DESC;
*/