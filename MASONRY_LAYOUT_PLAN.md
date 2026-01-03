# MASONRY LAYOUT PLAN - Bites Page Redesign

## Current State Analysis

### Desktop Layout
- Uses standard CSS Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Recipe cards are uniform size (aspect-4/3 image + content)
- All cards are recipes from Spoonacular API

### Mobile Layout
- Vertical stack of full-width cards
- Fixed height images (h-44)
- Consistent card structure

---

## Requirements

1. ✅ **Masonry layout** - Pinterest-style with varying heights
2. ✅ **Vertical cards** - Replace uniform aspect ratio
3. ✅ **Mixed content** - Recipes + Ad images
4. ✅ **Ad formats** - Square (1:1) and Vertical (2:3 or 3:4)
5. ✅ **Casual look** - More dynamic, less structured

---

## Technical Implementation Plan

### Phase 1: Masonry Layout Library Selection

**Option A: CSS-Only Masonry (Modern)**
- Use CSS `column-count` and `column-gap`
- Pros: No dependencies, lightweight
- Cons: Limited control, may break on complex layouts

**Option B: react-masonry-css** ⭐ **RECOMMENDED**
- Lightweight (7KB), pure CSS
- Responsive breakpoints built-in
- Easy to integrate with existing code

**Option C: react-virtualized-masonry**
- Performance optimized for large lists
- Overkill for current needs

**Decision: Use `react-masonry-css`**

---

### Phase 2: Data Structure for Mixed Content

Create new types:

```typescript
// New ad type
interface AdItem {
  type: 'ad';
  id: string;
  imageUrl: string;
  format: 'square' | 'vertical';
  aspectRatio: '1:1' | '2:3' | '3:4';
  link?: string;
  altText: string;
}

// Unified content type
type BitesContent = Recipe | AdItem;
```

---

### Phase 3: Ad Injection Strategy

**Algorithm:**
- Inject 1 ad every 5-7 recipe cards
- Randomize ad placement slightly for natural feel
- Alternate between square and vertical ads
- Store ad data in static config file initially

**Ad Sources (Initial):**
- Use placeholder images or client-provided assets
- Store in `/public/ads/` folder
- Create `adConfig.ts` with ad definitions

---

### Phase 4: Card Component Updates

**Create new components:**

1. **`AdCard.tsx`** - Display ad content
   - Similar styling to RecipeCard
   - Click tracking support
   - Labeled "Sponsored" badge

2. **`MasonryRecipeCard.tsx`** - Modified RecipeCard
   - Remove fixed aspect ratio
   - Dynamic height based on content
   - Add vertical image support (3:4 ratio)

3. **`BitesContentCard.tsx`** - Wrapper component
   - Renders either RecipeCard or AdCard
   - Handles click events appropriately

---

### Phase 5: Layout Implementation

**Desktop:**
```jsx
<Masonry
  breakpointCols={{
    default: 3,
    1400: 3,
    1024: 2,
    768: 2
  }}
  className="masonry-grid"
  columnClassName="masonry-grid-column"
>
  {mixedContent.map(item => (
    <BitesContentCard key={item.id} content={item} />
  ))}
</Masonry>
```

**Mobile:**
- Keep vertical stack but with varying card heights
- Inject ads more frequently (every 3-4 cards)

---

### Phase 6: Styling Updates

**CSS for Masonry:**
```css
.masonry-grid {
  display: flex;
  gap: 1.5rem;
  width: auto;
}

.masonry-grid-column {
  background-clip: padding-box;
}

.masonry-grid-column > div {
  margin-bottom: 1.5rem;
}
```

**Card Variations:**
- Vertical recipe cards: `aspect-[3/4]` for images
- Square ads: `aspect-square`
- Vertical ads: `aspect-[2/3]` or `aspect-[3/4]`

---

## Implementation Steps

### Step 1: Dependencies
```bash
npm install react-masonry-css
```

### Step 2: Create Ad System
- [ ] Create `src/types/ad.ts` - Ad type definitions
- [ ] Create `src/config/adsConfig.ts` - Ad content data
- [ ] Create `src/components/bites/components/AdCard.tsx`
- [ ] Add ad images to `/public/ads/` folder

### Step 3: Update Data Layer
- [ ] Create `src/utils/contentMixer.ts` - Merge recipes with ads
- [ ] Update BitesDesktop to use mixed content
- [ ] Update BitesNewMobile to use mixed content

### Step 4: Update Components
- [ ] Create `MasonryRecipeCard.tsx` with vertical support
- [ ] Create `BitesContentCard.tsx` wrapper
- [ ] Update `BitesDesktop.tsx` to use Masonry layout
- [ ] Update `BitesNewMobile.tsx` for varied heights

### Step 5: Styling
- [ ] Add masonry CSS to global styles
- [ ] Update card hover effects
- [ ] Ensure responsive behavior
- [ ] Test on various screen sizes

### Step 6: Testing & Polish
- [ ] Test ad click tracking
- [ ] Verify layout stability
- [ ] Check performance with large datasets
- [ ] Add loading skeletons for masonry

---

## File Structure After Changes

```
src/components/bites/
├── BitesNew.tsx (updated)
├── BitesNewMobile.tsx (updated)
├── BitesDesktop.tsx (updated - masonry)
├── components/
│   ├── RecipeCard.tsx (kept for compatibility)
│   ├── MasonryRecipeCard.tsx (new - vertical support)
│   ├── AdCard.tsx (new)
│   ├── BitesContentCard.tsx (new - wrapper)
│   ├── RecipeDetailDialog.tsx
│   └── ...

src/config/
├── adsConfig.ts (new)

src/types/
├── ad.ts (new)

src/utils/
├── contentMixer.ts (new)

public/ads/
├── ad-1-square.jpg
├── ad-2-vertical.jpg
└── ...
```

---

## Example Ad Configuration

```typescript
// src/config/adsConfig.ts
export const ADS_CONFIG = [
  {
    id: 'ad-001',
    imageUrl: '/ads/food-delivery-square.jpg',
    format: 'square' as const,
    aspectRatio: '1:1' as const,
    altText: 'Food Delivery Service',
    link: 'https://example.com/delivery'
  },
  {
    id: 'ad-002',
    imageUrl: '/ads/kitchen-tools-vertical.jpg',
    format: 'vertical' as const,
    aspectRatio: '3:4' as const,
    altText: 'Premium Kitchen Tools',
    link: 'https://example.com/tools'
  },
  // ... more ads
];
```

---

## Estimated Timeline

- **Phase 1-2**: 1 hour (Library setup + types)
- **Phase 3-4**: 2 hours (Ad system + data layer)
- **Phase 5**: 2-3 hours (Components + layout)
- **Phase 6**: 1-2 hours (Styling + testing)

**Total: ~6-8 hours**

---

## Potential Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Layout shifts during load | Use skeleton loaders with fixed heights initially |
| Ad frequency balance | Make configurable (1 per X recipes) |
| SEO concerns with ads | Add proper `rel="sponsored"` attributes |
| Image loading performance | Lazy load images below fold, optimize sizes |
| Different ad sources later | Build abstraction layer for ad provider integration |

---

## Next Steps

1. Start implementing the masonry layout
2. Create sample ad assets (or use client-provided)
3. Build prototype on Desktop first, then Mobile
4. Review and iterate based on feedback

---

**Status**: Ready to implement 🚀
**Created**: December 24, 2025
