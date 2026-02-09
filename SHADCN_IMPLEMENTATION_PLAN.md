# shadcn UI Implementation Plan
**Project**: FuzoFoodCop  
**Date**: February 7, 2026  
**Goal**: Enhance UI consistency, improve UX, and enable dynamic theming while maintaining Material UI icons

---

## Executive Summary

We're in an excellent position to leverage shadcn UI components throughout the app. Our **lean 5-color system** and **design tokens** are already integrated with Tailwind CSS and shadcn components. This plan outlines how to systematically improve the UI by replacing custom-styled divs with proper shadcn components while keeping our Material UI icons intact.

---

## Current State ✅

### What We Have
1. **shadcn UI Installed**: 50+ Radix UI components ready to use
2. **Lean Color System**: 5 core colors defined in CSS variables
   - `--color-primary`: #ffe838 (Banana Yellow)
   - `--color-secondary`: #e89f3c (Orange)
   - `--color-accent`: #ffffff (White)
   - `--color-neutral-bg`: #f3f4f6 (Light Gray)
   - `--color-neutral-text`: #1f2937 (Dark Gray)
3. **Design Tokens**: Typography, spacing, semantic colors all defined
4. **Material UI Icons**: @mui/icons-material v7.3.7 (keeping these!)
5. **Tailwind CSS**: v4 with CSS variables already configured

### Component Inventory
Current shadcn components available in `/src/components/ui/`:
- accordion, alert-dialog, alert, avatar, badge, button
- card, carousel, checkbox, dialog, drawer, dropdown-menu
- form, input, label, select, sheet, switch
- table, tabs, textarea, tooltip
- And 30+ more...

### Current Issues
- Inconsistent styling across pages
- Custom divs with repetitive Tailwind classes
- Hard-coded colors in some components
- No centralized theme switching
- Dark mode defined but not activated

---

## Goals 🎯

### Primary Objectives
1. **UI Consistency**: Use shadcn components everywhere for unified look
2. **Better UX**: Leverage accessible, tested Radix UI primitives
3. **Dynamic Theming**: Enable user-customizable color schemes
4. **Maintainability**: Reduce code duplication, centralize styling
5. **Performance**: No impact (shadcn is lightweight)

### Non-Goals
- ❌ Replace Material UI icons (keeping all of them!)
- ❌ Complete redesign (incremental improvements)
- ❌ Break existing functionality

---

## Implementation Strategy

### Phase 1: Foundation (Week 1)
**Goal**: Set up theming infrastructure

#### Tasks:
1. **Create Theme Provider**
   - File: `src/contexts/ThemeContext.tsx`
   - Support: light, dark, and custom themes
   - Store theme preference in localStorage
   - Export `useTheme()` hook

2. **Activate Dark Mode**
   - Already defined in `src/index.css` (`.dark` class)
   - Connect to Theme Provider
   - Test all pages in dark mode
   - Fix any contrast issues

3. **Create Theme Switcher Component**
   - File: `src/components/settings/ThemeSelector.tsx`
   - UI: Simple dropdown or toggle
   - Location: User profile menu or settings page
   - Options: Light, Dark, System (auto)

4. **Document Theme Usage**
   - Update design-tokens.css with examples
   - Create quick reference for developers

**Deliverables**:
- Working theme switcher
- Dark mode fully functional
- Documentation for team

**Estimated Time**: 2-3 days

---

### Phase 2: Component Migration (Weeks 2-4)
**Goal**: Replace custom UI with shadcn components

#### Priority 1: High-Impact Components
These are used frequently and will give immediate visual improvement:

**Buttons** (`<Button>`)
- Files to update:
  - `src/components/feed/FeedCard.tsx`
  - `src/components/scout/Scout.tsx`
  - `src/components/bites/Bites.tsx`
  - `src/components/snap/Snap.tsx`
  - `src/components/snap/SnapDesktop.tsx`
- Current: `<button className="px-4 py-2 rounded-full...">`
- Replace with: `<Button variant="default" size="md">`
- Keep: All MUI icons inside buttons

**Cards** (`<Card>`, `<CardHeader>`, `<CardContent>`)
- Files to update:
  - `src/components/feed/FeedCard.tsx`
  - `src/components/bites/BitesCard.tsx`
  - `src/components/plate/PlateCard.tsx`
- Current: `<div className="bg-white rounded-xl shadow...">`
- Replace with: `<Card><CardContent>...</CardContent></Card>`
- Benefit: Consistent shadows, padding, borders

**Dialogs** (`<Dialog>`, `<DialogContent>`)
- Files to update:
  - `src/components/snap/Snap.tsx` (tagging dialog)
  - `src/components/scout/Scout.tsx` (place details)
  - `src/components/feed/FeedCard.tsx` (delete confirmations)
- Current: Custom modals with fixed positioning
- Replace with: Radix Dialog (accessible, scroll-locked)
- Benefit: Better mobile behavior, escape key support

**Inputs** (`<Input>`, `<Textarea>`, `<Select>`)
- Files to update:
  - `src/components/scout/Scout.tsx` (search input)
  - `src/components/bites/Bites.tsx` (filter inputs)
  - `src/components/snap/Snap.tsx` (tag input)
- Current: `<input className="border rounded...">`
- Replace with: `<Input placeholder="..." />`
- Benefit: Consistent focus states, validation styling

#### Priority 2: Navigation Components

**Dropdown Menus** (`<DropdownMenu>`)
- Files to update:
  - `src/App.tsx` (user profile menu)
  - `src/components/navigation/FloatingActionMenu.tsx`
- Current: Custom dropdown logic
- Replace with: Radix DropdownMenu
- Benefit: Keyboard navigation, ARIA support

**Tabs** (`<Tabs>`)
- Files to update:
  - `src/components/bites/Bites.tsx` (category tabs)
  - `src/components/plate/Plate.tsx` (section tabs)
- Current: Custom tab implementation
- Replace with: Radix Tabs
- Benefit: Accessible, animated transitions

#### Priority 3: Forms

**Form Components** (`<Form>`, `<FormField>`)
- Files to update:
  - `src/components/auth/AuthPage.tsx`
  - `src/components/onboarding/OnboardingFlow.tsx`
- Current: Manual form state management
- Replace with: shadcn Form (React Hook Form wrapper)
- Benefit: Built-in validation, error messages

**Switch & Checkbox** (`<Switch>`, `<Checkbox>`)
- Files to update:
  - Settings pages
  - Filter dialogs
- Current: Custom toggle implementations
- Replace with: Radix Switch/Checkbox
- Benefit: Accessible, smooth animations

#### Migration Process (Per Component)
1. **Audit**: Find all instances of the pattern
2. **Test**: Create test page with shadcn version
3. **Replace**: Update one file at a time
4. **Verify**: Check mobile + desktop + dark mode
5. **Commit**: Small, focused commits per file

**Deliverables**:
- All major UI components using shadcn
- Consistent look across all pages
- Improved accessibility scores

**Estimated Time**: 2-3 weeks (incremental)

---

### Phase 3: Theme Customization (Week 5)
**Goal**: Enable user-customizable themes

#### Tasks:
1. **Create Theme Presets**
   - File: `src/config/themePresets.ts`
   - Presets:
     - Default (current banana yellow)
     - Vibrant (orange/red)
     - Cool (blue/teal)
     - Minimal (grayscale)

2. **Theme Customization Panel**
   - File: `src/components/settings/ThemeCustomizer.tsx`
   - UI: Color pickers for 5 core colors
   - Preview: Live preview of changes
   - Reset: Restore defaults
   - Save: Persist to user profile in Supabase

3. **User Theme Storage**
   - Table: `user_preferences.theme_config` (JSON)
   - Load on auth
   - Apply automatically

**Deliverables**:
- 4+ theme presets
- Custom theme builder UI
- Per-user theme persistence

**Estimated Time**: 1 week

---

### Phase 4: Polish & Optimization (Week 6)
**Goal**: Fine-tune and fix edge cases

#### Tasks:
1. **Color Contrast Audit**
   - Tool: Chrome DevTools Lighthouse
   - Fix: Any WCAG AA failures
   - Document: Contrast ratios for core colors

2. **Animation Polish**
   - Add: Smooth transitions between themes
   - Reduce: Motion for users with prefers-reduced-motion
   - Test: Performance on low-end devices

3. **Documentation**
   - Update: README.md with theme instructions
   - Create: Component usage guide
   - Video: Quick tutorial for customization

4. **Testing**
   - Test: All pages in light/dark/custom themes
   - Test: Mobile Safari, Chrome, Firefox
   - Fix: Any visual regressions

**Deliverables**:
- Accessibility score >90
- Smooth theme transitions
- Complete documentation

**Estimated Time**: 4-5 days

---

## Technical Details

### Color Token Architecture

```css
/* Core 5-color palette (user-customizable) */
:root {
  --color-primary: #ffe838;      /* CTAs, highlights */
  --color-secondary: #e89f3c;    /* Hover states */
  --color-accent: #ffffff;        /* Backgrounds */
  --color-neutral-bg: #f3f4f6;   /* Disabled states */
  --color-neutral-text: #1f2937; /* Body text */
}

/* Button mappings (dynamic) */
:root {
  --button-bg-default: var(--color-primary);
  --button-bg-hover: var(--color-secondary);
  --button-bg-active: var(--color-accent);
  --button-text: var(--color-neutral-text);
}
```

**How it works**:
- User changes `--color-primary` → entire app updates
- No rebuild needed (CSS variables are runtime)
- Can be changed via JavaScript: `document.documentElement.style.setProperty('--color-primary', '#ff0000')`

### Theme Switching Code

```typescript
// src/contexts/ThemeContext.tsx
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'custom'>('light');
  const [customColors, setCustomColors] = useState<ColorConfig | null>(null);

  const applyTheme = (newTheme: string, colors?: ColorConfig) => {
    document.documentElement.className = newTheme;
    
    if (colors) {
      Object.entries(colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyTheme, customColors }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Component Migration Example

**Before** (Custom styled div):
```tsx
<button 
  className="px-4 py-2 rounded-full bg-yellow-400 hover:bg-orange-400 
             text-gray-900 font-medium transition-colors"
  onClick={handleClick}
>
  <CameraAlt sx={{ fontSize: 18 }} />
  Take Photo
</button>
```

**After** (shadcn Button with MUI icon):
```tsx
import { Button } from '@/components/ui/button';
import { CameraAlt } from '@mui/icons-material';

<Button variant="default" onClick={handleClick}>
  <CameraAlt sx={{ fontSize: 18 }} />
  Take Photo
</Button>
```

**Benefits**:
- ✅ Automatically uses `--button-bg-default` from theme
- ✅ Accessible (focus states, aria attributes)
- ✅ Less code (no repetitive Tailwind classes)
- ✅ MUI icon works perfectly
- ✅ Theme switching works automatically

---

## File Structure

```
src/
├── components/
│   ├── ui/                      # shadcn components (already exist)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (50+ components)
│   └── settings/                # NEW - Theme customization
│       ├── ThemeSelector.tsx    # Light/Dark/System toggle
│       └── ThemeCustomizer.tsx  # Color picker panel
├── contexts/
│   └── ThemeContext.tsx         # NEW - Theme provider
├── config/
│   └── themePresets.ts          # NEW - Predefined themes
└── styles/
    ├── lean-colors.css          # ✅ Existing - Core 5 colors
    ├── design-tokens.css        # ✅ Existing - Typography, spacing
    └── index.css                # ✅ Existing - Dark mode defined
```

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue**: Breaking existing styles during migration
- **Solution**: Migrate one component type at a time, test thoroughly
- **Rollback**: Git commits are small and focused

**Issue**: Dark mode contrast issues
- **Solution**: Test with Chrome DevTools contrast checker
- **Fix**: Adjust `--color-neutral-text` for dark backgrounds

**Issue**: Performance on low-end devices
- **Solution**: CSS variables are performant, no JavaScript overhead
- **Test**: Lighthouse performance score before/after

**Issue**: User confusion with theming
- **Solution**: Start with presets only, advanced customization optional
- **Default**: Current banana yellow theme (no surprises)

---

## Success Metrics

### Quantitative
- ✅ Lighthouse Accessibility score: >90 (currently ~85)
- ✅ Lighthouse Performance score: >95 (maintain current)
- ✅ Lines of CSS reduced: -30% (less duplication)
- ✅ Component reuse: +50% (shadcn vs custom divs)

### Qualitative
- ✅ Consistent visual language across all pages
- ✅ Dark mode available for users
- ✅ Easier for developers to add new features
- ✅ Better mobile UX (accessible components)

---

## Quick Start Checklist

When you start implementing, follow this order:

### Week 1: Theme Infrastructure
- [ ] Create `ThemeContext.tsx`
- [ ] Add theme provider to `App.tsx`
- [ ] Create `ThemeSelector.tsx` component
- [ ] Test light/dark mode switching
- [ ] Add theme selector to user menu

### Week 2: High-Impact Migrations
- [ ] Migrate all buttons to `<Button>`
- [ ] Test SNAP buttons (mobile + desktop)
- [ ] Test Feed action buttons
- [ ] Test Scout search button

### Week 3: Cards & Dialogs
- [ ] Migrate FeedCard to `<Card>`
- [ ] Migrate SNAP tagging dialog to `<Dialog>`
- [ ] Test mobile responsiveness

### Week 4: Inputs & Forms
- [ ] Migrate Scout search input
- [ ] Migrate Bites filter inputs
- [ ] Test form validation

### Week 5: Customization
- [ ] Create theme presets
- [ ] Build color picker UI
- [ ] Connect to Supabase storage

### Week 6: Polish
- [ ] Run Lighthouse audits
- [ ] Fix accessibility issues
- [ ] Write documentation
- [ ] Deploy to production

---

## Resources

### Documentation
- shadcn UI: https://ui.shadcn.com/docs
- Radix UI Primitives: https://www.radix-ui.com/primitives
- Tailwind CSS Variables: https://tailwindcss.com/docs/customizing-colors#using-css-variables
- Material UI Icons: https://mui.com/material-ui/material-icons/

### Existing Project Files
- Color System: `/src/styles/lean-colors.css`
- Design Tokens: `/src/styles/design-tokens.css`
- shadcn Components: `/src/components/ui/`
- Icon Registry: `/ICON_CONSOLIDATION_MATERIAL_UI.md`

### Examples in Codebase
- Good: `/src/components/ui/button.tsx` (already uses CSS vars)
- Good: `/src/components/snap/Snap.tsx` (MUI icons + custom buttons)
- Improve: `/src/components/feed/FeedCard.tsx` (migrate to shadcn Card)

---

## Next Steps

1. **Review this plan** - Validate approach and timeline
2. **Start Phase 1** - Theme Provider infrastructure
3. **Commit small** - Each component migration is a separate commit
4. **Test continuously** - Mobile + Desktop + Dark mode
5. **Document learnings** - Update this plan as you go

---

## Notes

- **Material UI icons are safe**: They work perfectly with shadcn components
- **No breaking changes**: Incremental migration, test as you go
- **User impact**: Better UX, optional dark mode, future customization
- **Developer impact**: Less code, better consistency, easier maintenance

---

**Status**: Ready to implement  
**Owner**: Development team  
**Review Date**: After Phase 1 completion

Let's make FuzoFoodCop's UI world-class! 🎨🚀
