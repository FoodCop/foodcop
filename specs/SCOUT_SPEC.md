# Scout Page Specification

## Overview
The Scout page provides an interactive map interface for discovering nearby restaurants, food trucks, and dining options with route planning and real-time location services.

## Core Functions

### 1. Map Display
- **Interactive Map**: Google Maps integration with custom styling
- **Restaurant Markers**: Show restaurants as clickable markers
- **Map Controls**: Zoom, pan, satellite/street view toggle
- **Location Services**: Get user's current location
- **Map Clustering**: Group nearby restaurants for better performance

### 2. Restaurant Discovery
- **Nearby Search**: Find restaurants within specified radius
- **Category Filter**: Filter by cuisine type, price range, rating
- **Real-time Data**: Live restaurant hours, availability, wait times
- **Restaurant Details**: Photos, menu, reviews, contact info

### 3. Route Planning
- **Directions**: Get walking/driving directions to selected restaurant
- **Multi-stop Routes**: Plan routes visiting multiple locations
- **Route Optimization**: Optimize route for multiple stops
- **Transportation Options**: Walking, driving, public transit

### 4. Search & Filter
- **Location Search**: Search by address, neighborhood, landmark
- **Cuisine Search**: Search by specific cuisine types
- **Advanced Filters**: Price, rating, distance, open now
- **Saved Searches**: Save frequently used search criteria

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Maps**: Google Maps JavaScript API
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks + Context API
- **Icons**: Lucide React

### Backend
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Caching**: Redis (optional)

### External APIs
- **Google Maps API**: Maps, places, directions
- **Google Places API**: Restaurant data and photos
- **Foursquare API**: Additional restaurant data (optional)

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Optional
FOURSQUARE_API_KEY=your_foursquare_key
REDIS_URL=your_redis_url
```

## Database Schema

### Tables
- `restaurants` - Restaurant data
- `user_routes` - Saved user routes
- `search_history` - User search history
- `restaurant_reviews` - User reviews

### Key Fields
```sql
restaurants:
- id (uuid, primary key)
- name (text)
- address (text)
- latitude (decimal)
- longitude (decimal)
- cuisine_type (text)
- price_range (text)
- rating (decimal)
- phone (text)
- website (text)
- hours (jsonb)
- photos (text[])
- google_place_id (text)

user_routes:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- name (text)
- stops (jsonb)
- created_at (timestamp)
```

## API Endpoints

### GET /api/restaurants/nearby
- **Purpose**: Find restaurants near location
- **Query Params**:
  - `lat` (number): Latitude
  - `lng` (number): Longitude
  - `radius` (number): Search radius in meters
  - `cuisine` (string): Cuisine type filter
  - `price_range` (string): Price range filter
- **Response**: Array of restaurant objects

### GET /api/restaurants/search
- **Purpose**: Search restaurants by query
- **Query Params**:
  - `query` (string): Search query
  - `location` (string): Search location
- **Response**: Array of matching restaurants

### POST /api/routes/save
- **Purpose**: Save user route
- **Body**: `{ name, stops }`
- **Response**: Saved route object

### GET /api/directions
- **Purpose**: Get directions between points
- **Query Params**:
  - `origin` (string): Starting point
  - `destination` (string): End point
  - `mode` (string): travel mode (walking, driving, transit)
- **Response**: Directions data

## UI Components

### Required Components
- `MapContainer` - Main map wrapper
- `RestaurantMarker` - Individual restaurant marker
- `RestaurantCard` - Restaurant info card
- `SearchBar` - Location/cuisine search
- `FilterPanel` - Filter controls
- `RoutePanel` - Route planning interface
- `DirectionsList` - Step-by-step directions

### Layout Structure
```
ScoutPage
├── SearchBar
├── FilterPanel
├── MapContainer
│   ├── RestaurantMarkers
│   └── UserLocationMarker
├── RestaurantCard (overlay)
└── RoutePanel
    └── DirectionsList
```

## Performance Requirements

- **Map Load**: < 3 seconds
- **Marker Rendering**: < 1 second for 100+ markers
- **Search Response**: < 500ms
- **Directions**: < 2 seconds
- **Mobile Performance**: Smooth pan/zoom on mobile

## Success Metrics

- **Usage**: Time spent on map, interactions per session
- **Discovery**: Restaurants viewed, routes planned
- **Engagement**: Directions used, restaurants saved
- **Performance**: Map load time, search response time

## Constraints

- **Google Maps Only**: No alternative map providers
- **No Real-time Tracking**: No live user tracking
- **Limited Clustering**: Max 50 markers visible at once
- **Mobile First**: Touch-optimized interface required
- **Offline Limited**: Basic offline map viewing only

## Map Features

### Required Features
- Street and satellite view
- Zoom controls (1-20)
- Pan and drag
- Marker clustering
- Info windows
- Custom map styling

### Optional Features
- Traffic layer
- Transit layer
- Street View integration
- 3D buildings
- Custom markers

## Route Planning

### Basic Routes
- Single destination
- Walking directions
- Driving directions
- Distance and time estimates

### Advanced Routes
- Multiple stops
- Route optimization
- Alternative routes
- Real-time traffic

## Future Enhancements (Not in MVP)

- Live restaurant wait times
- Real-time user location sharing
- Group route planning
- AR navigation
- Restaurant reservations
- Live traffic updates
- Public transit integration
