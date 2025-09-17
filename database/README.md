# FUZO Database Schema

This directory contains the complete SQL database schema for the FUZO food discovery app, including user profiles, social features, saved items (plate), posts, photos, chats, and gamification systems.

## Overview

The FUZO database is designed to support a comprehensive social food discovery platform with the following core features:

- **User Profiles**: Complete user management with preferences, stats, and social connections
- **Social Features**: Friends, followers, posts, comments, likes, and messaging
- **Restaurant Data**: Comprehensive restaurant information with ratings and reviews
- **Saved Items (Plate)**: Personal collections of restaurants and experiences
- **Content Sharing**: Posts, photos, and reviews with social interactions
- **Messaging**: Direct and group conversations with file sharing
- **Gamification**: Points, levels, achievements, and rewards system
- **Master Bots**: AI-powered food experts and assistants

## Files

### `schema.sql`
The main database schema file containing all table definitions, indexes, triggers, and Row Level Security (RLS) policies.

**Key Tables:**
- `users` - User profiles and account information
- `user_relationships` - Friends and following connections
- `restaurants` - Restaurant data with location and details
- `saved_items` - User's personal restaurant collections (their "plate")
- `posts` - User-generated content (reviews, photos, check-ins)
- `photos` - Media content with metadata
- `conversations` & `messages` - Chat system
- `likes` & `comments` - Social interactions
- `achievements` & `user_achievements` - Gamification system
- `notifications` - User notifications
- `master_bots` - AI character configurations
- `activity_logs` - User activity tracking

### `seed_data.sql`
Sample data to populate the database with realistic test content including:

- 5 template users with diverse profiles and preferences
- 3 Master Bot AI characters (Tako, Chef Sophia, Street Food Samurai)
- Sample restaurants with ratings and cuisine types
- User relationships and social connections
- Sample posts, photos, and interactions
- Achievement system with progress tracking
- Chat conversations and messages

### `database_utils.sql`
Helper functions and procedures for common database operations:

- User management (creation, onboarding, profile updates)
- Social functions (friend requests, relationships)
- Content creation (posts, reviews, saves)
- Search functionality (users, restaurants)
- Recommendation engine
- Analytics and reporting
- Maintenance utilities

## Setup Instructions

### 1. Prerequisites
- PostgreSQL 14+ with PostGIS extension
- Supabase project (recommended) or local PostgreSQL instance

### 2. Database Setup

```sql
-- 1. Create the database schema
\i schema.sql

-- 2. Populate with sample data
\i seed_data.sql

-- 3. Load utility functions
\i database_utils.sql
```

### 3. Supabase Setup

If using Supabase:

1. Create a new Supabase project
2. Go to the SQL Editor
3. Run the schema.sql file
4. Run the seed_data.sql file
5. Run the database_utils.sql file
6. Configure Row Level Security policies as needed

## Key Features

### User System
- **Comprehensive Profiles**: Display name, bio, avatar, location, dietary preferences
- **Gamification**: Points, levels, experience tracking, achievement system
- **Social Stats**: Followers, friends, posts count, activity tracking
- **Privacy Controls**: Private/public profiles, visibility settings

### Social Features
- **Relationships**: Friends, followers, blocking system
- **Content Sharing**: Posts, photos, reviews with rich media
- **Interactions**: Likes, comments, shares with notification system
- **Messaging**: Direct and group conversations with file sharing

### Restaurant Data
- **Rich Information**: Name, location, cuisine, price level, hours
- **User Generated Content**: Reviews, ratings, photos
- **Spatial Queries**: Location-based search with PostGIS
- **Social Validation**: Save counts, review aggregation

### Saved Items (Plate)
- **Personal Collections**: Want to try, favorites, visited, wishlists
- **Rich Metadata**: Notes, tags, priority levels, visit history
- **Social Sharing**: Share saved items and collections
- **Smart Organization**: Auto-categorization and filtering

### Messaging System
- **Real-time Chat**: Direct and group conversations
- **Rich Content**: Text, images, files, location sharing
- **Restaurant Sharing**: Send restaurant recommendations in chat
- **Read Status**: Message delivery and read tracking

### Gamification
- **Points System**: Earn points for various activities
- **Levels**: Progressive user levels based on experience
- **Achievements**: Unlockable badges for milestones
- **Social Competition**: Leaderboards and friend comparisons

## Usage Examples

### Create a New User
```sql
SELECT create_user_profile(
    'user@example.com',
    'username',
    'Display Name',
    'First',
    'Last',
    'https://example.com/avatar.jpg'
);
```

### Save a Restaurant
```sql
SELECT save_restaurant_to_plate(
    'user-uuid',
    'restaurant-uuid',
    'want_to_try',
    'Heard they have amazing ramen!',
    '["ramen", "date-night"]'::jsonb,
    5
);
```

### Create a Post
```sql
SELECT create_user_post(
    'user-uuid',
    'restaurant-uuid',
    'Amazing experience at this sushi place! The omakase was incredible.',
    'review',
    '["https://example.com/photo1.jpg"]'::jsonb,
    4.8,
    '2024-01-15'
);
```

### Search Restaurants
```sql
SELECT * FROM search_restaurants(
    'italian pizza',
    37.7749,  -- user latitude
    -122.4194, -- user longitude
    25,        -- max distance in km
    10,        -- limit
    0          -- offset
);
```

### Get Recommendations
```sql
SELECT * FROM get_restaurant_recommendations(
    'user-uuid',
    10  -- limit
);
```

## Security

The schema includes Row Level Security (RLS) policies to ensure:
- Users can only access their own private data
- Public content is visible to all authenticated users
- Friend-only content respects relationship status
- Admin functions are properly protected

## Performance Considerations

### Indexes
The schema includes optimized indexes for:
- Text search using GIN indexes on tsvector columns
- Spatial queries using PostGIS GIST indexes
- Social queries on user relationships
- Timeline queries on created_at timestamps

### Scalability
- Partitioning strategies for large tables (activity_logs, messages)
- Proper foreign key constraints with cascading deletes
- Efficient counter caching with triggers
- Optimized search functions with proper query planning

## Maintenance

### Regular Tasks
- Run `update_user_levels()` daily to update user progression
- Clean up old notifications and activity logs
- Update restaurant ratings from review aggregations
- Backup user-generated content and media

### Monitoring
- Track table sizes and growth rates
- Monitor slow queries and optimize as needed
- Watch for foreign key constraint violations
- Alert on unusual activity patterns

## Extension Points

The schema is designed to be extensible:
- Add new achievement types and requirements
- Extend user preferences with new fields
- Add restaurant metadata (menus, specials, events)
- Implement advanced recommendation algorithms
- Add business features (promotions, partnerships)

## Integration

This schema is designed to work with:
- Supabase for backend-as-a-service
- PostGIS for location-based queries
- Full-text search for content discovery
- Real-time subscriptions for live features
- External APIs (Google Places, etc.)

For questions or contributions, please refer to the main FUZO app documentation.