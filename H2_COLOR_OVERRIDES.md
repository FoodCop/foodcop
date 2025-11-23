# H2 Color Overrides Found

## Summary
Found multiple H2 elements with color overrides that prevent the dark grey (#1A1A1A) from being applied globally.

## Main Overrides by Component

### 1. PlateDesktop.tsx (6 H2s with Orange Inline Styles)
- **Line 282**: `style={{ color: '#EA580C' }}` - "Sign In Required"
- **Line 445**: `style={{ color: '#EA580C' }}` - User display name
- **Line 703**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "My Crew"
- **Line 747**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "Saved Recipes"
- **Line 805**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "Nearby Restaurants"
- **Line 871**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "Trending Posts"

### 2. PlateMobile.tsx (6 H2s with Orange Inline Styles)
- **Line 290**: `style={{ color: '#EA580C' }}` - "Sign In Required"
- **Line 337**: `style={{ color: '#EA580C' }}` - User display name
- **Line 520**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "My Crew"
- **Line 566**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "Saved Recipes"
- **Line 624**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "Nearby Restaurants"
- **Line 690**: `style={{ fontSize: '16pt', color: '#EA580C' }}` - "Trending Posts"

### 3. BitesDesktop.tsx (2 H2s)
- **Line 260**: `className="text-2xl font-bold text-foreground"` - "Recommended For You"
- **Line 280**: `className="text-2xl font-bold text-foreground mb-6"` - Search results heading

### 4. TrimsDesktop.tsx (2 H2s - Already Dark Grey)
- **Line 322**: `className="text-lg font-bold text-[#1A1A1A] mb-6"` - "Filters" ✅
- **Line 666**: `className="text-[#1A1A1A] font-bold text-xl mb-2"` - Video title ✅

### 5. TrimsMobile.tsx (1 H2 - Already Dark Grey)
- **Line 452**: `className="text-[#1A1A1A] font-bold text-lg mb-2"` - Video title ✅

### 6. DashboardNew.tsx (5 H2s - Already Dark Grey)
- **Line 222**: `className="text-[#1A1A1A] font-bold text-xl"` - "My Crew" ✅
- **Line 270**: `className="text-2xl font-bold text-[#1A1A1A]"` - "My Crew" ✅
- **Line 316**: `className="text-[#1A1A1A] font-bold text-xl md:text-3xl"` - "Saved Recipes" ✅
- **Line 371**: `className="text-[#1A1A1A] font-bold text-xl md:text-3xl"` - "Nearby Restaurants" ✅
- **Line 435**: `className="text-[#1A1A1A] font-bold text-xl md:text-3xl"` - "Trending Posts" ✅

### 7. Dashboard.tsx (4 H2s - No Color Override)
- **Line 164**: `className="mb-6"` - "My Crew" (will use default dark grey)
- **Line 199**: `className="mb-6"` - "Saved Recipes" (will use default dark grey)
- **Line 243**: `className="mb-6"` - "Restaurant Recommendations" (will use default dark grey)
- **Line 295**: `className="mb-6"` - "Trending Food Posts" (will use default dark grey)

### 8. Feed Cards (Intentional White Text on Overlays)
- **RestaurantCard.tsx**: `className="text-white"` - On gradient overlay ✅ (intentional)
- **RecipeCard.tsx**: `className="text-white mb-2"` - On gradient overlay ✅ (intentional)
- **VideoCard.tsx**: `className="text-white mb-2"` - On gradient overlay ✅ (intentional)
- **AdCard.tsx**: `className="text-white mb-2"` - On gradient overlay ✅ (intentional)

### 9. Other Components
- **BitesNewMobile.tsx**: Multiple H2s with `text-[#0f172a]` (dark blue/black)
- **RecipeModal.tsx**: H2 with `text-[#0f172a]`
- **RecipeDetailView.tsx**: H2 with `text-[#0f172a]`
- **ScoutDesktop.tsx**: H2 with `text-gray-900`
- **ScoutNew.tsx**: Multiple H2s with `text-gray-900`
- **Various other components**: Mixed colors (gray-900, text-foreground, etc.)

## Recommendations

### High Priority (Should Change to Dark Grey)
1. **PlateDesktop.tsx** - Remove orange inline styles from all 6 H2s
2. **PlateMobile.tsx** - Remove orange inline styles from all 6 H2s
3. **BitesDesktop.tsx** - Change `text-foreground` to use default or explicit dark grey

### Medium Priority (Consider Standardizing)
4. **BitesNewMobile.tsx** - Change `text-[#0f172a]` to use default
5. **RecipeModal.tsx** - Change `text-[#0f172a]` to use default
6. **RecipeDetailView.tsx** - Change `text-[#0f172a]` to use default
7. **ScoutDesktop.tsx** - Change `text-gray-900` to use default
8. **ScoutNew.tsx** - Change `text-gray-900` to use default

### Low Priority (Already Correct or Intentional)
- TrimsDesktop.tsx, TrimsMobile.tsx - Already using dark grey ✅
- DashboardNew.tsx - Already using dark grey ✅
- Dashboard.tsx - Will use default dark grey ✅
- Feed cards - White text on overlays is intentional ✅

## Total Count
- **H2s with orange color**: 12 (PlateDesktop + PlateMobile)
- **H2s with other color overrides**: ~20+
- **H2s already using dark grey or default**: ~15+

