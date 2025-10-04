# Bites Page Specification

## Overview
The Bites page showcases short-form food videos, cooking tutorials, and food-related content in a TikTok-style vertical video feed optimized for mobile consumption.

## Core Functions

### 1. Video Display
- **Vertical Video Feed**: Full-screen vertical videos optimized for mobile
- **Auto-play**: Videos play automatically when in view
- **Swipe Navigation**: Swipe up/down to navigate between videos
- **Video Controls**: Play/pause, volume, progress bar
- **Quality Selection**: Auto-adjust based on connection speed

### 2. Content Management
- **Video Categories**: Cooking, restaurants, food reviews, tutorials
- **Content Curation**: AI-curated and user-submitted videos
- **Video Metadata**: Title, description, creator, duration, views
- **Thumbnail Generation**: Auto-generated video thumbnails

### 3. User Interactions
- **Like/Unlike**: Heart button to like videos
- **Save to Plate**: Save interesting videos for later
- **Share**: Share videos via social media or copy link
- **Follow Creator**: Follow video creators
- **Comment**: View and add comments (read-only in MVP)

### 4. Search & Discovery
- **Search Bar**: Search videos by title, creator, or hashtags
- **Category Filter**: Filter by food type, cooking style, difficulty
- **Trending**: Show trending videos
- **For You**: Personalized video recommendations

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Video Player**: Custom video player or react-player
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks + Context API
- **Gestures**: Framer Motion for swipe gestures

### Backend
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage for videos
- **Authentication**: Supabase Auth

### External Services
- **Video Processing**: FFmpeg for video optimization
- **CDN**: Cloudflare or similar for video delivery
- **Analytics**: Custom analytics for video metrics

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Video Processing
FFMPEG_PATH=/usr/bin/ffmpeg
VIDEO_MAX_SIZE=50MB
VIDEO_MAX_DURATION=60

# CDN
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CDN_BASE_URL=your_cdn_url

# Analytics
ANALYTICS_API_KEY=your_analytics_key
```

## Database Schema

### Tables
- `videos` - Video content
- `video_likes` - User likes for videos
- `video_saves` - User saved videos
- `creators` - Video creators
- `video_comments` - Video comments

### Key Fields
```sql
videos:
- id (uuid, primary key)
- title (text)
- description (text)
- video_url (text)
- thumbnail_url (text)
- duration (integer)
- creator_id (uuid, foreign key)
- category (text)
- tags (text[])
- view_count (integer)
- like_count (integer)
- created_at (timestamp)

video_likes:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- video_id (uuid, foreign key)
- created_at (timestamp)

creators:
- id (uuid, primary key)
- name (text)
- avatar_url (text)
- follower_count (integer)
- verified (boolean)
```

## API Endpoints

### GET /api/videos/feed
- **Purpose**: Get video feed
- **Query Params**:
  - `page` (number): Page number
  - `limit` (number): Videos per page
  - `category` (string): Filter by category
- **Response**: Array of video objects

### GET /api/videos/trending
- **Purpose**: Get trending videos
- **Query Params**:
  - `limit` (number): Number of videos
- **Response**: Array of trending videos

### POST /api/videos/like
- **Purpose**: Like/unlike a video
- **Body**: `{ videoId, action }`
- **Response**: Updated like count

### POST /api/videos/save
- **Purpose**: Save video to plate
- **Body**: `{ videoId }`
- **Response**: Success status

### GET /api/videos/search
- **Purpose**: Search videos
- **Query Params**:
  - `query` (string): Search query
  - `category` (string): Filter by category
- **Response**: Array of matching videos

## UI Components

### Required Components
- `VideoPlayer` - Custom video player
- `VideoCard` - Individual video display
- `VideoFeed` - Scrollable video feed
- `VideoControls` - Play/pause, volume, progress
- `CreatorInfo` - Creator name, avatar, follow button
- `VideoActions` - Like, save, share buttons
- `SearchBar` - Video search input

### Layout Structure
```
BitesPage
├── SearchBar
├── VideoFeed
│   └── VideoCard (full screen)
│       ├── VideoPlayer
│       ├── VideoControls
│       ├── CreatorInfo
│       └── VideoActions
└── CategoryFilter
```

## Performance Requirements

- **Video Load**: < 2 seconds for first video
- **Swipe Response**: < 100ms for gesture recognition
- **Auto-play**: Seamless transition between videos
- **Memory Usage**: Efficient video memory management
- **Mobile Optimization**: Smooth 60fps scrolling

## Success Metrics

- **Engagement**: Average watch time, completion rate
- **Interactions**: Like rate, save rate, share rate
- **Discovery**: Videos viewed per session
- **Performance**: Video load time, smooth playback

## Constraints

- **Vertical Only**: No horizontal video support
- **Mobile First**: Desktop shows mobile layout
- **No Upload**: No user video upload in MVP
- **Limited Duration**: Max 60 seconds per video
- **No Live Streaming**: Pre-recorded videos only

## Video Specifications

### Format Requirements
- **Aspect Ratio**: 9:16 (vertical)
- **Resolution**: 1080x1920 minimum
- **Format**: MP4 (H.264)
- **Duration**: 15-60 seconds
- **File Size**: Max 50MB

### Quality Settings
- **Auto Quality**: Adjust based on connection
- **Quality Options**: 720p, 1080p
- **Compression**: Optimized for mobile

## Content Categories

### Primary Categories
- **Cooking Tutorials**: Step-by-step cooking guides
- **Restaurant Reviews**: Quick restaurant reviews
- **Food Hacks**: Quick cooking tips and tricks
- **Recipe Shorts**: Condensed recipe videos
- **Food Trends**: Trending food items and techniques

### Content Sources
- **Curated Content**: Hand-picked high-quality videos
- **Creator Submissions**: Verified creator content
- **AI Generated**: AI-created food content (future)

## Future Enhancements (Not in MVP)

- User video upload
- Live streaming
- Video comments and replies
- Creator monetization
- Video editing tools
- AR filters and effects
- Collaborative videos
- Video challenges and trends
