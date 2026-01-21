# FUZO Design System - Quick Start Guide

**Get productive in 5 minutes** 🚀

---

## 📦 What You Need to Know

The FUZO app now has a **comprehensive design system** with **300+ design tokens** that eliminate the need for hardcoded values. Everything is centralized in `src/styles/design-tokens.css`.

---

## 🎨 Common Tasks

### 1. Using Colors

**❌ DON'T:**
```tsx
<div className="bg-[#FF6900]">...</div>
<div style={{ backgroundColor: '#FF6900' }}>...</div>
```

**✅ DO:**
```tsx
<div className="bg-fuzo-orange-500">...</div>
```

**Quick Reference:**
- Primary: `bg-fuzo-orange-500` or `text-fuzo-orange-500`
- Secondary: `bg-fuzo-pink-500`
- Accent (Tako AI): `bg-fuzo-purple-500`
- Platform badges:
  - Google: `bg-platform-google`
  - YouTube: `bg-platform-youtube`
  - Spoonacular: `bg-platform-spoonacular`
  - FUZO: `bg-platform-fuzo`

### 2. Using Buttons

**❌ DON'T:**
```tsx
<button className="bg-[#FF6900] text-white px-6 py-3 rounded-full">
  Click Me
</button>
```

**✅ DO:**
```tsx
import { Button } from "@/components/ui/button";

<Button>Click Me</Button>  {/* Primary orange */}
<Button variant="secondary">Like</Button>  {/* Pink */}
<Button variant="accent">Ask Tako</Button>  {/* Purple */}
<Button variant="outline">Cancel</Button>  {/* Outline */}
<Button variant="ghost">More</Button>  {/* Minimal */}
```

**Sizes:**
```tsx
<Button size="sm">Small</Button>    {/* 32px */}
<Button size="default">Medium</Button>  {/* 44px - Default */}
<Button size="lg">Large</Button>    {/* 56px */}
<Button size="icon"><Icon /></Button>  {/* 44px square */}
```

### 3. Using Typography

**❌ DON'T:**
```tsx
<h1 style={{ fontFamily: 'Google Sans Flex', fontSize: '3rem' }}>
  Title
</h1>
```

**✅ DO:**
```tsx
<h1 className="font-display text-5xl font-bold">Title</h1>
```

**Quick Reference:**
- Display text (headings): `font-display`
- Body text (paragraphs): `font-body`
- UI labels: `font-ui`
- Buttons: `font-button`

**Text Sizes:**
```tsx
text-xs   {/* 11px - Metadata */}
text-sm   {/* 13px - Captions */}
text-base {/* 16px - Body text */}
text-lg   {/* 19px - Emphasized */}
text-xl   {/* 23px - Subheadings */}
text-2xl  {/* 28px - Card titles */}
text-3xl  {/* 33px - Section headings */}
text-4xl  {/* 40px - Page headings */}
text-5xl  {/* 48px - Hero mobile */}
```

### 4. Using Spacing

**❌ DON'T:**
```tsx
<div style={{ padding: '20px', marginBottom: '64px' }}>...</div>
```

**✅ DO:**
```tsx
<div className="p-5 mb-16">...</div>
```

**Quick Reference:**
- `p-1` = 4px (tight)
- `p-2` = 8px (compact)
- `p-3` = 12px (inline)
- `p-4` = 16px (default gap)
- `p-5` = 20px (content padding)
- `p-6` = 24px (stack spacing)
- `p-8` = 32px (large)
- `p-16` = 64px (section spacing)

### 5. Using Shadows

**❌ DON'T:**
```tsx
<div style={{ boxShadow: '-2px 4px 12px 4px rgba(51,51,51,0.05)' }}>
  ...
</div>
```

**✅ DO:**
```tsx
<div className="shadow-card">...</div>
<button className="shadow-button hover:shadow-button-hover">...</button>
```

**Quick Reference:**
- `shadow-card` - Feed/Bites cards
- `shadow-button` - Button default
- `shadow-button-hover` - Button hover
- `shadow-lg` - Modals, dropdowns
- `shadow-xl` - Maximum elevation

### 6. Using Border Radius

**❌ DON'T:**
```tsx
<div style={{ borderRadius: '10px' }}>...</div>
```

**✅ DO:**
```tsx
<div className="rounded-card">...</div>
<button className="rounded-button">...</button>
```

**Quick Reference:**
- `rounded-card` - 10px (cards)
- `rounded-button` - Full (buttons)
- `rounded-phone` - 36px (phone mockups)

### 7. Adding Loading States

**❌ DON'T:**
```tsx
{isLoading && <div>Loading...</div>}
```

**✅ DO:**
```tsx
import { FeedCardSkeleton, BitesCardSkeleton } from "@/components/ui/skeleton";

{isLoading && <FeedCardSkeleton />}
{isLoading && <BitesCardSkeleton />}
```

**Available Skeletons:**
- `FeedCardSkeleton` - Feed cards (335×540px)
- `BitesCardSkeleton` - Recipe cards (masonry)
- `ScoutCardSkeleton` - Restaurant cards
- `ListItemSkeleton` - Chat/comments
- `ButtonSkeleton` - Buttons
- `TextSkeleton` - Multi-line text

### 8. Platform Badges

**Standard Pattern:**
```tsx
<div className="feed-card-badge absolute bottom-3 right-3
                bg-platform-google z-10">
  G
</div>
```

**Quick Reference:**
- Google: `bg-platform-google` + "G"
- YouTube: `bg-platform-youtube` + "Y"
- Spoonacular: `bg-platform-spoonacular` + "S"
- FUZO: `bg-platform-fuzo` + "F"

---

## 🔍 Finding Design Tokens

### Method 1: Check the Design System
Open `DESIGN-SYSTEM.md` and search for what you need.

### Method 2: Check the Source
Open `src/styles/design-tokens.css` and browse all 300+ tokens.

### Method 3: Check Tailwind Config
Open `tailwind.config.js` to see all available Tailwind classes.

---

## 📋 Common Patterns

### Feed Card
```tsx
<div className="w-[335px] h-[540px] bg-white rounded-card shadow-card overflow-hidden">
  <div className="relative aspect-[9/16]">
    <img src="..." className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
      <h2 className="feed-card-title">Title</h2>
      <p className="feed-card-subtitle">Subtitle</p>
    </div>
    <div className="feed-card-badge absolute bottom-3 right-3 bg-platform-google z-20">
      G
    </div>
  </div>
</div>
```

### Button Group
```tsx
<div className="flex gap-3">
  <Button variant="secondary">
    <Heart className="w-5 h-5" />
    Like
  </Button>
  <Button variant="outline">
    <Share className="w-5 h-5" />
    Share
  </Button>
  <Button variant="ghost" size="icon">
    <Bookmark className="w-5 h-5" />
  </Button>
</div>
```

### Section Heading
```tsx
<section className="py-16">
  <h2 className="font-display text-4xl font-bold text-center mb-6">
    Section Title
  </h2>
  <p className="font-body text-lg text-center text-secondary max-w-2xl mx-auto">
    Section description text
  </p>
</section>
```

---

## 🚨 Anti-Patterns (Don't Do This)

### ❌ Hardcoded Colors
```tsx
// BAD
<div className="bg-[#FF6900]">...</div>
<div style={{ color: '#FF6900' }}>...</div>

// GOOD
<div className="bg-fuzo-orange-500">...</div>
```

### ❌ Inline Styles
```tsx
// BAD
<div style={{ padding: '20px', fontSize: '16px' }}>...</div>

// GOOD
<div className="p-5 text-base">...</div>
```

### ❌ !important Flags
```tsx
// BAD
.my-class {
  color: red !important;
}

// GOOD - Use proper specificity or design tokens
.my-class {
  color: var(--color-error);
}
```

### ❌ Magic Numbers
```tsx
// BAD
<div className="w-[335px] h-[540px]">...</div>

// GOOD - Use design tokens when available
<div className="w-[var(--card-mobile-width)] h-[var(--card-mobile-height)]">
```

---

## 🎯 Key Principles

1. **Use design tokens** for all visual properties
2. **Use Button component** instead of custom buttons
3. **Use skeleton loaders** for loading states
4. **Use semantic classes** (bg-fuzo-orange-500) over arbitrary values
5. **Follow mobile-first** responsive design
6. **Ensure 44px minimum** touch targets
7. **Test dark mode** for all new components

---

## 📚 Full Documentation

For complete details, see:
- `DESIGN-SYSTEM.md` - Complete design system guide (15+ pages)
- `STYLING-UPGRADE-SUMMARY.md` - Implementation summary
- `BUTTON-SHOWCASE.md` - Button component guide
- `src/styles/design-tokens.css` - All 300+ design tokens

---

## 💡 Tips

### VS Code Setup
1. Install "Tailwind CSS IntelliSense" extension
2. Get autocomplete for all Tailwind classes
3. Hover over classes to see computed values

### Testing Colors
```tsx
// Quick test of all brand colors
<div className="flex gap-2">
  <div className="w-10 h-10 bg-fuzo-orange-500" />
  <div className="w-10 h-10 bg-fuzo-pink-500" />
  <div className="w-10 h-10 bg-fuzo-purple-500" />
</div>
```

### Dark Mode Testing
```tsx
// Toggle dark mode in browser console
document.documentElement.classList.toggle('dark');
```

---

## 🆘 Need Help?

1. **Search** `DESIGN-SYSTEM.md` for guidelines
2. **Browse** `design-tokens.css` for available tokens
3. **Check** `BUTTON-SHOWCASE.md` for button examples
4. **Review** `STYLING-UPGRADE-SUMMARY.md` for before/after examples

---

**Last Updated:** 2026-01-19
**Version:** 1.0.0
