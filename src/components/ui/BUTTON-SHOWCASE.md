# Button Component Showcase

## Available Variants

### Primary (Default) - FUZO Orange
```tsx
<Button>Primary Action</Button>
<Button variant="default">Primary Action</Button>
```
**Usage:** Main CTAs, primary actions, submit buttons
**Color:** FUZO Orange (#FF6900)

### Secondary - FUZO Pink
```tsx
<Button variant="secondary">Secondary Action</Button>
```
**Usage:** Secondary CTAs, like/favorite actions
**Color:** FUZO Pink (#F6339A)

### Accent - FUZO Purple
```tsx
<Button variant="accent">Special Feature</Button>
```
**Usage:** Tako AI, premium features, special actions
**Color:** FUZO Purple (#AD46FF)

### Destructive - Error Red
```tsx
<Button variant="destructive">Delete</Button>
```
**Usage:** Delete, remove, destructive actions
**Color:** Red (#EF4444)

### Outline - Bordered Primary
```tsx
<Button variant="outline">Outlined Action</Button>
```
**Usage:** Secondary actions with less emphasis
**Color:** Orange border, transparent background

### Outline Secondary - Bordered Pink
```tsx
<Button variant="outline-secondary">Secondary Outline</Button>
```
**Usage:** Alternative secondary actions
**Color:** Pink border, transparent background

### Ghost - Minimal
```tsx
<Button variant="ghost">Ghost Action</Button>
```
**Usage:** Subtle actions, tertiary buttons, toolbar buttons
**Color:** Gray, minimal styling

### Link Style
```tsx
<Button variant="link">Learn More</Button>
```
**Usage:** Inline text links, navigation links
**Style:** Underline on hover, no background

## Sizes

### Small
```tsx
<Button size="sm">Small Button</Button>
```
**Height:** 32px
**Padding:** 16px horizontal
**Usage:** Compact UI, tags, chips

### Default (Medium)
```tsx
<Button size="default">Default Button</Button>
<Button>Default Button</Button>
```
**Height:** 44px ✅ Touch target compliant
**Padding:** 24px horizontal
**Usage:** Standard buttons throughout the app

### Large
```tsx
<Button size="lg">Large Button</Button>
```
**Height:** 56px
**Padding:** 32px horizontal
**Usage:** Hero CTAs, prominent actions

### Icon Button
```tsx
<Button size="icon">
  <Icon />
</Button>
```
**Size:** 44px × 44px ✅ Touch target compliant
**Usage:** Icon-only buttons

## States

### Default
Normal resting state with shadow

### Hover
Darker background, elevated shadow

### Active
Pressed down effect with `scale-95`

### Focus
4px ring with brand color at 30% opacity

### Disabled
```tsx
<Button disabled>Disabled Button</Button>
```
50% opacity, no pointer events, shows disabled cursor

## Examples

### Complete Example
```tsx
import { Button } from "@/components/ui/button";
import { Heart, Share, Bookmark } from "lucide-react";

function FeedActions() {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" size="default">
        <Heart className="w-5 h-5" />
        Like
      </Button>

      <Button variant="outline" size="default">
        <Share className="w-5 h-5" />
        Share
      </Button>

      <Button variant="ghost" size="icon">
        <Bookmark className="w-5 h-5" />
      </Button>
    </div>
  );
}
```

### Landing Page CTA
```tsx
<Button size="lg" className="font-bold">
  START <i className="fa-solid fa-arrow-right ml-2"></i>
</Button>
```

### Form Actions
```tsx
<div className="flex gap-3 justify-end">
  <Button variant="ghost">Cancel</Button>
  <Button type="submit">Save Changes</Button>
</div>
```

### Tako AI Button
```tsx
<Button variant="accent">
  Ask Tako AI
</Button>
```

## Accessibility

✅ **Touch Targets:** Default and icon sizes meet 44px minimum
✅ **Focus Indicators:** Visible 4px ring on keyboard focus
✅ **Disabled State:** Properly communicated with cursor and opacity
✅ **Color Contrast:** All variants meet WCAG AA standards
✅ **Active State:** Visual feedback on press with scale transform

## Design Tokens Used

- `--fuzo-orange-500`: Primary brand color
- `--fuzo-pink-500`: Secondary brand color
- `--fuzo-purple-500`: Accent color
- `--font-button`: Roboto font family
- `--font-weight-semibold`: 600 weight
- `--radius-button`: Fully rounded (9999px)
- `--shadow-button`: Default button shadow
- `--shadow-button-hover`: Elevated hover shadow
- `--duration-normal`: 200ms transition
- `--ease-out`: Smooth easing

## Migration from Old Buttons

### Before (Hardcoded)
```tsx
<button className="bg-[#FF6900] text-white px-6 py-3 rounded-full">
  Click Me
</button>
```

### After (Component)
```tsx
<Button>Click Me</Button>
```

### Before (Custom Styling)
```tsx
<button
  style={{
    backgroundColor: '#F6339A',
    color: 'white',
    borderRadius: '9999px'
  }}
>
  Like
</button>
```

### After (Variant)
```tsx
<Button variant="secondary">Like</Button>
```
