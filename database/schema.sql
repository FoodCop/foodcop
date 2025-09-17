-- FUZO Database Schema
-- Comprehensive schema for the FUZO food discovery app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- 1. USERS TABLE (Core Profile)
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Profile Information
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_photo_url TEXT,
    
    -- Personal Details
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100),
    
    -- Preferences & Settings
    dietary_preferences JSONB DEFAULT '[]'::jsonb, -- ["vegetarian", "gluten-free", etc.]
    cuisine_preferences JSONB DEFAULT '[]'::jsonb, -- ["italian", "japanese", etc.]
    spice_tolerance INTEGER DEFAULT 3 CHECK (spice_tolerance >= 1 AND spice_tolerance <= 5),
    price_range_preference INTEGER DEFAULT 2 CHECK (price_range_preference >= 1 AND price_range_preference <= 4),
    
    -- Gamification & Points
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    
    -- Social Stats
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    friends_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    photos_count INTEGER DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    saved_items_count INTEGER DEFAULT 0,
    
    -- Account Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_master_bot BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Search & Discovery
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(display_name, '') || ' ' || 
            COALESCE(username, '') || ' ' || 
            COALESCE(bio, '')
        )
    ) STORED
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_search_vector ON users USING GIN(search_vector);
CREATE INDEX idx_users_location ON users(location_city, location_state, location_country);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_seen_at ON users(last_seen_at);
CREATE INDEX idx_users_total_points ON users(total_points DESC);

-- =====================================================
-- 2. USER RELATIONSHIPS (Friends/Following)
-- =====================================================

CREATE TABLE user_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL DEFAULT 'follow' CHECK (relationship_type IN ('follow', 'friend', 'block')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_user_relationships_follower ON user_relationships(follower_id);
CREATE INDEX idx_user_relationships_following ON user_relationships(following_id);
CREATE INDEX idx_user_relationships_type_status ON user_relationships(relationship_type, status);

-- =====================================================
-- 3. RESTAURANTS & LOCATIONS
-- =====================================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    google_place_id VARCHAR(255) UNIQUE,
    yelp_id VARCHAR(255),
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    coordinates POINT, -- PostGIS point type for lat/lng
    
    -- Details
    cuisine_types JSONB DEFAULT '[]'::jsonb,
    price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
    phone VARCHAR(50),
    website TEXT,
    email VARCHAR(255),
    
    -- Hours & Status
    hours JSONB, -- Store opening hours in JSON format
    is_open BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Ratings & Stats
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    cover_image_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(name, '') || ' ' || 
            COALESCE(description, '') || ' ' || 
            COALESCE(address, '')
        )
    ) STORED
);

-- Spatial index for location queries
CREATE INDEX idx_restaurants_coordinates ON restaurants USING GIST(coordinates);
CREATE INDEX idx_restaurants_search_vector ON restaurants USING GIN(search_vector);
CREATE INDEX idx_restaurants_rating ON restaurants(rating DESC);
CREATE INDEX idx_restaurants_city_state ON restaurants(city, state);

-- =====================================================
-- 4. SAVED ITEMS (User's Plate)
-- =====================================================

CREATE TABLE saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    visited_with JSONB DEFAULT '[]'::jsonb, -- Array of user IDs
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, restaurant_id)
);

CREATE INDEX idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX idx_saved_items_restaurant_id ON saved_items(restaurant_id);
CREATE INDEX idx_saved_items_type ON saved_items(saved_type);
CREATE INDEX idx_saved_items_created_at ON saved_items(created_at DESC);

-- =====================================================
-- 5. POSTS & CONTENT
-- =====================================================

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    
    -- Content
    content TEXT,
    post_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'review', 'photo', 'check_in', 'recommendation')),
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    
    -- Rating & Experience (for reviews)
    rating DECIMAL(3,2),
    visit_date DATE,
    dish_names JSONB DEFAULT '[]'::jsonb,
    spent_amount DECIMAL(10,2),
    
    -- Social Stats
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    
    -- Visibility & Status
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(content, ''))
    ) STORED
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_restaurant_id ON posts(restaurant_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);

-- =====================================================
-- 6. PHOTOS
-- =====================================================

CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    
    -- Photo Details
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    alt_text TEXT,
    
    -- Photo Metadata
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type VARCHAR(50),
    
    -- Content Classification
    photo_type VARCHAR(20) DEFAULT 'food' CHECK (photo_type IN ('food', 'restaurant', 'ambiance', 'menu', 'receipt', 'selfie', 'group')),
    tags JSONB DEFAULT '[]'::jsonb,
    dish_names JSONB DEFAULT '[]'::jsonb,
    
    -- Social Stats
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Metadata
    taken_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_post_id ON photos(post_id);
CREATE INDEX idx_photos_restaurant_id ON photos(restaurant_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_photos_photo_type ON photos(photo_type);

-- =====================================================
-- 7. CONVERSATIONS & MESSAGES
-- =====================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Conversation Details
    name VARCHAR(255), -- For group chats
    conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group')),
    description TEXT,
    avatar_url TEXT,
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Stats
    message_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- =====================================================
-- 8. CONVERSATION PARTICIPANTS
-- =====================================================

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Participant Status
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'kicked', 'muted')),
    
    -- Read Status
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    
    -- Settings
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);

-- =====================================================
-- 9. MESSAGES
-- =====================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message Content
    content TEXT,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'restaurant_share', 'system')),
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Referenced Content
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Message Status
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_restaurant_id ON messages(restaurant_id);

-- =====================================================
-- 10. LIKES & REACTIONS
-- =====================================================

CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Target Content
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Reaction Details
    reaction_type VARCHAR(20) DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one target is set
    CONSTRAINT likes_single_target CHECK (
        (post_id IS NOT NULL)::int + 
        (photo_id IS NOT NULL)::int + 
        (message_id IS NOT NULL)::int = 1
    ),
    
    -- Unique constraint per user per target
    UNIQUE NULLS NOT DISTINCT (user_id, post_id),
    UNIQUE NULLS NOT DISTINCT (user_id, photo_id),
    UNIQUE NULLS NOT DISTINCT (user_id, message_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_photo_id ON likes(photo_id);
CREATE INDEX idx_likes_message_id ON likes(message_id);

-- =====================================================
-- 11. COMMENTS
-- =====================================================

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Comment Content
    content TEXT NOT NULL,
    
    -- Social Stats
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- =====================================================
-- 12. USER ACHIEVEMENTS & REWARDS
-- =====================================================

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Achievement Details
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_url TEXT,
    badge_url TEXT,
    
    -- Requirements
    achievement_type VARCHAR(30) NOT NULL CHECK (achievement_type IN ('posts', 'reviews', 'photos', 'friends', 'visits', 'saves', 'streak', 'special')),
    requirement_count INTEGER DEFAULT 1,
    points_reward INTEGER DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Progress
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(is_completed, completed_at DESC);

-- =====================================================
-- 13. NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('like', 'comment', 'follow', 'friend_request', 'message', 'achievement', 'system', 'recommendation')),
    
    -- Referenced Content
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Action Data (JSON for flexible data)
    action_data JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- 14. MASTER BOTS (AI Characters)
-- =====================================================

CREATE TABLE master_bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Links to users table
    
    -- Bot Personality
    bot_name VARCHAR(100) NOT NULL UNIQUE,
    personality_type VARCHAR(50) NOT NULL,
    specialties JSONB DEFAULT '[]'::jsonb,
    favorite_cuisines JSONB DEFAULT '[]'::jsonb,
    
    -- AI Configuration
    system_prompt TEXT NOT NULL,
    model_version VARCHAR(50) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    
    -- Bot Stats
    interactions_count INTEGER DEFAULT 0,
    recommendations_given INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_master_bots_bot_name ON master_bots(bot_name);
CREATE INDEX idx_master_bots_is_active ON master_bots(is_active);
CREATE INDEX idx_master_bots_is_featured ON master_bots(is_featured);

-- =====================================================
-- 15. ACTIVITY LOGS
-- =====================================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Referenced Objects
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    points_earned INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- User profile summary view
CREATE VIEW user_profiles AS
SELECT 
    u.*,
    COUNT(DISTINCT f1.id) FILTER (WHERE f1.relationship_type = 'friend' AND f1.status = 'accepted') as friends_count_actual,
    COUNT(DISTINCT f2.id) FILTER (WHERE f2.relationship_type = 'follow' AND f2.status = 'accepted') as followers_count_actual,
    COUNT(DISTINCT f3.id) FILTER (WHERE f3.relationship_type = 'follow' AND f3.status = 'accepted') as following_count_actual
FROM users u
LEFT JOIN user_relationships f1 ON (u.id = f1.follower_id OR u.id = f1.following_id)
LEFT JOIN user_relationships f2 ON u.id = f2.following_id
LEFT JOIN user_relationships f3 ON u.id = f3.follower_id
GROUP BY u.id;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_items_updated_at BEFORE UPDATE ON saved_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment/decrement counters
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'posts' THEN
            UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
        ELSIF TG_TABLE_NAME = 'photos' THEN
            UPDATE users SET photos_count = photos_count + 1 WHERE id = NEW.user_id;
        ELSIF TG_TABLE_NAME = 'saved_items' THEN
            UPDATE users SET saved_items_count = saved_items_count + 1 WHERE id = NEW.user_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'posts' THEN
            UPDATE users SET posts_count = posts_count - 1 WHERE id = OLD.user_id;
        ELSIF TG_TABLE_NAME = 'photos' THEN
            UPDATE users SET photos_count = photos_count - 1 WHERE id = OLD.user_id;
        ELSIF TG_TABLE_NAME = 'saved_items' THEN
            UPDATE users SET saved_items_count = saved_items_count - 1 WHERE id = OLD.user_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply counter triggers
CREATE TRIGGER update_user_posts_count AFTER INSERT OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION update_user_stats();
CREATE TRIGGER update_user_photos_count AFTER INSERT OR DELETE ON photos FOR EACH ROW EXECUTE FUNCTION update_user_stats();
CREATE TRIGGER update_user_saved_items_count AFTER INSERT OR DELETE ON saved_items FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (examples - adjust based on your auth system)
-- Users can see their own data and public profiles
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can manage their own saved items
CREATE POLICY "Users can manage own saved items" ON saved_items FOR ALL USING (auth.uid() = user_id);

-- Users can see public posts and posts from friends
CREATE POLICY "Users can view posts" ON posts FOR SELECT USING (
    visibility = 'public' OR 
    user_id = auth.uid() OR
    (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM user_relationships 
        WHERE follower_id = auth.uid() 
        AND following_id = posts.user_id 
        AND status = 'accepted'
    ))
);

-- Comments: Additional policies would be needed for full implementation
-- This is a starting framework that should be expanded based on specific requirements