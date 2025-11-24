# Plate Page Universal Viewer Integration Plan

## Overview
The Plate page is the **primary testing ground** for the Universal Viewer. It displays all saved content types (recipes, restaurants, photos, videos) and needs to work seamlessly with the unified viewer system.

## Current State Analysis

### ✅ What's Working
1. **Plate Component** (`public/plate/components/Plate.tsx`)
   - Uses `usePlateViewer` hook (local hook)
   - Opens viewer for: photos, recipes, videos, restaurants
   - Has navigation between items
   - Has delete functionality

2. **Content Types in Plate**:
   - **Photos** - Tab: "Photos"
   - **Recipes** - Tab: "Recipes" 
   - **Videos** - Tab: "Videos"
   - **Restaurants** - Tab: "Places"
   - **Posts** - Tab: "Posts" (not using viewer currently)

3. **Current Flow**:
   ```
   SavedItem (from database)
     ↓
   transformSavedItemToViewerData() (old format)
     ↓
   usePlateViewer hook (local state)
     ↓
   UniversalViewer (renders old ViewerData format)
   ```

### ❌ Issues to Fix
1. **Using Old Hook**: Plate uses `usePlateViewer` instead of global `useUniversalViewer`
2. **Old Data Format**: Transforms to `ViewerData` instead of `UnifiedContentData`
3. **No Map Integration**: Restaurant viewer doesn't show map (placeholder)
4. **Inconsistent**: Different from rest of app (Bites, Trims now use global hook)
5. **Navigation**: Works but uses old format

## Implementation Plan

### Phase 1: Update Plate to Use Global Universal Viewer Hook 🔄
**Goal**: Migrate Plate from local `usePlateViewer` to global `useUniversalViewer`

**Tasks**:
1. **Replace usePlateViewer with useUniversalViewer**
   - Remove: `import { usePlateViewer } from '../../../hooks/usePlateViewer'`
   - Add: `import { useUniversalViewer } from '../../../contexts/UniversalViewerContext'`
   - Update hook usage: `const { openViewer, closeViewer, navigateViewer, viewerState } = useUniversalViewer()`

2. **Update openViewer calls**
   - Current: `openViewer(item, allItems, type)` (SavedItem format)
   - New: Transform SavedItem → UnifiedContentData first, then call `openViewer()`
   - Use `transformSavedItemToUnified()` helper

3. **Remove local UniversalViewer component**
   - Plate currently renders its own `<UniversalViewer>` instance
   - Remove it (already rendered at app root)
   - Keep viewer state from global hook

**Files to Modify**:
- `public/plate/components/Plate.tsx`

**Expected Outcome**:
- Plate uses global Universal Viewer
- Consistent with rest of app
- Single viewer instance at app root

---

### Phase 2: Create SavedItem to UnifiedContentData Transformer 🔄
**Goal**: Transform SavedItem directly to UnifiedContentData format

**Tasks**:
1. **Create transformSavedItemToUnified() function**
   - Location: `src/utils/unifiedContentTransformers.ts`
   - Converts SavedItem → UnifiedContentData
   - Handles all item types: recipe, restaurant, photo, video
   - Preserves savedItemId for delete functionality

2. **Update plateViewerTransform.ts** (optional)
   - Keep old functions for backward compatibility
   - Add new unified transformer
   - Or migrate old functions to use unified format

3. **Handle all metadata variations**
   - Recipe metadata (from Spoonacular)
   - Restaurant metadata (from Google Places)
   - Photo metadata (custom)
   - Video metadata (from YouTube)

**Files to Create/Modify**:
- `src/utils/unifiedContentTransformers.ts` (add transformSavedItemToUnified)
- `src/utils/plateViewerTransform.ts` (optional - keep for compatibility)

**Expected Outcome**:
- Clean transformation from SavedItem to UnifiedContentData
- All metadata properly mapped
- Delete functionality preserved

---

### Phase 3: Update All Plate Content Cards 🎴
**Goal**: Ensure all content cards open Universal Viewer correctly

**Tasks**:
1. **Photo Cards**
   - Current: `onClick={() => openViewer(photo, photos, 'photo')}`
   - New: Transform photo → UnifiedContentData, then openViewer
   - Test: Photo viewer with zoom/rotate/download

2. **Recipe Cards**
   - Current: `onClick={() => openViewer(recipe, recipes, 'recipe')}`
   - New: Transform recipe → UnifiedContentData, then openViewer
   - Test: Recipe viewer with ingredients, instructions, nutrition

3. **Video Cards**
   - Current: `onClick={() => openViewer(video, videos, 'video')}`
   - New: Transform video → UnifiedContentData, then openViewer
   - Test: Video player (YouTube embeds, direct files)

4. **Restaurant Cards**
   - Current: `onClick={() => openViewer(place, places, 'restaurant')}`
   - New: Transform restaurant → UnifiedContentData, then openViewer
   - **CRITICAL**: Test map integration - should show interactive map

5. **Navigation Between Items**
   - Test: Navigate from recipe → video → restaurant → photo
   - Test: Navigation arrows work correctly
   - Test: Keyboard navigation (arrow keys)

**Files to Modify**:
- `public/plate/components/Plate.tsx` (all card onClick handlers)

**Expected Outcome**:
- All content types open in Universal Viewer
- Map shows for restaurants
- Navigation works between all types
- Smooth transitions

---

### Phase 4: Enhance Restaurant Map Integration 🗺️
**Goal**: Ensure map works perfectly for restaurants in Plate

**Tasks**:
1. **Verify Map Data**
   - Check that restaurant metadata includes location (lat/lng)
   - Verify GoogleMapView receives correct props
   - Test map marker appears at restaurant location

2. **Add User Location** (optional enhancement)
   - Get user's current location
   - Show on map alongside restaurant
   - Show route from user to restaurant

3. **Test Map Functionality**
   - Map loads correctly
   - Marker appears at restaurant
   - Map is interactive (zoom, pan)
   - Map tab works in restaurant viewer

**Files to Check**:
- `src/components/ui/universal-viewer/UnifiedContentRenderer.tsx` (map rendering)
- `src/components/maps/GoogleMapView.tsx` (map component)

**Expected Outcome**:
- Map displays correctly for all restaurants
- Interactive and responsive
- No placeholder text

---

### Phase 5: Test Delete Functionality 🗑️
**Goal**: Ensure delete works with new unified system

**Tasks**:
1. **Update Delete Handler**
   - Current: `handleDeleteItem(itemId, itemType)`
   - Verify it works with UnifiedContentData
   - Ensure savedItemId is preserved in transformation

2. **Test Delete for Each Type**
   - Delete recipe → refreshes recipe list
   - Delete video → refreshes video list
   - Delete restaurant → refreshes places list
   - Delete photo → refreshes photo list

3. **Test Delete from Viewer**
   - Delete button in viewer controls
   - Confirmation dialog appears
   - Item removed from database
   - Viewer closes
   - List refreshes

**Files to Modify**:
- `public/plate/components/Plate.tsx` (handleDeleteItem function)

**Expected Outcome**:
- Delete works for all content types
- Confirmation dialog works
- Lists refresh after delete
- Viewer closes after delete

---

### Phase 6: Test Navigation Between Mixed Content Types 🔄
**Goal**: Ensure navigation works when mixing content types

**Tasks**:
1. **Test Mixed Navigation**
   - Start with recipe → navigate to restaurant → navigate to video → navigate to photo
   - Verify viewer updates correctly for each type
   - Check that map shows/hides appropriately

2. **Test Navigation Edge Cases**
   - Navigate to first item (prev button disabled)
   - Navigate to last item (next button disabled)
   - Single item (no navigation buttons)

3. **Test Keyboard Navigation**
   - Left arrow = previous
   - Right arrow = next
   - ESC = close
   - Works across all content types

**Expected Outcome**:
- Smooth navigation between different content types
- Viewer adapts correctly to each type
- Keyboard shortcuts work
- No errors or crashes

---

### Phase 7: Verify All Content Types Render Correctly ✅
**Goal**: Comprehensive testing of each content type

**Tasks**:
1. **Recipe Testing**
   - ✅ Image displays
   - ✅ Title and description
   - ✅ Ingredients list
   - ✅ Instructions (numbered steps)
   - ✅ Nutrition info
   - ✅ Dietary badges
   - ✅ Source link

2. **Restaurant Testing**
   - ✅ Hero image/photos
   - ✅ Name and address
   - ✅ Rating and price level
   - ✅ **Map tab with interactive map** ⭐
   - ✅ Photos gallery
   - ✅ Contact info (phone, website)
   - ✅ Opening hours
   - ✅ Categories/types

3. **Photo Testing**
   - ✅ Image displays
   - ✅ Zoom functionality
   - ✅ Rotate functionality
   - ✅ Download functionality
   - ✅ Metadata (restaurant name, visit date, rating, tags)

4. **Video Testing**
   - ✅ YouTube embed (if videoId present)
   - ✅ Direct video file (if URL present)
   - ✅ Thumbnail/poster
   - ✅ Title and description
   - ✅ Channel info
   - ✅ View count
   - ✅ Duration
   - ✅ Tags

**Expected Outcome**:
- All content types render correctly
- All features work as expected
- No missing data or broken displays

---

### Phase 8: Performance & Edge Cases 🚀
**Goal**: Ensure robust performance and handle edge cases

**Tasks**:
1. **Performance Testing**
   - Test with many saved items (100+)
   - Test navigation speed
   - Test map loading performance
   - Check for memory leaks

2. **Edge Cases**
   - Missing image URLs (fallback displays)
   - Missing location data (map fallback)
   - Missing metadata (graceful degradation)
   - Empty lists (no items to view)
   - Network errors (error handling)

3. **Data Validation**
   - Verify all required fields present
   - Handle malformed data gracefully
   - Log errors for debugging

**Expected Outcome**:
- Fast and responsive
- Handles errors gracefully
- No crashes or memory leaks

---

## Testing Checklist

### Content Type Tests
- [ ] Recipe opens and displays correctly
- [ ] Restaurant opens and displays correctly
- [ ] **Restaurant map shows interactive map (not placeholder)** ⭐
- [ ] Photo opens and displays correctly
- [ ] Video opens and displays correctly

### Navigation Tests
- [ ] Navigate between recipes
- [ ] Navigate between restaurants
- [ ] Navigate between photos
- [ ] Navigate between videos
- [ ] Navigate from recipe → restaurant → video → photo (mixed)
- [ ] Keyboard navigation (arrows, ESC)

### Functionality Tests
- [ ] Delete recipe works
- [ ] Delete restaurant works
- [ ] Delete photo works
- [ ] Delete video works
- [ ] Confirmation dialog appears
- [ ] List refreshes after delete

### Map Tests
- [ ] Map loads for restaurant
- [ ] Marker appears at restaurant location
- [ ] Map is interactive (zoom, pan)
- [ ] Map tab switches correctly
- [ ] No placeholder text

### Edge Cases
- [ ] Missing images show fallback
- [ ] Missing location shows fallback
- [ ] Empty lists handled
- [ ] Single item (no navigation)
- [ ] Network errors handled

---

## Implementation Order

1. **Phase 1** - Switch to global hook (foundation)
2. **Phase 2** - Create transformer (data layer)
3. **Phase 3** - Update all cards (UI layer)
4. **Phase 4** - Map integration (critical feature)
5. **Phase 5** - Delete functionality (user action)
6. **Phase 6** - Navigation testing (user flow)
7. **Phase 7** - Content rendering (visual verification)
8. **Phase 8** - Performance & edge cases (polish)

---

## Success Criteria

✅ Plate uses global `useUniversalViewer` hook
✅ All content types open in Universal Viewer
✅ **Map displays for restaurants (no placeholder)** ⭐
✅ Navigation works between all content types
✅ Delete functionality works for all types
✅ Keyboard navigation works
✅ All features render correctly
✅ Performance is good
✅ Edge cases handled gracefully

---

## Key Files

### To Modify:
- `public/plate/components/Plate.tsx` - Main Plate component
- `src/utils/unifiedContentTransformers.ts` - Add SavedItem transformer

### To Verify:
- `src/components/ui/universal-viewer/UnifiedContentRenderer.tsx` - Map rendering
- `src/components/maps/GoogleMapView.tsx` - Map component
- `src/contexts/UniversalViewerContext.tsx` - Global hook

---

## Notes

- **Keep usePlateViewer for now** - Don't delete until migration complete
- **Test thoroughly** - Plate is the main testing ground
- **Map is critical** - This is the main feature request
- **Backward compatibility** - Old format should still work during transition
- **Performance** - Plate may have many items, optimize accordingly

