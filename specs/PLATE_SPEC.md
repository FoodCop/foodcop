# Plate Page Specification

## Overview
The Plate page serves as the user's personal collection hub, displaying all saved restaurants, recipes, videos, and routes in an organized, searchable interface.

## Core Functions

### 1. Collection Display
- **Saved Items Grid**: Display all saved items in a responsive grid
- **Item Categories**: Organize by type (restaurants, recipes, videos, routes)
- **Item Cards**: Show thumbnail, title, type, and quick actions
- **Infinite Scroll**: Load more items as user scrolls

### 2. Organization & Management
- **Custom Collections**: Create custom folders/categories
- **Drag & Drop**: Reorganize items between collections
- **Bulk Actions**: Select multiple items for batch operations
- **Search & Filter**: Find specific saved items quickly

### 3. Item Details
- **Quick Preview**: Hover/click for item details overlay
- **Full Details**: Click to view complete item information
- **Edit Notes**: Add personal notes to saved items
- **Share Items**: Share individual items or collections

### 4. Collection Actions
- **Create Collection**: Make new custom collections
- **Rename/Delete**: Manage collection names and deletion
- **Export**: Export collections as PDF or shareable links
- **Import**: Import items from other sources (future)

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks + Context API
- **Drag & Drop**: @dnd-kit/core
- **Icons**: Lucide React

### Backend
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

### External APIs
- **Google Places API**: Restaurant data refresh
- **Spoonacular API**: Recipe data refresh

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_key

# Optional
NEXT_PUBLIC_ENABLE_COLLECTIONS=true
NEXT_PUBLIC_ENABLE_EXPORT=true
```

## Database Schema

### Tables
- `saved_items` - User's saved items
- `collections` - Custom user collections
- `collection_items` - Items within collections
- `item_notes` - User notes for items

### Key Fields
```sql
saved_items:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- item_id (text)
- item_type (enum: restaurant, recipe, video, route)
- title (text)
- description (text)
- image_url (text)
- source_url (text)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

collections:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- name (text)
- description (text)
- color (text)
- is_default (boolean)
- created_at (timestamp)

collection_items:
- id (uuid, primary key)
- collection_id (uuid, foreign key)
- saved_item_id (uuid, foreign key)
- position (integer)
- created_at (timestamp)
```

## API Endpoints

### GET /api/plate/items
- **Purpose**: Get user's saved items
- **Query Params**:
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `type` (string): Filter by item type
  - `collection_id` (uuid): Filter by collection
- **Response**: Array of saved items

### GET /api/plate/collections
- **Purpose**: Get user's collections
- **Response**: Array of collections with item counts

### POST /api/plate/collections
- **Purpose**: Create new collection
- **Body**: `{ name, description, color }`
- **Response**: Created collection object

### PUT /api/plate/collections/:id
- **Purpose**: Update collection
- **Body**: `{ name, description, color }`
- **Response**: Updated collection object

### DELETE /api/plate/collections/:id
- **Purpose**: Delete collection
- **Response**: Success status

### POST /api/plate/items/:id/notes
- **Purpose**: Add/update item notes
- **Body**: `{ notes }`
- **Response**: Updated item with notes

### DELETE /api/plate/items/:id
- **Purpose**: Remove item from plate
- **Response**: Success status

## UI Components

### Required Components
- `ItemCard` - Individual saved item display
- `ItemGrid` - Responsive grid layout
- `CollectionSidebar` - Collection navigation
- `ItemPreview` - Quick item details overlay
- `CollectionModal` - Create/edit collection modal
- `BulkActions` - Multi-select actions toolbar
- `SearchFilter` - Search and filter controls

### Layout Structure
```
PlatePage
├── CollectionSidebar
├── MainContent
│   ├── SearchFilter
│   ├── BulkActions (when selecting)
│   └── ItemGrid
│       └── ItemCard (repeated)
└── ItemPreview (overlay)
```

## Performance Requirements

- **Initial Load**: < 2 seconds
- **Item Display**: < 500ms for 50+ items
- **Search Response**: < 300ms
- **Drag & Drop**: Smooth 60fps animations
- **Mobile Performance**: Touch-optimized interactions

## Success Metrics

- **Usage**: Items saved, collections created
- **Engagement**: Time spent organizing, items viewed
- **Organization**: Collections created, items organized
- **Retention**: Items accessed after saving

## Constraints

- **No Cloud Sync**: Local storage only in MVP
- **Limited Collections**: Max 10 custom collections
- **No Sharing**: No collection sharing in MVP
- **Mobile First**: Touch-optimized interface
- **No Offline**: Requires internet connection

## Item Types

### Restaurants
- **Data**: Name, address, cuisine, rating, price
- **Actions**: View details, get directions, call
- **Metadata**: Last visited, notes, photos

### Recipes
- **Data**: Title, ingredients, instructions, prep time
- **Actions**: View full recipe, cook mode
- **Metadata**: Difficulty, servings, dietary info

### Videos
- **Data**: Title, creator, duration, thumbnail
- **Actions**: Play video, view creator
- **Metadata**: Watch history, notes

### Routes
- **Data**: Name, stops, distance, duration
- **Actions**: View on map, start navigation
- **Metadata**: Last used, notes

## Collection Features

### Default Collections
- **Favorites**: Most liked items
- **Recently Added**: Latest saved items
- **Restaurants**: All saved restaurants
- **Recipes**: All saved recipes
- **Videos**: All saved videos

### Custom Collections
- **Create**: User-defined collections
- **Organize**: Drag and drop items
- **Customize**: Name, description, color
- **Manage**: Rename, delete, reorder

## Future Enhancements (Not in MVP)

- Collection sharing
- Cloud sync across devices
- Import from other apps
- Export to PDF/print
- Collaborative collections
- Smart collections (auto-categorization)
- Collection templates
- Advanced search and filtering
