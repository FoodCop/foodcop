# CSS Cleanup Analysis Report
**Generated: January 26, 2026**

## Overview
This report identifies unused CSS tokens, variables, and classes across the FUZO FoodCop project to help streamline and clean up the CSS.

---

## 1. DUPLICATE TOKEN DEFINITIONS

### Issue: Multiple CSS token files with overlapping definitions
The project has **3 major CSS token files** with significant overlap:
- `src/index.css` - Main file with design tokens and utilities
- `src/styles/design-tokens.css` - Comprehensive token system
- `src/styles/design-system.css` - Legacy tokens (includes old Playfair font imports)

**Recommendation:** Consolidate into a single source of truth.

---

## 2. UNUSED/RARELY USED TOKENS

### From `design-system.css`:

#### Color Variables (Never Used in Code):
- `--color-seal-brown: #4A3728` - ✅ ONLY used in design-system.css itself
- `--color-raw-umber: #865C3C` - ❌ **UNUSED**
- `--color-dark-green-brown: #6B7A2C` - ❌ Only used once in design-system.css (line 616)
- `--font-heading: 'Playfair Display'` - ❌ **UNUSED** (only in design-system.css)

#### Spacing Variables (Duplicated in multiple files):
`design-system.css` defines: `--space-xs` through `--space-5xl`
- These conflict with Tailwind's native spacing
- Not used in components (components use Tailwind directly)

#### Typography Variables (Duplicated):
- `--text-h1`, `--text-h2`, `--text-h3`, `--text-h4` - ❌ **UNUSED**
- `--line-height-h1` through `--line-height-h4` - ❌ **UNUSED**
- Duplicated across `design-tokens.css` and `design-system.css`

---

## 3. CONFLICTING/REDUNDANT FONT SYSTEMS

### Problem: Multiple font family definitions
**design-system.css** imports fonts that aren't used:
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:...');
/* Playfair Display is never used in the application */
```

**design-tokens.css** uses:
```css
--font-sans: 'Inter', system-ui, ...
--font-display: var(--font-sans);  /* Alias pointing to same font */
--font-body: var(--font-sans);     /* Alias pointing to same font */
```

**Recommendation:** 
- Remove Playfair Display import and `--font-heading` 
- Use only `--font-sans` and create aliases as needed

---

## 4. UNUSED UTILITY CLASSES

### From `design-tokens.css`:
```css
.font-display { ... }      /* ❌ Unused - use Tailwind classes instead */
.font-body { ... }         /* ❌ Unused - use Tailwind classes instead */
.font-ui { ... }           /* ❌ Unused - use Tailwind classes instead */
.font-button { ... }       /* ❌ Unused - use Tailwind classes instead */
```

### From `design-system.css`:
Multiple CSS classes are defined but not used in components - they rely on Tailwind:
- `.h1` through `.h6` - ❌ Components use Tailwind instead
- Various color utility classes - ❌ Components use Tailwind

---

## 5. SAFE AREA UTILITIES

### Status: Minimal Usage ✓
- `safe-area-top` - Used in 2 places (App.tsx, MobileHeader.tsx)
- `safe-area-bottom` - Defined but **not actively used**
- `safe-area-left` / `safe-area-right` - Defined but **not used**

**Recommendation:** 
- Keep `safe-area-top` and `safe-area-bottom`
- Remove `safe-area-left` and `safe-area-right` unless adding PWA support

---

## 6. ANIMATION UTILITIES

### Status: ✅ Good
Most animation utilities in `index.css` are actively used:
- `.animate-fade-in` - Used
- `.animate-toast-center-in` - Used
- Keyframes: `@keyframes fadeIn` - Used
- Keyframes: `@keyframes toastCenterIn` - Used

---

## 7. SHADOW UTILITIES

### Status: Mostly Unused
From `design-tokens.css`:
```css
.shadow-card { ... }        /* Used in FeedCard.css */
.shadow-card-hover { ... }  /* ❌ Unused */
.shadow-button { ... }      /* ❌ Unused */
```

**Recommendation:** Remove `.shadow-card-hover` and `.shadow-button`

---

## 8. PLATFORM BADGE UTILITIES

### Status: ✅ Good
These are actively used:
```css
.bg-platform-google { ... }      /* ✅ Used */
.bg-platform-youtube { ... }     /* ✅ Used */
.bg-platform-spoonacular { ... } /* ✅ Used */
.bg-platform-fuzo { ... }        /* ❓ Check usage */
```

---

## 9. PAGE BACKGROUND UTILITIES

### Status: ✅ All Used
```css
.bg-page-feed { ... }      /* ✅ Used */
.bg-page-scout { ... }     /* ✅ Used */
.bg-page-explore { ... }   /* ✅ Used */
.bg-page-profile { ... }   /* ✅ Used */
.bg-page-utility { ... }   /* ✅ Used */
```

---

## 10. DUPLICATE VARIABLE DEFINITIONS

### Variables defined in multiple places:

| Variable | Locations | Status |
|----------|-----------|--------|
| `--font-size` | index.css, App.css | ⚠️ App.css sets to 10pt (redundant) |
| `--safe-area-*` | index.css, mobile.css, design-tokens.css | ⚠️ Tripled |
| `--touch-target-min` | design-tokens.css, mobile.css | ⚠️ Duplicated |
| Color variables | design-tokens.css, design-system.css | ⚠️ Completely duplicated palettes |

---

## 11. FILE-SPECIFIC ANALYSIS

### `src/App.css` - **CAN BE REMOVED**
```css
:root {
  --font-size-base: 10pt;
}
* {
  font-size: 10pt;  /* Conflicts with global 16px */
}
```
**Issue:** Overrides global font size with 10pt
**Recommendation:** Delete this file

### `src/styles/mobile.css` - **CONSOLIDATION NEEDED**
- Safe area variables are duplicated
- Mobile-specific classes mostly good
- Could merge relevant parts into design-tokens.css

### `src/styles/design-system.css` - **NEEDS MAJOR CLEANUP**
- 869 lines with lots of unused definitions
- Uses old Playfair Display font (never used)
- Duplicates most of design-tokens.css
- Contains working typography system but Playfair isn't needed

---

## CLEANUP PRIORITIES

### 🔴 HIGH PRIORITY (Remove):
1. **Delete `src/App.css`** - Conflicting font-size (10pt vs 16px)
2. **Remove from `design-system.css`:**
   - `@import` for Playfair Display font
   - `--color-raw-umber` 
   - `--font-heading` variable
   - Unused typography classes (`.h1` through `.h6`)
   - `.shadow-card-hover`, `.shadow-button`

3. **Consolidate safe-area variables** into one location

### 🟡 MEDIUM PRIORITY (Consolidate):
1. Merge `design-tokens.css` and `design-system.css` into a single file
2. Remove duplicate font family definitions
3. Remove `.font-display`, `.font-body`, `.font-ui`, `.font-button` utility classes
4. Remove unused spacing variables `--space-*` (use Tailwind instead)
5. Remove unused heading typography variables

### 🟢 LOW PRIORITY (Verify):
1. Verify `--platform-fuzo` is actually used
2. Check if `mobile-app-container` class is truly needed
3. Review `@layer` directives for specificity issues

---

## ESTIMATED SAVINGS

- **Line reduction:** 200-250 lines from design-system.css alone
- **File reduction:** Can delete App.css entirely (13 lines)
- **Font requests:** 1 Google Font request removed (Playfair)
- **Overall CSS reduction:** ~15-20% smaller CSS payload

---

## RECOMMENDATIONS SUMMARY

1. ✅ **Keep** all page background utilities - they're all used
2. ✅ **Keep** platform badge utilities - actively used
3. ✅ **Keep** animation utilities - actively used
4. ❌ **Remove** App.css file
5. ❌ **Remove** unused color tokens
6. ❌ **Remove** Playfair Display font import
7. 🔄 **Consolidate** design-tokens.css + design-system.css
8. 🔄 **Merge** mobile.css utilities into main token file
9. 🔄 **Replace** custom spacing variables with Tailwind

