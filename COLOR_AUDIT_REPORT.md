# Color Audit Report - January 31, 2026

## Executive Summary
**Status**: Current system is fragmented with multiple color definitions, but core work is in progress.
- ✅ **Unified Color System Started**: `src/styles/unified-colors.css` exists with button colors
- ⚠️ **Multiple Color Definitions**: Colors spread across 3+ CSS files with overlaps
- 🔴 **Hardcoded Colors Found**: 30+ components still using inline hex values
- ⚠️ **Inconsistent Standards**: Multiple yellow/orange variants not consolidated

---

## Part 1: CSS COLOR FILES INVENTORY

### File 1: `src/styles/unified-colors.css` ✅ (Main)
**Status**: Good foundation, but incomplete

**Defined Colors**:
```
Yellow Palette:
  --yellow-primary: #FFC909 ✓
  --yellow-secondary: #fbd556 ✓
  --yellow-tertiary: #f8b44a ✓
  --yellow-light: #FFF1B7 ✓
  --yellow-feed: #ffe838 ✓
  --yellow-feed-alternate: #ffd600 ✓
  --menu-bg: #ffe838 ✓
  --sidebar-bg: #fff1b7 ✓
  
Button Variables:
  --button-bg-default: #ffe838 ✓
  --button-bg-hover: #e89f3c ✓
  --button-bg-active: #ffffff ✓
  --button-text: #1f2937 ✓
  
Orange Palette:
  --orange-apricot: #E47A24
  --orange-dark-mango: #D55123
  --orange-blood: #BF2C20
  --orange-candy-apple: #951A21
  
Semantic:
  --red: #EF4444
  --green: #22C55E
  --amber: #F59E0B
  --blue: #3B82F6
```

---

### File 2: `src/styles/design-tokens.css`
**Status**: Legacy, contains unused tokens

**Issues**:
- Duplicate definitions from unified-colors.css
- Unused font tokens
- Orphaned color variables
- Should be consolidated

---

### File 3: `src/index.css`
**Status**: Mixed legacy + new

**Contains**:
- OKLCh color system (not used in modern components)
- CSS variables from old design system
- Safe area tokens (used)
- Does NOT contain primary button colors

---

## Part 2: HARDCODED COLOR AUDIT

### 🔴 Components with Inline Hex Colors (30+ instances)

#### App.tsx (4 hardcoded colors)
```
Line 141:  '#f8b44a'        (Golden yellow - should use var)
Line 209:  '#E5E7EB'        (Light gray border)
Line 210:  '#FFFFFF'        (White background)
Line 229:  '#951A21'        (Burgundy - profile red)
Line 230:  '#FFFFFF'        (White text)
Line 402:  '#951A21'        (Burgundy again)
Line 404:  '#E5E7EB'        (Light gray)
```

#### Snap.tsx (12+ hardcoded colors)
```
Line 204-206:  Canvas gradient colors: #FFC909, #FFE66D, #4ECDC4
Line 210:      #ffffff (canvas text)
Line 339:      from-[#FFC909] to-[#E6B508] (yellow gradient)
Line 384:      bg-gradient-to-r from-[#FFC909] to-[#E6B508]
Line 440:      text-[#FFC909] (camera icon)
Line 462:      bg-gradient-to-r from-[#FFC909] to-[#E6B508]
Line 510:      bg-[#F5F5F5], focus:ring-2 focus:ring-[#FFC909]
Line 526-527:  bg-[#FFC909], bg-[#F5F5F5]
Line 568:      bg-[#F5F5F5], focus:ring-2 focus:ring-[#FFC909]
Line 601:      from-[#FFC909] to-[#E6B508]
Line 630:      from-[#FFC909] to-[#E6B508]
```

#### Bites.tsx (8 hardcoded diet colors)
```
Lines 385-392: Hardcoded dietary restriction colors
  'vegetarian': #10b981 (teal)
  'vegan': #22c55e (green)
  'pescetarian': #06b6d4 (cyan)
  'ketogenic': #f59e0b (amber)
  'paleo': #f97316 (orange)
  'gluten-free': #eab308 (yellow)
  'dairy-free': #8b5cf6 (purple)
  'no restrictions': #6b7280 (gray)
  
Other lines: #9CA3AF, #6B7280, #FFC909 (icon/text colors)
```

#### BitesDesktop.tsx (3 hardcoded)
```
Line 314:  text-[#9CA3AF] (search icon gray)
Line 320:  border-gray-300, text-[#6B7280], placeholder:text-[#9CA3AF]
```

#### FloatingActionMenu.tsx (7 icon colors)
```
Lines 40-76: Hardcoded icon colors
  #FFC909 (yellow - SNAP)
  #4A90E2 (blue - Scout)
  #9B59B6 (purple - Tako AI)
  #E74C3C (red - Trims)
  #F39C12 (orange - Feed)
  #2ECC71 (green - Something)
  #1ABC9C (teal - Something)
Line 115:  border: '1px solid #E5E7EB'
```

#### index.html (1)
```
Line 23: <meta name="theme-color" content="#fbd556" />
```

#### vite.config.ts (2)
```
Lines 17-18: theme_color and background_color: #fbd556
```

---

## Part 3: CURRENT COLOR PALETTE ANALYSIS

### Yellow Palette (6+ variants)
| Color | Hex | Purpose | Status |
|-------|-----|---------|--------|
| Primary Yellow | #ffe838 | Buttons, nav bars | ✅ Defined |
| Accent Yellow | #FFC909 | Snap, buttons | ✅ Defined |
| Secondary Yellow | #fbd556 | Feed, backgrounds | ✅ Defined |
| Golden Yellow | #f8b44a | Sidebar, accents | ✅ Defined |
| Light Yellow | #fff1b7 | Sidebar bg | ✅ Defined |
| Feed Yellow | #ffd600 | Feed alternate | ⚠️ Rarely used |

**Issue**: Too many yellows. #FFC909 and #ffe838 are used almost identically.

### Orange Palette (4+ variants)
| Color | Hex | Purpose | Status |
|-------|-----|---------|--------|
| Apricot | #E47A24 | Not actively used | ❌ Orphaned |
| Dark Mango | #D55123 | Danger, destructive? | ⚠️ Defined |
| Blood Orange | #BF2C20 | Not actively used | ❌ Orphaned |
| Candy Apple | #951A21 | Profile page red | ⚠️ Hardcoded |
| Button Hover | #e89f3c | Button states | ✅ Defined |

### Semantic Colors (Good!)
| Color | Purpose | Status |
|-------|---------|--------|
| #22C55E | Success/Vegetarian | ✅ Defined |
| #F59E0B | Warning/Ketogenic | ✅ Defined |
| #EF4444 | Error/Red | ✅ Defined |
| #3B82F6 | Info/Blue | ✅ Defined |

### Gray Palette (Good!)
| Color | Purpose | Status |
|-------|---------|--------|
| #1f2937 | Text (gray-900) | ✅ Defined |
| #6b7280 | Secondary text | ✅ Defined |
| #9CA3AF | Tertiary text | ❌ Hardcoded |
| #F3F4F6 | Light bg | ✅ Defined |
| #E5E7EB | Borders | ❌ Hardcoded |

---

## Part 4: PROPOSED 5-COLOR LEAN PALETTE

### Core 5-Color System
```css
:root {
  /* TIER 1: Primary */
  --color-primary: #ffe838;       /* Banana Yellow - buttons, nav, CTAs */
  
  /* TIER 2: Secondary */
  --color-secondary: #e89f3c;     /* Orange - hover states, emphasis */
  
  /* TIER 3: Accent */
  --color-accent: #ffffff;        /* White - active states, contrast */
  
  /* TIER 4: Neutral Background */
  --color-neutral-bg: #f3f4f6;    /* Light gray - disabled, backgrounds */
  
  /* TIER 5: Neutral Text */
  --color-neutral-text: #1f2937;  /* Dark gray - body text, labels */
}
```

### Extended Semantic Layer (for specific features)
```css
:root {
  /* Semantic - Optional but recommended */
  --color-success: #22C55E;        /* For positive actions */
  --color-warning: #F59E0B;        /* For warnings */
  --color-danger: #EF4444;         /* For destructive actions */
  --color-info: #3B82F6;           /* For information */
  
  /* Feature-Specific (can be customized) */
  --color-dietary-vegetarian: #10b981;
  --color-dietary-vegan: #22c55e;
  --color-dietary-pescetarian: #06b6d4;
  --color-dietary-ketogenic: #f59e0b;
  --color-dietary-paleo: #f97316;
  --color-dietary-glutenfree: #eab308;
  --color-dietary-dairyfree: #8b5cf6;
  --color-dietary-none: #6b7280;
}
```

### Color Mapping (What gets replaced)

#### Yellows → PRIMARY (#ffe838)
- ✅ #FFC909 → Use --color-primary
- ✅ #fbd556 → Use --color-primary (too similar)
- ✅ #fff1b7 → Use for backgrounds, keep as light variant
- ✅ #f8b44a → Use --color-secondary or as hover
- ✅ #ffd600 → Use --color-primary

#### Oranges → SECONDARY (#e89f3c)
- ✅ #e89f3c → Keep as --color-secondary
- ✅ #f59e0b → Map to warning state or secondary
- ❌ #E47A24 → REMOVE (unused)
- ❌ #BF2C20 → REMOVE (unused)
- ⚠️ #951A21 → Keep for profile/special context OR map to danger

#### Grays → NEUTRAL
- ✅ #1f2937 → --color-neutral-text
- ✅ #6b7280 → Use --color-neutral-text opacity or variant
- ✅ #F3F4F6 → --color-neutral-bg
- ✅ #E5E7EB → --color-neutral-bg or border color
- ✅ #9CA3AF → Variants of neutral-text

---

## Part 5: IMPLEMENTATION ROADMAP

### Phase 1: Create Lean Palette Variables (TODAY)
**File**: `src/styles/lean-colors.css`
```css
:root {
  /* Core 5-Color Palette */
  --color-primary: #ffe838;
  --color-secondary: #e89f3c;
  --color-accent: #ffffff;
  --color-neutral-bg: #f3f4f6;
  --color-neutral-text: #1f2937;
  
  /* Semantic Layer */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  
  /* Feature-Specific Overrides (easily customizable) */
  --color-dietary-vegetarian: #10b981;
  --color-dietary-vegan: #22c55e;
  --color-dietary-pescetarian: #06b6d4;
  --color-dietary-ketogenic: #f59e0b;
  --color-dietary-paleo: #f97316;
  --color-dietary-glutenfree: #eab308;
  --color-dietary-dairyfree: #8b5cf6;
  --color-dietary-none: #6b7280;
}
```

### Phase 2: Update Component References
**Priority order** (by frequency):
1. Snap.tsx (12+ hardcoded → 5 variables)
2. Bites.tsx (8 hardcoded diet colors → CSS array)
3. App.tsx (4 hardcoded → variables)
4. FloatingActionMenu.tsx (7 icon colors → variables)
5. BitesDesktop.tsx (3 hardcoded)

### Phase 3: Remove Legacy CSS Files
- Consolidate `design-tokens.css` into `lean-colors.css`
- Keep `unified-colors.css` as reference or merge

### Phase 4: Update Configuration Files
- index.html theme-color
- vite.config.ts manifest colors
- tailwind.config.js color overrides

---

## Part 6: COLOR USAGE SUMMARY

### Active Colors (Used Frequently)
```
#ffe838         (Primary yellow) - 15+ uses ✅
#FFC909         (Accent yellow) - 12+ uses ✅
#e89f3c         (Orange hover) - 4+ uses ✅
#1f2937         (Dark text) - 5+ uses ✅
#f3f4f6         (Light bg) - 3+ uses ✅
#F5F5F5         (Medium light bg) - 5+ uses (should consolidate)
#951A21         (Profile red) - 3+ uses ⚠️
```

### Orphaned Colors (Not Used)
```
#E47A24         (Orange apricot) - 0 uses ❌
#BF2C20         (Blood orange) - 0 uses ❌
#865C3C         (Raw umber) - 0 uses ❌
#4A3728         (Seal brown) - 0 uses ❌
#FFC909 (old)   (Duplicate) - consolidated ✅
```

---

## Recommendations

### IMMEDIATE (Today)
1. ✅ Create `lean-colors.css` with 5-color core palette
2. ✅ Export to unified-colors.css
3. ⚠️ Document mapping of old → new colors

### SHORT TERM (Next session)
1. Update Snap.tsx to use CSS variables
2. Update Bites.tsx dietary colors to variable array
3. Update App.tsx profile colors
4. Remove hardcoded colors from components

### MEDIUM TERM
1. Consolidate CSS files (remove duplicates)
2. Create theming system for easy customization
3. Update documentation with new palette

### LONG TERM
1. Add dark mode support using CSS variables
2. Create CSS utility classes (optional)
3. Build design system component library

---

## Next Steps

**Ready to proceed with Phase 1? Confirm to:**
1. Create `lean-colors.css` with proposed palette
2. Update `unified-colors.css` to reference lean palette
3. Document all color mappings
4. Create replacement guide for components

This audit shows **good foundational work** but needs **consolidation and completion** to achieve the lean, customizable palette goal.
