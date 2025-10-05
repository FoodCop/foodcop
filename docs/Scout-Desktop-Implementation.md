# Scout Desktop Implementation Guide

## Overview
Implementation guide for creating a desktop-optimized Scout page with a compact sidebar layout, keeping all restaurant interactions contained within the sidebar without popups or modals.

## 🎯 Design Goals
- **Compact Sidebar Design**: All restaurant details contained within sidebar
- **No Popups/Modals**: Replace bottom sheets and detail modals with inline sidebar panels
- **Responsive Layout**: Desktop sidebar, mobile overlay/bottom sheet
- **Existing Functionality**: Preserve all save-to-plate and map interaction features

## 🏗️ Layout Architecture

### Desktop Layout (≥768px)
```
┌─────────────────────────────────────────────────────────┐
│                    Scout Desktop                        │
├───────────────┬─────────────────────────────────────────┤
│   Sidebar     │              Map Area                   │
│   (320px)     │                                         │
│               │                                         │
│ ┌───────────┐ │  ┌─────────────────────────────────────┐ │
│ │  Search   │ │  │                                     │ │
│ │  & Filter │ │  │        MapLibre Component           │ │
│ ├───────────┤ │  │                                     │ │
│ │Restaurant │ │  │     - Restaurant Markers            │ │
│ │   List    │ │  │     - User Location                 │ │
│ │           │ │  │     - Route Display                 │ │
│ │ ┌───────┐ │ │  │     - Map Controls                  │ │
│ │ │Detail │ │ │  │                                     │ │
│ │ │Panel  │ │ │  │                                     │ │
│ │ └───────┘ │ │  └─────────────────────────────────────┘ │
│ └───────────┘ │                                         │
└───────────────┴─────────────────────────────────────────┘
```

### Mobile Layout (<768px)
```
┌─────────────────────────────────────────────────────────┐
│                  Full Screen Map                        │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               MapLibre Component                    │ │
│  │                                                     │ │
│  │  [Search Button]                    [Location]     │ │
│  │                                                     │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Bottom Sheet/Overlay                   │ │
│  │                                                     │ │
│  │  Quick Filters | Restaurant Cards | Detail View    │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 📱 Component Architecture

### New Components to Create

#### 1. `DesktopScoutLayout.tsx`
```typescript
interface DesktopScoutLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}

// Responsive layout wrapper that switches between desktop sidebar and mobile overlay
```

#### 2. `ScoutSidebar.tsx`
```typescript
interface ScoutSidebarProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  loading: boolean;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onSaveRestaurant: (restaurant: Restaurant) => void;
  currentLocation: Location | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

// Main sidebar container with three sections:
// 1. Search & Location Status
// 2. Filter Controls (collapsible)
// 3. Restaurant List + Detail Panel
```

#### 3. `RestaurantListCompact.tsx`
```typescript
interface RestaurantListCompactProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onSaveRestaurant: (restaurant: Restaurant) => void;
  loading: boolean;
}

// Vertical scrolling list of compact restaurant cards
// Each card shows: name, rating, cuisine, distance, save button
// Click selects restaurant (shows in detail panel below)
```

#### 4. `RestaurantDetailPanel.tsx`
```typescript
interface RestaurantDetailPanelProps {
  restaurant: Restaurant | null;
  onSave: (restaurant: Restaurant) => void;
  onViewOnMap: (restaurant: Restaurant) => void;
  onClose: () => void;
}

// Inline detail panel that appears below restaurant list
// Shows: image, rating, address, hours, phone, website
// Actions: Save to Plate, View on Map, Get Directions
```

#### 5. `CompactFilterPanel.tsx`
```typescript
interface CompactFilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCuisine: string;
  selectedPriceRange: number[];
  sortBy: string;
  onCuisineChange: (cuisine: string) => void;
  onPriceChange: (prices: number[]) => void;
  onSortChange: (sort: string) => void;
}

// Collapsible filter section with compact controls
// Cuisine chips, price level buttons, sort dropdown
```

### Components to Adapt

#### 1. `RestaurantCard.tsx`
**Changes Needed:**
- Create new `compact` variant for sidebar list
- Smaller dimensions (full-width, ~80px height)
- Horizontal layout: image, info, actions
- Remove click-to-detail (use select/highlight instead)

```typescript
// Add new variant
variant?: "horizontal" | "grid" | "compact"

// Compact variant specs:
// - 100% width, 80px height
// - 60px square image
// - Single line name + rating
// - Cuisine chips (max 2)
// - Save heart icon
// - Selected state styling
```

#### 2. `MapView.tsx`
**Changes Needed:**
- Add restaurant selection highlighting
- Sync with sidebar selection state
- Enhanced click handling for sidebar integration

## 🎨 Design Specifications

### Sidebar Dimensions
- **Desktop Width**: 320px (fixed)
- **Mobile**: Full width overlay or bottom sheet
- **Header Height**: 120px (search + location status)
- **Filter Panel**: 140px when expanded
- **Restaurant List**: Remaining height with scroll
- **Detail Panel**: 300px when active

### Compact Restaurant Card
```
┌──────────────────────────────────────────────────────────┐
│ [IMG] Restaurant Name                    ⭐4.5 ❤️        │
│ [60px] Italian • $$ • 0.3 mi                           │
│       Open now                                          │
└──────────────────────────────────────────────────────────┘
```

### Detail Panel Layout
```
┌──────────────────────────────────────────────────────────┐
│                    Restaurant Image                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Restaurant Name                           [❤️ Save] │ │
│ │ ⭐⭐⭐⭐⭐ 4.5 (123 reviews) • $$            │ │
│ │ Italian, Pizza                                      │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ 📍 123 Main St, City, State                        │ │
│ │ 🕐 Open until 10 PM                                │ │
│ │ 📞 (555) 123-4567                                  │ │
│ │ 🌐 website.com                                     │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ [View on Map] [Get Directions] [Call]              │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## 🔄 State Management

### Sidebar State Structure
```typescript
interface SidebarState {
  // Search & Filter
  searchQuery: string;
  showFilters: boolean;
  selectedCuisine: string;
  selectedPriceRange: number[];
  sortBy: 'distance' | 'rating' | 'price';
  
  // Restaurant Selection
  selectedRestaurant: Restaurant | null;
  showDetailPanel: boolean;
  
  // Loading States
  loading: boolean;
  refreshingLocation: boolean;
}
```

### Selection Flow
1. User clicks restaurant card → `setSelectedRestaurant(restaurant)`
2. Detail panel slides down in sidebar → `setShowDetailPanel(true)`
3. Map highlights selected restaurant marker
4. User can save, view on map, or close detail panel

## 📋 Implementation Steps

### Phase 1: Layout Foundation
1. Create `DesktopScoutLayout` component
2. Create `ScoutSidebar` container
3. Set up responsive breakpoints
4. Basic sidebar structure with placeholder content

### Phase 2: Restaurant List
1. Create `RestaurantListCompact` component
2. Adapt `RestaurantCard` with compact variant
3. Implement selection state and highlighting
4. Add vertical scrolling with proper spacing

### Phase 3: Detail Panel
1. Create `RestaurantDetailPanel` component
2. Design slide-down animation for detail panel
3. Implement all restaurant details display
4. Add action buttons (save, directions, etc.)

### Phase 4: Filters & Search
1. Create `CompactFilterPanel` component
2. Implement collapsible filter section
3. Add search functionality
4. Location status display

### Phase 5: Map Integration
1. Sync sidebar selection with map markers
2. Implement map-to-sidebar communication
3. Add route display for selected restaurants
4. Map controls optimization for desktop

### Phase 6: Mobile Responsive
1. Convert sidebar to overlay for mobile
2. Implement bottom sheet for mobile restaurant list
3. Mobile-optimized detail views
4. Touch interactions and gestures

## 🎯 Key Implementation Details

### Restaurant Selection Logic
```typescript
const handleRestaurantSelect = (restaurant: Restaurant) => {
  setSelectedRestaurant(restaurant);
  setShowDetailPanel(true);
  
  // Highlight on map
  setSelectedMapRestaurant(restaurant);
  
  // Scroll restaurant into view if needed
  scrollToRestaurant(restaurant.id);
};
```

### Compact Card Click Handling
```typescript
// Remove onClick for detail sheet
// Add onClick for selection only
<RestaurantCard
  variant="compact"
  restaurant={restaurant}
  selected={selectedRestaurant?.id === restaurant.id}
  onClick={() => handleRestaurantSelect(restaurant)}
  onSave={() => handleSaveRestaurant(restaurant)}
/>
```

### Detail Panel Animation
```typescript
// Slide down animation using framer-motion
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ 
    height: showDetailPanel ? 300 : 0, 
    opacity: showDetailPanel ? 1 : 0 
  }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
  className="detail-panel"
>
  {selectedRestaurant && (
    <RestaurantDetailPanel
      restaurant={selectedRestaurant}
      onSave={handleSaveRestaurant}
      onViewOnMap={handleViewOnMap}
      onClose={() => setShowDetailPanel(false)}
    />
  )}
</motion.div>
```

## 🎨 CSS Structure

### Main Layout Classes
```css
.scout-desktop-layout {
  display: flex;
  height: 100vh;
}

.scout-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scout-map-area {
  flex: 1;
  position: relative;
}

.restaurant-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.restaurant-detail-panel {
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  overflow-y: auto;
}
```

### Compact Card Styling
```css
.restaurant-card-compact {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restaurant-card-compact:hover {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.restaurant-card-compact.selected {
  background: #fef3f2;
  border: 1px solid #f87171;
}
```

## 🔧 Technical Considerations

### Performance Optimizations
1. **Virtual Scrolling**: For large restaurant lists (>100 items)
2. **Image Lazy Loading**: Restaurant images load as they come into view
3. **Debounced Search**: 300ms delay on search input
4. **Memoized Components**: Prevent unnecessary re-renders

### Accessibility
1. **Keyboard Navigation**: Arrow keys to navigate restaurant list
2. **Screen Reader Support**: Proper ARIA labels for all interactive elements
3. **Focus Management**: Focus follows selection in list
4. **High Contrast**: Support for high contrast mode

### Mobile Considerations
1. **Touch Targets**: Minimum 44px tap targets on mobile
2. **Swipe Gestures**: Swipe to save/dismiss on mobile cards
3. **Bottom Sheet**: Native-feeling bottom sheet for mobile detail view
4. **Performance**: Optimized animations and reduced bundle size for mobile

## 📦 File Structure

```
components/scout/
├── desktop/
│   ├── DesktopScoutLayout.tsx
│   ├── ScoutSidebar.tsx
│   ├── RestaurantListCompact.tsx
│   ├── RestaurantDetailPanel.tsx
│   └── CompactFilterPanel.tsx
├── mobile/
│   ├── MobileScoutOverlay.tsx
│   └── MobileBottomSheet.tsx
├── shared/
│   ├── RestaurantCard.tsx (updated with compact variant)
│   ├── MapView.tsx (updated with selection sync)
│   └── LocationStatus.tsx
└── ScoutPageDesktop.tsx (main page component)

styles/scout/
├── desktop-layout.css
├── compact-cards.css
├── detail-panel.css
└── responsive.css
```

This implementation keeps everything contained within the sidebar, eliminates popups/modals, and maintains a compact, efficient design while preserving all existing functionality.