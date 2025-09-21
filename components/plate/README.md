# SaveToPlate Widget

A master widget for saving various items (restaurants, recipes, photos, videos) to the user's Plate with confirmation dialog, idempotent persistence, and optimistic UI updates.

## Features

- ✅ **Confirmation Dialog**: "Save to Plate?" with OK/Cancel
- ✅ **Idempotent Persistence**: Duplicate saves are handled gracefully
- ✅ **Optimistic UI Updates**: Immediate visual feedback
- ✅ **Success/Error Toasts**: User-friendly notifications
- ✅ **Accessibility**: Focus trap, keyboard navigation, ARIA labels
- ✅ **Multiple Variants**: Icon and button styles
- ✅ **Size Options**: Small, medium, large
- ✅ **Type Safety**: Full TypeScript support

## Usage

### Basic Usage

```tsx
import { SaveToPlate } from './components/plate/SaveToPlate';

// Icon variant
<SaveToPlate
  itemId="restaurant-123"
  itemType="restaurant"
  title="The Golden Spoon"
  imageUrl="/images/restaurant.jpg"
/>

// Button variant
<SaveToPlate
  itemId="recipe-456"
  itemType="recipe"
  title="Chocolate Chip Cookies"
  variant="button"
  size="lg"
/>
```

### Props

| Prop           | Type                                             | Default  | Description                    |
| -------------- | ------------------------------------------------ | -------- | ------------------------------ |
| `itemId`       | `string`                                         | -        | Unique identifier for the item |
| `itemType`     | `'restaurant' \| 'recipe' \| 'photo' \| 'video'` | -        | Type of item being saved       |
| `title`        | `string`                                         | -        | Display name for the item      |
| `imageUrl`     | `string`                                         | -        | Image URL for the item         |
| `variant`      | `'icon' \| 'button'`                             | `'icon'` | Visual style variant           |
| `size`         | `'sm' \| 'md' \| 'lg'`                           | `'md'`   | Size of the widget             |
| `defaultSaved` | `boolean`                                        | `false`  | Initial saved state            |
| `onSaved`      | `() => void`                                     | -        | Callback when item is saved    |
| `onUnsaved`    | `() => void`                                     | -        | Callback when item is unsaved  |
| `className`    | `string`                                         | -        | Additional CSS classes         |

### Item Types

- **`restaurant`**: Restaurant/place items
- **`recipe`**: Recipe/cooking items
- **`photo`**: Photo/image items
- **`video`**: Video content items

### Variants

#### Icon Variant

```tsx
<SaveToPlate
  itemId="item-123"
  itemType="restaurant"
  variant="icon"
  size="md" // sm, md, lg
/>
```

#### Button Variant

```tsx
<SaveToPlate
  itemId="item-123"
  itemType="recipe"
  variant="button"
  size="lg" // sm, md, lg
/>
```

## Integration Examples

### Restaurant Card

```tsx
import { SaveToPlate } from "../plate/SaveToPlate";

function RestaurantCard({ restaurant }) {
  return (
    <div className="restaurant-card">
      <h3>{restaurant.name}</h3>
      <SaveToPlate
        itemId={restaurant.placeId}
        itemType="restaurant"
        title={restaurant.name}
        imageUrl={restaurant.image}
        variant="icon"
        size="sm"
      />
    </div>
  );
}
```

### Recipe Card

```tsx
function RecipeCard({ recipe }) {
  return (
    <div className="recipe-card">
      <h3>{recipe.title}</h3>
      <SaveToPlate
        itemId={recipe.id}
        itemType="recipe"
        title={recipe.title}
        imageUrl={recipe.image}
        variant="button"
        size="md"
      />
    </div>
  );
}
```

## Database Schema

The widget uses the `plate_items` table:

```sql
CREATE TABLE plate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_id UUID NOT NULL REFERENCES plates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('restaurant', 'recipe', 'photo', 'video')),
  item_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plate_id, item_type, item_id)
);
```

## API Functions

### `plateSave(params)`

Saves an item to the user's plate with idempotency.

```tsx
import { plateSave } from "../src/lib/plate";

await plateSave({
  itemId: "restaurant-123",
  itemType: "restaurant",
  metadata: {
    title: "The Golden Spoon",
    imageUrl: "/images/restaurant.jpg",
  },
});
```

### `plateList(options)`

Retrieves items from the user's plate.

```tsx
import { plateList } from "../src/lib/plate";

// Get all items
const items = await plateList();

// Get only restaurants
const restaurants = await plateList({ itemType: "restaurant" });
```

### `plateRemove(itemId, itemType)`

Removes an item from the user's plate.

```tsx
import { plateRemove } from "../src/lib/plate";

await plateRemove("restaurant-123", "restaurant");
```

### `plateIsSaved(itemId, itemType)`

Checks if an item is saved to the user's plate.

```tsx
import { plateIsSaved } from "../src/lib/plate";

const isSaved = await plateIsSaved("restaurant-123", "restaurant");
```

## Toast Notifications

The widget uses a toast system for user feedback:

```tsx
import { ToastProvider, useToast } from "../components/ui/Toast";

// Wrap your app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>;

// Use in components
function MyComponent() {
  const { showSuccess, showError } = useToast();

  const handleSave = () => {
    showSuccess("Saved!", "Item saved to your Plate");
  };
}
```

## Accessibility

- **Focus Management**: Automatic focus on confirmation dialog
- **Keyboard Navigation**: Escape key closes dialog
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Trap**: Prevents focus from leaving dialog

## Testing

See `SaveToPlateDemo.tsx` for comprehensive usage examples and testing scenarios.

## Dependencies

- `framer-motion`: Animations and transitions
- `lucide-react`: Icons
- `@supabase/supabase-js`: Database operations
- React 18+ with hooks
