# shadcn/ui Setup for FUZO Next.js

## Overview

This Next.js app now uses shadcn/ui components scoped to `apps/web-next/components/ui/*`. All components are designed to work with TweakCN for live theming.

## Structure

```
apps/web-next/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   └── input.tsx
│   └── auth/                  # Authentication components
├── lib/
│   ├── utils.ts              # cn() helper function
│   └── variants.ts           # CVA variants for theming
├── styles/
│   └── tokens.css            # CSS variables for theming
└── components.json           # shadcn/ui configuration
```

## Components Available

### Core Components

- **Button** - Various styles and sizes
- **Card** - Content containers with header, content, footer
- **Avatar** - User profile images with fallback
- **Badge** - Status indicators and labels
- **Separator** - Visual dividers
- **Input** - Form input fields

### Custom Variants

- **heroButtonVariants** - Custom button styles for landing page
- **cardVariants** - Themed card styles
- **navItemVariants** - Navigation item styles

## Theming

### CSS Variables

All theming is controlled via CSS variables in `styles/tokens.css`:

```css
:root {
  /* FUZO Brand Colors */
  --fuzo-coral: #f14c35;
  --fuzo-navy: #0b1f3a;
  --fuzo-yellow: #ffd74a;
  --fuzo-cream: #fff8f0;
  --fuzo-charcoal: #2c3e50;
  --fuzo-mint: #7fdbda;

  /* Design tokens */
  --radius: 0.75rem;
  --space-md: 1rem;
  /* ... */
}
```

### TweakCN Integration

- All colors use CSS variables for live theming
- Components use `cn()` helper for conditional classes
- Variants are defined with CVA for type safety

## Usage

### Import Specific Components

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
```

### Use Custom Variants

```tsx
import { heroButtonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

<Button className={cn(heroButtonVariants({ variant: "primary", size: "lg" }))}>
  Click me
</Button>;
```

### Apply Brand Colors

```tsx
<div className="bg-[var(--fuzo-coral)] text-white">FUZO Branded Content</div>
```

## ESLint Rules

The app includes ESLint rules to prevent barrel imports:

```js
"no-restricted-imports": [
  "error",
  {
    paths: [
      {
        name: "@/components/ui",
        message: "Import specific primitives, not the barrel."
      }
    ]
  }
]
```

## Dependencies

### Core shadcn/ui

- `clsx` - Conditional class names
- `tailwind-merge` - Merge Tailwind classes
- `class-variance-authority` - Component variants
- `@radix-ui/react-*` - Headless UI primitives

### Styling

- `tailwindcss-animate` - Animation utilities
- `lucide-react` - Icons (when needed)

## Next Steps

1. **Add More Components**: Generate additional shadcn/ui components as needed
2. **TweakCN Integration**: Connect to TweakCN for live theming
3. **Dark Mode**: Implement dark mode toggle
4. **Component Library**: Build out more custom variants

## Notes

- All components are scoped to Next.js app only
- No impact on legacy Vite app
- Components use modern React patterns (forwardRef, etc.)
- Fully typed with TypeScript
- Accessible by default via Radix UI primitives
