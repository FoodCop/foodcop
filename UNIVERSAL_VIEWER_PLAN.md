# Universal Viewer Implementation Plan

## Executive Summary

**Goal**: Replace 10+ redundant viewer components with a **single unified Universal Viewer** that can display ANY media type (recipes, videos, photos, restaurants, posts, etc.) throughout the entire app.

**Key Benefits**:
- 🎯 **One Component**: Single `UnifiedContentRenderer` handles all media types
- 🎨 **Easier Styling**: Unified styling system instead of scattered styles
- 🔧 **Easier Maintenance**: Update once, works everywhere
- 📦 **Reduced Bundle Size**: Remove 10+ redundant components
- 🚀 **Better UX**: Consistent experience across all content types
- 🗺️ **Integrated Map**: Map functionality built into restaurant viewing

**Current State**: 
- 4 redundant recipe viewers
- 4 redundant video viewers  
- 2 redundant restaurant viewers
- Multiple styling approaches

**Target State**:
- 1 unified viewer component
- 1 unified data structure
- 1 styling system
- Accessible from anywhere via `useUniversalViewer()` hook

---

## Overview
Create a **single unified Universal Viewer** that can display ANY media type (recipes, videos, photos, restaurants, posts, etc.) throughout the entire app. Instead of having separate viewer components for each type, we'll have ONE component that receives formatted data and renders accordingly. This dramatically reduces component duplication, makes styling easier, and provides a consistent viewing experience.

## Current State Analysis

### ✅ What Exists
1. **UniversalViewer Component** (`src/components/ui/universal-viewer/UniversalViewer.tsx`)
   - Already implemented and working in Plate component
   - Currently uses separate viewer components (RecipeViewer, RestaurantViewer, etc.)
   - Has navigation controls and keyboard shortcuts

2. **Separate Viewer Components** (TO BE CONSOLIDATED):
   - `RecipeViewer.tsx` - Basic recipe display
   - `RestaurantViewer.tsx` - Restaurant info (map placeholder)
   - `PhotoViewer.tsx` - Photo display with zoom/rotate
   - `VideoViewer.tsx` - Video player with controls

3. **GoogleMapView Component** (`src/components/maps/GoogleMapView.tsx`)
   - Fully functional map component
   - Supports markers, routes, user location, clustering

4. **usePlateViewer Hook** (`src/hooks/usePlateViewer.tsx`)
   - Manages viewer state (currently scoped to Plate component)

### ❌ Redundant Components (TO BE REMOVED)

#### Recipe Viewers (4 redundant components):
1. ✅ `RecipeViewer` (universal-viewer) - Basic
2. ❌ `RecipeDetailDialog` (bites) - More detailed, has save/share
3. ❌ `RecipeDetailView` (bites) - Full page view
4. ❌ `RecipeModal` (bites) - Another modal variant

#### Video Viewers (4 redundant components):
1. ✅ `VideoViewer` (universal-viewer) - Custom video player
2. ❌ `VideoPlayerModal` (TrimsDesktop) - YouTube iframe
3. ❌ `VideoPlayerModal` (TrimsMobile) - Duplicate of desktop
4. ❌ Video dialog in `Trims.tsx` - Another YouTube iframe

#### Restaurant Viewers (2 redundant components):
1. ✅ `RestaurantViewer` (universal-viewer) - Basic
2. ❌ `RestaurantDetailDialog` (scout) - Full-featured with map integration

#### Photo Viewers:
1. ✅ `PhotoViewer` (universal-viewer) - Basic (keep as reference)

### ❌ Current Issues
1. **Component Duplication**: 10+ redundant viewer components across the app
2. **Inconsistent Styling**: Each viewer has its own styling approach
3. **Map Not Integrated**: RestaurantViewer has placeholder instead of actual map
4. **Scoped to Plate**: Viewer only accessible from Plate component
5. **No Unified Data Format**: Each viewer expects different data shapes
6. **Hard to Maintain**: Changes require updating multiple components

## Implementation Plan

### Phase 1: Design Unified Content Renderer Architecture 🏗️
**Goal**: Design a single component that renders any media type based on formatted data

**Tasks**:
1. **Create Unified Content Data Structure**
   - Design `UnifiedContentData` interface that can represent any media type
   - Include common fields: `type`, `title`, `description`, `media`, `metadata`
   - Support type-specific fields through `metadata` object
   - Location: `src/components/ui/universal-viewer/types.ts`

2. **Design Content Renderer Component**
   - Single component: `UnifiedContentRenderer.tsx`
   - Receives `UnifiedContentData` and renders based on `type`
   - Uses render functions for each section (hero, info, media, actions)
   - Supports theme/styling through props or context
   - Location: `src/components/ui/universal-viewer/UnifiedContentRenderer.tsx`

3. **Create Render Functions for Each Section**
   - `renderHero()` - Image/video/photo display
   - `renderInfo()` - Title, description, metadata
   - `renderMedia()` - Type-specific media (map, video player, photo gallery)
   - `renderActions()` - Save, share, like buttons
   - `renderTabs()` - Tabbed content (info, map, photos, etc.)

**Files to Create**:
- `src/components/ui/universal-viewer/UnifiedContentRenderer.tsx`
- `src/components/ui/universal-viewer/renderers/` (directory for render functions)

**Files to Modify**:
- `src/components/ui/universal-viewer/types.ts` (add UnifiedContentData)

**Expected Outcome**:
- Clear architecture for unified rendering
- Data structure that supports all media types
- Foundation for replacing all separate viewers

---

### Phase 2: Create Global Universal Viewer Context 🌐
**Goal**: Make Universal Viewer accessible from anywhere in the app

**Tasks**:
1. **Create UniversalViewerContext**
   - Location: `src/contexts/UniversalViewerContext.tsx`
   - Provides: `viewerState`, `openViewer`, `closeViewer`, `navigateViewer`
   - Accepts `UnifiedContentData` or any raw data (with auto-transformation)

2. **Create useUniversalViewer Hook**
   - Location: `src/hooks/useUniversalViewer.tsx`
   - Wraps context for easy access
   - Includes helper methods: `openRecipe()`, `openVideo()`, `openRestaurant()`, etc.
   - Auto-transforms raw data to `UnifiedContentData`

3. **Create Data Transformers**
   - `transformRecipeToUnified()` - Recipe → UnifiedContentData
   - `transformVideoToUnified()` - Video → UnifiedContentData
   - `transformRestaurantToUnified()` - Restaurant → UnifiedContentData
   - `transformPhotoToUnified()` - Photo → UnifiedContentData
   - `transformPostToUnified()` - Post → UnifiedContentData
   - Location: `src/utils/unifiedContentTransformers.ts`

4. **Add Provider to App Root**
   - Wrap main app with `UniversalViewerProvider`
   - Add single `UniversalViewer` instance at app level
   - Renders `UnifiedContentRenderer` based on state

**Files to Create**:
- `src/contexts/UniversalViewerContext.tsx`
- `src/hooks/useUniversalViewer.tsx`
- `src/utils/unifiedContentTransformers.ts`

**Files to Modify**:
- `src/App.tsx` or main entry point
- `src/components/ui/universal-viewer/UniversalViewer.tsx` (use UnifiedContentRenderer)

**Expected Outcome**:
- Universal Viewer accessible from any component
- Single viewer instance manages all viewing
- Easy to open any content type: `openViewer(recipe)` or `openRecipe(recipeData)`

---

### Phase 3: Implement Unified Content Renderer 🎨
**Goal**: Build the single component that renders all media types

**Tasks**:
1. **Implement Base Renderer**
   - Create `UnifiedContentRenderer` component
   - Handle common layout (hero, info, tabs, actions)
   - Support responsive design

2. **Implement Type-Specific Rendering**
   - **Recipe**: Hero image, ingredients list, instructions, nutrition
   - **Video**: Video player (supports both file URLs and YouTube embeds)
   - **Restaurant**: Hero image, info cards, **integrated map**, photos gallery
   - **Photo**: Image viewer with zoom/rotate, metadata
   - **Post**: Text content, images, engagement metrics

3. **Integrate Map into Renderer**
   - Add map tab/section for restaurant type
   - Use `GoogleMapView` component
   - Show restaurant marker, user location, optional route

4. **Add Media Controls**
   - Video: Play/pause, volume, fullscreen, progress
   - Photo: Zoom, rotate, download
   - Map: Zoom, pan, route toggle

5. **Unified Styling System**
   - Create theme configuration
   - Use consistent spacing, colors, typography
   - Support dark/light mode
   - Make styling easily customizable

**Files to Create**:
- `src/components/ui/universal-viewer/UnifiedContentRenderer.tsx`
- `src/components/ui/universal-viewer/renderers/HeroRenderer.tsx`
- `src/components/ui/universal-viewer/renderers/MediaRenderer.tsx`
- `src/components/ui/universal-viewer/renderers/InfoRenderer.tsx`
- `src/components/ui/universal-viewer/renderers/ActionsRenderer.tsx`
- `src/components/ui/universal-viewer/renderers/MapRenderer.tsx` (for restaurants)

**Files to Modify**:
- `src/components/ui/universal-viewer/UniversalViewer.tsx` (use UnifiedContentRenderer)

**Expected Outcome**:
- Single component renders all media types
- Map integrated for restaurants
- Consistent styling across all content types
- Easy to add new media types in future

---

### Phase 4: Migrate All Components to Use Universal Viewer 🔄
**Goal**: Replace all redundant viewers with Universal Viewer

**Tasks**:
1. **Update Recipe Cards/Components**
   - `src/components/bites/components/RecipeDetailDialog.tsx` → Use Universal Viewer
   - `src/components/bites/components/RecipeDetailView.tsx` → Use Universal Viewer
   - `src/components/bites/components/RecipeModal.tsx` → Use Universal Viewer
   - All recipe cards: Use `useUniversalViewer().openRecipe()`

2. **Update Video Cards/Components**
   - `src/components/trims/components/Trims.tsx` → Use Universal Viewer
   - `src/components/trims/TrimsDesktop.tsx` → Remove VideoPlayerModal
   - `src/components/trims/TrimsMobile.tsx` → Remove VideoPlayerModal
   - All video cards: Use `useUniversalViewer().openVideo()`

3. **Update Restaurant Cards/Components**
   - `src/components/scout/components/RestaurantDetailDialog.tsx` → Use Universal Viewer
   - `src/components/scout/ScoutNew.tsx` → Use Universal Viewer
   - `src/components/scout/ScoutDesktop.tsx` → Use Universal Viewer
   - `src/components/tako/components/RestaurantCard.tsx` → Use Universal Viewer
   - `src/components/feed/components/feed/cards/RestaurantCard.tsx` → Use Universal Viewer
   - All restaurant cards: Use `useUniversalViewer().openRestaurant()`

4. **Update Photo Components**
   - All photo cards: Use `useUniversalViewer().openPhoto()`

5. **Update Post Components** (if applicable)
   - All post cards: Use `useUniversalViewer().openPost()`

**Migration Strategy**:
- Keep old components temporarily (comment out, don't delete)
- Update one component type at a time
- Test thoroughly before moving to next
- Once all migrated, delete old components

**Files to Delete** (after migration):
- `src/components/ui/universal-viewer/viewers/RecipeViewer.tsx`
- `src/components/ui/universal-viewer/viewers/RestaurantViewer.tsx`
- `src/components/ui/universal-viewer/viewers/PhotoViewer.tsx`
- `src/components/ui/universal-viewer/viewers/VideoViewer.tsx`
- `src/components/bites/components/RecipeDetailDialog.tsx`
- `src/components/bites/components/RecipeDetailView.tsx`
- `src/components/bites/components/RecipeModal.tsx`
- `src/components/scout/components/RestaurantDetailDialog.tsx`
- VideoPlayerModal functions in TrimsDesktop/TrimsMobile/Trims

**Files to Modify**:
- All card components across the app
- Replace local state/dialogs with `useUniversalViewer()` hook

**Expected Outcome**:
- All content opens in Universal Viewer
- No redundant viewer components
- Consistent experience everywhere
- Easier to maintain (one component to update)

---

### Phase 5: Enhance Features & Polish ✨
**Goal**: Add advanced features and ensure smooth experience

**Tasks**:
1. **Map Enhancements**
   - Route from user location to restaurant
   - Travel mode selector (driving, walking, cycling)
   - Nearby restaurants on map
   - Marker clustering for multiple locations

2. **Video Enhancements**
   - Support YouTube, Vimeo, direct file URLs
   - Playlist support
   - Quality selector
   - Captions/subtitles

3. **Photo Enhancements**
   - Gallery mode (swipe between photos)
   - Lightbox mode
   - Share functionality
   - Edit capabilities

4. **Performance Optimizations**
   - Lazy load media (images, videos, maps)
   - Virtual scrolling for long content
   - Memoization of render functions
   - Code splitting for large components

5. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - Focus management
   - ARIA labels

**Expected Outcome**:
- Rich, feature-complete viewer
- Fast and responsive
- Accessible to all users

---

### Phase 6: Testing & Documentation 🧪
**Goal**: Ensure everything works and document the system

**Tasks**:
1. **Comprehensive Testing**
   - Test all content types from all entry points
   - Test navigation (prev/next)
   - Test keyboard shortcuts
   - Test responsive design
   - Test performance with large datasets

2. **Documentation**
   - Document `UnifiedContentData` structure
   - Document `useUniversalViewer` hook API
   - Document how to add new content types
   - Create examples for each content type

3. **Migration Guide**
   - Document how to migrate from old viewers
   - Provide code examples
   - List breaking changes

**Expected Outcome**:
- Fully tested system
- Clear documentation
- Easy for developers to use and extend

---

## Technical Details

### Unified Data Structure

```typescript
// Single data structure for all content types
interface UnifiedContentData {
  type: 'recipe' | 'video' | 'photo' | 'restaurant' | 'post' | 'map';
  id: string;
  title: string;
  description?: string;
  
  // Media (varies by type)
  media: {
    // For recipes/photos: image URL
    image?: string;
    // For videos: video URL or YouTube ID
    video?: string;
    youtubeId?: string;
    // For restaurants: photos array
    photos?: string[];
    // For posts: content/images
    content?: string;
    images?: string[];
  };
  
  // Metadata (type-specific)
  metadata: {
    // Recipe metadata
    ingredients?: Array<{name: string; amount: string; unit?: string}>;
    instructions?: string[];
    nutrition?: {...};
    readyInMinutes?: number;
    servings?: number;
    
    // Restaurant metadata
    location?: {lat: number; lng: number};
    address?: string;
    rating?: number;
    priceLevel?: number;
    openingHours?: {...};
    
    // Video metadata
    duration?: number;
    channelName?: string;
    viewCount?: number;
    
    // Photo metadata
    visitDate?: string;
    restaurantName?: string;
    
    // Post metadata
    author?: string;
    likes?: number;
    comments?: number;
    
    // Common metadata
    tags?: string[];
    createdAt?: string;
    [key: string]: any; // Allow additional fields
  };
  
  // Actions
  actions?: {
    save?: () => void;
    share?: () => void;
    like?: () => void;
    delete?: () => void;
  };
}
```

### Data Flow
```
Any Content Card Click (Recipe/Video/Photo/Restaurant/Post)
  ↓
useUniversalViewer().openRecipe(data) / .openVideo(data) / etc.
  ↓
Auto-transform to UnifiedContentData
  ↓
UniversalViewerContext updates state
  ↓
UniversalViewer (at app root) renders
  ↓
UnifiedContentRenderer receives UnifiedContentData
  ↓
Renders based on type (recipe/video/photo/restaurant/post)
  ↓
Type-specific sections render (map for restaurants, video player for videos, etc.)
```

### Key Interfaces

```typescript
// Universal Viewer Context
interface UniversalViewerContextValue {
  viewerState: ViewerState;
  openViewer: (data: UnifiedContentData) => void;
  openRecipe: (recipe: Recipe | RecipeViewerData) => void;
  openVideo: (video: Video | VideoViewerData) => void;
  openRestaurant: (restaurant: Restaurant | RestaurantViewerData) => void;
  openPhoto: (photo: Photo | PhotoViewerData) => void;
  openPost: (post: Post) => void;
  closeViewer: () => void;
  navigateViewer: (direction: 'prev' | 'next') => void;
}

// Unified Content Renderer Props
interface UnifiedContentRendererProps {
  data: UnifiedContentData;
  theme?: 'light' | 'dark';
  onAction?: (action: string, data: any) => void;
}
```

### Component Structure
```
App Root
  ├── UniversalViewerProvider
  │   └── UniversalViewer (single instance)
  │       └── UnifiedContentRenderer
  │           ├── HeroRenderer (image/video/photo)
  │           ├── InfoRenderer (title, description, metadata)
  │           ├── MediaRenderer (type-specific: map, video player, gallery)
  │           ├── ActionsRenderer (save, share, like buttons)
  │           └── TabsRenderer (for tabbed content)
  └── All Pages
      ├── Plate
      ├── Scout
      ├── Tako
      ├── Bites
      ├── Trims
      └── Feed
          └── All Content Cards (use useUniversalViewer hook)
```

### Render Function Architecture

```typescript
// UnifiedContentRenderer uses render functions
const UnifiedContentRenderer = ({ data }: Props) => {
  return (
    <div className="unified-viewer">
      {renderHero(data)}
      {renderInfo(data)}
      {renderMedia(data)} // Type-specific: map, video, gallery
      {renderTabs(data)} // If tabs needed
      {renderActions(data)}
    </div>
  );
};

// Each render function handles type-specific logic
const renderMedia = (data: UnifiedContentData) => {
  switch (data.type) {
    case 'restaurant':
      return <MapRenderer location={data.metadata.location} />;
    case 'video':
      return <VideoPlayerRenderer video={data.media.video} />;
    case 'photo':
      return <PhotoViewerRenderer image={data.media.image} />;
    // ... etc
  }
};
```

---

## Implementation Order (Recommended)

1. **Phase 1** - Design unified architecture (foundation)
2. **Phase 2** - Create global context (enables app-wide access)
3. **Phase 3** - Build unified renderer (core functionality)
4. **Phase 4** - Migrate components (replace redundant viewers)
5. **Phase 5** - Enhance features (polish and improvements)
6. **Phase 6** - Testing & documentation (ensure quality)

---

## Success Criteria

### Core Functionality
✅ Single `UnifiedContentRenderer` component renders all media types
✅ Universal Viewer accessible from any component via `useUniversalViewer()` hook
✅ All content types supported: recipes, videos, photos, restaurants, posts
✅ Map integrated for restaurants (no placeholder)
✅ Consistent styling across all content types

### Code Quality
✅ No redundant viewer components (all removed)
✅ Single source of truth for content rendering
✅ Easy to add new content types
✅ Unified data structure (`UnifiedContentData`)
✅ Type-safe transformations

### User Experience
✅ Smooth transitions when opening viewer
✅ Keyboard navigation (ESC to close, arrows to navigate)
✅ Responsive design (mobile and desktop)
✅ Fast loading (lazy loading where appropriate)
✅ Consistent experience across all pages

### Developer Experience
✅ Simple API: `openRecipe()`, `openVideo()`, etc.
✅ Auto-transformation from raw data
✅ Easy to style (unified theme system)
✅ Well documented
✅ Easy to extend

---

## Redundant Components Inventory

### To Be Removed (After Migration):

#### Recipe Viewers:
- ❌ `src/components/bites/components/RecipeDetailDialog.tsx`
- ❌ `src/components/bites/components/RecipeDetailView.tsx`
- ❌ `src/components/bites/components/RecipeModal.tsx`
- ✅ `src/components/ui/universal-viewer/viewers/RecipeViewer.tsx` (replace with UnifiedContentRenderer)

#### Video Viewers:
- ❌ `VideoPlayerModal` function in `src/components/trims/TrimsDesktop.tsx`
- ❌ `VideoPlayerModal` function in `src/components/trims/TrimsMobile.tsx`
- ❌ Video dialog in `src/components/trims/components/Trims.tsx`
- ✅ `src/components/ui/universal-viewer/viewers/VideoViewer.tsx` (replace with UnifiedContentRenderer)

#### Restaurant Viewers:
- ❌ `src/components/scout/components/RestaurantDetailDialog.tsx`
- ✅ `src/components/ui/universal-viewer/viewers/RestaurantViewer.tsx` (replace with UnifiedContentRenderer)

#### Photo Viewers:
- ✅ `src/components/ui/universal-viewer/viewers/PhotoViewer.tsx` (replace with UnifiedContentRenderer)

### To Be Updated (Use Universal Viewer):

#### Recipe Cards:
- `src/components/bites/components/RecipeCard.tsx`
- All recipe cards in Plate, Feed, etc.

#### Video Cards:
- `src/components/trims/components/Trims.tsx`
- `src/components/trims/TrimsDesktop.tsx`
- `src/components/trims/TrimsMobile.tsx`
- All video cards in Plate, Feed, etc.

#### Restaurant Cards:
- `src/components/scout/ScoutNew.tsx`
- `src/components/scout/ScoutDesktop.tsx`
- `src/components/tako/components/RestaurantCard.tsx`
- `src/components/feed/components/feed/cards/RestaurantCard.tsx`
- `src/components/plate/PlateDesktop.tsx` (RestaurantCardComponent)
- `src/components/plate/PlateMobile.tsx` (RestaurantCardComponent)

#### Photo Cards:
- All photo cards in Plate, Feed, etc.

---

## Notes

- **Migration Strategy**: Keep old components temporarily (comment out) until migration is complete
- **Backward Compatibility**: Transformers handle different data shapes from various sources
- **Performance**: Lazy load heavy components (maps, videos) to avoid initial load bloat
- **Styling**: Use CSS variables for theming to make styling changes easy
- **Testing**: Test each content type thoroughly before moving to next
- **Documentation**: Document the `UnifiedContentData` structure clearly for future developers
- **Extensibility**: Design renderer to easily add new content types (e.g., "article", "event")

