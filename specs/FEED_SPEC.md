# Feed Page Specification

## Overview
The Feed page is the main discovery interface where users browse AI-curated food recommendations, restaurants, and trending food content.

## Core Functions

### 1. Content Display
- **Feed Posts**: Display curated food recommendations in a scrollable feed
- **Post Types**: Restaurants, recipes, videos, trending items
- **Infinite Scroll**: Load more content as user scrolls
- **Post Cards**: Show image, title, subtitle, location, rating, price range

### 2. User Interactions
- **Save to Plate**: One-click save functionality for any post
- **Like/Unlike**: Heart icon to like posts
- **Share**: Share posts via social media or copy link
- **View Details**: Click to see full restaurant/item details

### 3. Filtering & Sorting
- **Category Filter**: Filter by food type (pizza, sushi, burgers, etc.)
- **Location Filter**: Filter by distance or neighborhood
- **Price Filter**: Filter by price range ($, $$, $$$, $$$$)
- **Sort Options**: Trending, newest, highest rated, closest

### 4. Search
- **Search Bar**: Search for specific restaurants, cuisines, or dishes
- **Auto-suggestions**: Show suggestions as user types
- **Recent Searches**: Display recent search history

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks (useState, useEffect)
- **Icons**: Lucide React

### Backend
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

### External APIs
- **Google Places API**: Restaurant data and photos
- **Spoonacular API**: Recipe data and images
- **OpenAI API**: AI content curation

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_key
OPENAI_API_KEY=your_openai_key

# Optional
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=true
NEXT_PUBLIC_ENABLE_MASTER_BOTS=true
```

## Database Schema

### Tables
- `master_bot_posts` - AI-generated feed content
- `saved_items` - User's saved posts
- `user_likes` - User likes for posts
- `search_history` - User search history

### Key Fields
```sql
master_bot_posts:
- id (uuid, primary key)
- title (text)
- subtitle (text)
- image_url (text)
- item_type (enum: restaurant, recipe, video)
- item_id (text)
- location (jsonb)
- price_range (text)
- rating (decimal)
- created_at (timestamp)
- updated_at (timestamp)

saved_items:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- item_id (text)
- item_type (enum)
- source (text)
- created_at (timestamp)
```

## API Endpoints

### GET /api/feed
- **Purpose**: Fetch feed posts
- **Query Params**: 
  - `page` (number): Page number for pagination
  - `limit` (number): Posts per page
  - `category` (string): Filter by category
  - `location` (string): Filter by location
  - `price_range` (string): Filter by price
- **Response**: Array of feed posts with metadata

### POST /api/save-to-plate
- **Purpose**: Save item to user's plate
- **Body**: `{ itemId, itemType }`
- **Response**: Success/error status

### POST /api/like-post
- **Purpose**: Like/unlike a post
- **Body**: `{ postId, action }`
- **Response**: Updated like count

## UI Components

### Required Components
- `FeedCard` - Individual post card component
- `FeedGrid` - Grid layout for posts
- `FilterBar` - Filter and sort controls
- `SearchBar` - Search input with suggestions
- `InfiniteScroll` - Load more functionality
- `PostActions` - Like, save, share buttons

### Layout Structure
```
FeedPage
├── SearchBar
├── FilterBar
├── FeedGrid
│   └── FeedCard (repeated)
└── InfiniteScroll
```

## Performance Requirements

- **Initial Load**: < 2 seconds
- **Scroll Performance**: 60fps
- **Image Loading**: Lazy loading with placeholder
- **API Response**: < 500ms for feed data
- **Cache**: 5-minute cache for feed data

## Success Metrics

- **Engagement**: Average time spent on page
- **Interactions**: Save rate, like rate, share rate
- **Performance**: Page load time, scroll performance
- **Content**: Feed refresh rate, content diversity

## Constraints

- **No Real-time Updates**: Feed updates every 5 minutes
- **No Comments**: Comments not included in MVP
- **No User Posts**: Only curated content, no user-generated posts
- **Mobile First**: Responsive design required
- **Offline Support**: Basic offline viewing of cached content

## Future Enhancements (Not in MVP)

- Real-time notifications
- User-generated content
- Advanced AI recommendations
- Social features (following, friends)
- Video autoplay
- AR food preview
