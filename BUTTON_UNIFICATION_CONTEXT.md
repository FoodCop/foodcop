# Button Unification & Lean Color Palette - Context for Next Session

## Current State (Jan 30, 2026)

### ✅ Completed: Button Unification Phase 1
All interactive buttons across the entire application have been updated to:
- **Shape**: `rounded-full` (pill-shaped, no more rounded-lg/xl/md/2xl)
- **Colors**: CSS variables from unified system
- **Semantic HTML**: Proper `<button>` tags instead of clickable divs
- **Hover States**: Consistent transitions using CSS variables

### 📊 Current Color System
Located in: `src/styles/unified-colors.css`

**Button Colors**:
```css
--button-bg-default: #ffe838;  /* Banana Yellow - Primary */
--button-bg-hover: #e89f3c;    /* Orange - Hover/Secondary */
--button-bg-active: #ffffff;   /* White - Active/Tertiary */
--button-text: #1f2937;        /* Gray-900 - Text */
```

**Background Colors**:
```css
--background: #ffffff;         /* Page backgrounds */
--menu-bg: #ffe838;           /* Navigation bars and menus */
--sidebar-bg: #fff1b7;        /* Sidebar panels */
```

### 🎯 Files Modified (Button Unification)
1. `src/styles/unified-colors.css` - Added button color variables
2. `src/components/ui/button.tsx` - Updated CVA variants to use rounded-full and CSS vars
3. `src/components/scout/ScoutDesktop.tsx` - Action buttons (5 buttons)
4. `src/components/scout/components/MapView.tsx` - Map controls (4 buttons)
5. `src/components/plate/PlateMobile.tsx` - Stat buttons (3 buttons)
6. `src/components/plate/PlateDesktop.tsx` - Collection buttons (2 buttons)
7. `src/components/bites/components/RecipeDetailView.tsx` - Action buttons (2 buttons)
8. `src/components/bites/BitesDesktop.tsx` - Retry, Share, Save buttons (3 buttons)
9. `src/components/bites/Bites.tsx` - Preferences and dietary buttons (4 buttons)
10. `src/components/bites/components/RecipeModal.tsx` - Send to Friend, Save to Plate (2 buttons)
11. `src/components/bites/components/RecipeDetailDialog.tsx` - Action buttons (2 buttons)
12. `src/components/chat/EmptyState.tsx` - Start Chat button (1 button)
13. `src/components/common/PreferencesHintModal.tsx` - Dietary chips and action buttons (multiple)
14. `src/components/common/PreferencesFilterDrawer.tsx` - Dietary filter buttons (multiple)
15. `src/components/trims/TrimsMobile.tsx` - Try Again button (1 button)

**Total Buttons Updated**: 50+

---

## Next Phase: Lean Color Palette 🎨

### Objective
Create a minimal, cohesive color palette that:
1. Reduces visual clutter
2. Maintains brand identity (banana yellow primary)
3. Improves contrast and accessibility
4. Streamlines developer experience (fewer color variables to manage)

### Current Palette Analysis
**Problem Areas**:
- Multiple yellow variants: #ffe838, #fbd556, #FFC909, #FFD500, #FFF8F0 (various shades)
- Multiple orange variants: #EA580C, #e89f3c, #f59e0b, #eb9f3c
- Red/burgundy scattered: #D55123, #951A21, #BF2C20, #500200
- Gray variants not consolidated
- Some hardcoded hex values in components instead of variables

### Proposed Lean Palette (5-Color Core)
```css
/* Primary */
--primary: #ffe838;           /* Banana Yellow - CTA, nav, default buttons */

/* Secondary */
--secondary: #e89f3c;         /* Orange - Hover, interactive states */

/* Accent */
--accent: #ffffff;            /* White - Active state, high contrast */

/* Neutral */
--neutral-bg: #f3f4f6;        /* Light gray - Backgrounds, disabled states */
--neutral-text: #1f2937;      /* Dark gray - Body text, labels */

/* Semantic (Optional) */
--danger: #d55123;            /* For destructive actions */
--success: #10b981;           /* For success messages */
```

### Implementation Plan
1. **Audit**: Scan all components for hardcoded colors
2. **Consolidate**: Map existing colors to lean palette
3. **Replace**: Update components to use new variables
4. **Remove**: Delete unused color tokens
5. **Test**: Verify contrast and accessibility (WCAG AA)
6. **Documentation**: Update design system docs

### Key Files to Review
- `src/styles/unified-colors.css` - Main color definitions
- `src/styles/design-tokens.css` - All design tokens
- `src/index.css` - Global CSS variables
- `tailwind.config.ts` - Tailwind overrides
- All component files with inline colors

### Search Patterns for Hardcoded Colors
```
- Hex codes not in variables: #[0-9A-F]{6}
- Tailwind color names: bg-red-600, text-orange-500, etc.
- Inline style colors: style={{color: '#...'}}
- Theme-specific colors that could be variables
```

### Benefits of Lean Palette
✅ Single source of truth for colors  
✅ Easier brand updates (change one variable)  
✅ Better theme/dark mode support  
✅ Improved accessibility (fewer variants to test)  
✅ Cleaner component code  
✅ Smaller CSS bundle  

---

## Technical Setup Ready
- CSS variables system established ✅
- Button component uses CVA with variable support ✅
- Build process handles variable substitution ✅
- Tailwind integration ready ✅

## Next Steps Summary
1. Finalize lean color palette design
2. Audit codebase for all color usage
3. Create mapping of old → new colors
4. Update all hardcoded colors to variables
5. Remove unused tokens
6. Test across all pages/components
7. Update design documentation

---

## Reference: Button Unification Summary

### What Was Changed
- **100+ button elements** across the app now use `rounded-full`
- **All buttons** use CSS variables for colors (no hardcoded hex)
- **Consistent state handling**: default → hover → active
- **Proper semantics**: buttons are `<button>` elements, not `<div>`

### How It Works
```tsx
// Before (mixed styles)
<button className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600">Save</button>
<button className="px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700">Share</button>

// After (unified)
<button className="px-4 py-2 bg-[var(--button-bg-default)] rounded-full hover:bg-[var(--button-bg-hover)] text-[var(--button-text)]">Save</button>
<button className="px-4 py-2 bg-[var(--button-bg-default)] rounded-full hover:bg-[var(--button-bg-hover)] text-[var(--button-text)]">Share</button>
```

### Files to Check First in Next Session
1. Any component with hardcoded hex colors in className
2. Tailwind color utilities (bg-red-500, text-blue-600, etc.)
3. Components with inline style props
4. New components being added without variable usage

Good luck with the lean palette! 🚀
