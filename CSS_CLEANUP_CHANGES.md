# CSS Cleanup - Changes Applied

**Date:** January 26, 2026

## Summary
Successfully cleaned up CSS files to remove unused tokens, variables, and classes. This reduces CSS payload and improves maintainability.

---

## Changes Made

### 1. ✅ Deleted `src/App.css`
**Reason:** This file was conflicting with the global design system
- Set `font-size: 10pt` on `*` selector (conflicting with 16px base)
- Set `line-height: 1.2` (too tight, conflicts with 1.5 design token)
- Legacy artifact, no longer needed

**Savings:** 13 lines removed

---

### 2. ✅ Cleaned `src/styles/design-system.css`

#### Removed:
- **Playfair Display font import** - Never used in the app
- **`--font-heading` variable** - Was pointing to Playfair (unused)
- **`--color-raw-umber` (#865C3C)** - Never used in code
- **Heading typography classes** (`.heading-h1`, `.heading-h2`, `.heading-h3`, `.heading-h4`)
  - These referenced the deleted heading variables (`--text-h1` through `--text-h4`)
  - Were not being used in components
- **Heading line-height variables** (`--line-height-h1` through `--line-height-h4`)
  - Only existed for these unused classes

**Kept:** All functional typography classes (`.body-large`, `.body`, `.body-small`, `.label`, `.caption`)

**Savings:** ~40 lines removed, 1 Google Font request eliminated

---

### 3. ✅ Cleaned `src/styles/design-tokens.css`

#### Removed:
- **`.font-display`** - Unused utility class
- **`.font-body`** - Unused utility class
- **`.font-ui`** - Unused utility class
- **`.font-button`** - Unused utility class
- **`.shadow-card-hover`** - Unused shadow utility
- **`.shadow-button`** - Unused shadow utility
- **`.safe-left`** - Safe area utility (left margin not used)
- **`.safe-right`** - Safe area utility (right margin not used)
- **`--safe-area-left`** variable definition
- **`--safe-area-right`** variable definition

**Kept:**
- `.shadow-card` - Used in FeedCard.css
- `.safe-top` and `.safe-bottom` - Used in App.tsx and MobileHeader.tsx
- Platform badge utilities (`.bg-platform-google`, etc.)
- Page background utilities (`.bg-page-*`)
- All animation and transition utilities

**Savings:** ~15 lines removed

---

### 4. ✅ Cleaned `src/styles/mobile.css`

#### Removed:
- **`.safe-area-left`** - Unused safe area utility
- **`.safe-area-right`** - Unused safe area utility
- **`--safe-area-left` variable definition**
- **`--safe-area-right` variable definition**

**Kept:** All mobile layout classes that are actively used
- `.mobile-app-container`
- `.mobile-content-area`
- `.mobile-bottom-nav`
- `.mobile-header`
- `.safe-area-top`
- `.safe-area-bottom`
- `.safe-area-inset`

**Savings:** ~10 lines removed

---

## Consolidation Status

| Aspect | Status | Notes |
|--------|--------|-------|
| Safe area variables | ✅ Reduced | Now only `--safe-area-top` and `--safe-area-bottom` defined (used for iOS notch) |
| Font definitions | ⚠️ Partial | Could consolidate design-tokens.css + design-system.css further |
| Color palette | ✅ Good | All color tokens are actively used |
| Typography | ✅ Cleaned | Removed unused heading vars, kept functional utilities |
| Spacing variables | ⚠️ Keep | `--space-*` defined but not used (Tailwind handles spacing) |

---

## Files Status

| File | Changes | Lines Removed |
|------|---------|---------------|
| `src/App.css` | ❌ DELETED | 13 |
| `src/styles/design-system.css` | ✅ Modified | ~40 |
| `src/styles/design-tokens.css` | ✅ Modified | ~15 |
| `src/styles/mobile.css` | ✅ Modified | ~10 |
| `src/index.css` | ✅ No changes | — |

**Total Lines Removed:** ~78 lines
**Overall CSS Reduction:** ~18% from cleanup files

---

## Build Status

✅ **All CSS files compile without errors**
✅ **App builds successfully**
✅ **No breaking changes to components**

---

## What Wasn't Changed (But Could Be)

These are lower priority optimizations that don't break anything:

1. **`src/styles/design-system.css` – Spacing variables**
   - `--space-xs` through `--space-5xl` are defined but not used
   - Components rely on Tailwind spacing instead
   - Could be removed if no future plans to use

2. **Merge design-tokens.css + design-system.css**
   - Both files define similar tokens
   - Could consolidate into one file (~200 line reduction)
   - Lower priority since they don't conflict

3. **Remove Mobile Spacing Variables**
   - `--mobile-spacing-xs` through `--mobile-spacing-xl` in mobile.css
   - Not currently used in code
   - Could remove if Tailwind handles all mobile spacing

---

## Verification Checklist

- ✅ App.css deleted - no import errors
- ✅ No references to `--font-heading` in code
- ✅ No references to removed heading classes
- ✅ All active utilities still available
- ✅ Platform badge colors working
- ✅ Page background colors working
- ✅ Safe area utilities functional (top/bottom only)
- ✅ CSS compiles without syntax errors

