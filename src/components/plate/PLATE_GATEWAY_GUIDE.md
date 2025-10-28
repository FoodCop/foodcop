# Plate Gateway Integration Guide

This guide explains how external components can send data to the Plate component using the PlateGateway utility.

## Overview

The PlateGateway provides an idempotent interface for saving content (posts, photos, recipes, offers, videos, crew members, and places) to a user's Plate profile. When data is saved, the Plate component automatically refreshes to display the new content.

## Quick Start

### 1. Import the Gateway

```typescript
import { createPlateGateway, plateAPI } from './utils/plateGateway';
```

### 2. Two Ways to Use the Gateway

#### Option A: Create a Gateway Instance (Recommended for multiple operations)

```typescript
const userId = '00000000-0000-0000-0000-000000000001';
const gateway = createPlateGateway(userId);

// Save a post
await gateway.savePost({
  content: 'Just discovered the best tacos in town! 🌮',
  image: 'https://example.com/image.jpg',
});

// Save a recipe
await gateway.saveRecipe({
  title: 'Homemade Pasta',
  description: 'Fresh pasta made from scratch',
  prepTime: '45 mins',
  difficulty: 'Medium',
});
```

#### Option B: Use the Direct API (For one-off operations)

```typescript
const userId = '00000000-0000-0000-0000-000000000001';

await plateAPI.savePost(userId, {
  content: 'Amazing pizza at Luigi\'s!',
  image: 'https://example.com/pizza.jpg',
});
```

## API Reference

### Save Individual Items

#### Save a Post
```typescript
await gateway.savePost({
  id?: string;              // Optional: auto-generated if not provided
  content: string;          // Required: post text content
  image?: string;           // Optional: image URL
  timestamp?: string;       // Optional: auto-generated if not provided
  [key: string]: any;       // Any additional fields
});
```

#### Save a Photo
```typescript
await gateway.savePhoto({
  id?: string;              // Optional
  url: string;              // Required: photo URL
  caption?: string;         // Optional: photo caption
  [key: string]: any;
});
```

#### Save a Recipe
```typescript
await gateway.saveRecipe({
  id?: string;              // Optional
  title: string;            // Required
  description: string;      // Required
  image?: string;           // Optional
  prepTime?: string;        // Optional: e.g., "30 mins"
  difficulty?: string;      // Optional: "Easy", "Medium", "Hard"
  [key: string]: any;
});
```

#### Save an Offer
```typescript
await gateway.saveOffer({
  id?: string;              // Optional
  title: string;            // Required
  description: string;      // Required
  discount?: number;        // Optional: discount percentage
  validUntil?: string;      // Optional: expiration date
  restaurant?: string;      // Optional: restaurant name
  [key: string]: any;
});
```

#### Save a Video
```typescript
await gateway.saveVideo({
  id?: string;              // Optional
  title: string;            // Required
  thumbnail?: string;       // Optional: video thumbnail URL
  duration?: string;        // Optional: e.g., "12:45"
  views?: string;           // Optional: e.g., "24.5K"
  [key: string]: any;
});
```

#### Save a Crew Member
```typescript
await gateway.saveCrew({
  id?: string;              // Optional
  name: string;             // Required
  username: string;         // Required
  avatar?: string;          // Optional: avatar URL
  bio?: string;             // Optional: user bio
  [key: string]: any;
});
```

#### Save a Place
```typescript
await gateway.savePlace({
  id?: string;              // Optional
  name: string;             // Required
  address: string;          // Required
  cuisine?: string;         // Optional: cuisine type
  rating?: number;          // Optional: 1-5 rating
  priceRange?: string;      // Optional: "$", "$$", "$$$", "$$$$"
  [key: string]: any;
});
```

### Batch Save (Efficient for Multiple Items)

```typescript
await gateway.batchSave({
  posts: [{ content: 'Post 1' }, { content: 'Post 2' }],
  photos: [{ url: 'photo1.jpg' }, { url: 'photo2.jpg' }],
  recipes: [{ title: 'Recipe 1', description: 'Desc 1' }],
  offers: [{ title: 'Offer 1', description: 'Desc 1' }],
  videos: [{ title: 'Video 1' }],
  crew: [{ name: 'John', username: 'john' }],
  places: [{ name: 'Restaurant', address: '123 Main St' }],
});
```

## Complete Example

Here's a complete example of an idempotent component that saves data to Plate:

```typescript
import { useState } from 'react';
import { createPlateGateway } from './utils/plateGateway';
import { Button } from './components/ui/button';
import { toast } from 'sonner';

export function FoodDiscoveryComponent({ userId }: { userId: string }) {
  const [saving, setSaving] = useState(false);
  const gateway = createPlateGateway(userId);

  const handleSavePost = async () => {
    setSaving(true);
    try {
      const result = await gateway.savePost({
        content: 'Just tried the new sushi place downtown. Absolutely incredible! 🍣',
        image: 'https://images.unsplash.com/photo-sushi.jpg',
      });

      if (result.success) {
        toast.success('Post saved to your Plate!');
      } else {
        toast.error('Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleBatchSave = async () => {
    setSaving(true);
    try {
      const result = await gateway.batchSave({
        posts: [
          { content: 'Post 1 about food' },
          { content: 'Post 2 about restaurants' },
        ],
        places: [
          { name: 'Great Restaurant', address: '123 Food St' },
        ],
      });

      if (result.success) {
        toast.success(`Saved ${result.results.posts.length} posts and ${result.results.places.length} places!`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button onClick={handleSavePost} disabled={saving}>
        Save Post to Plate
      </Button>
      <Button onClick={handleBatchSave} disabled={saving}>
        Batch Save to Plate
      </Button>
    </div>
  );
}
```

## How It Works

1. **Idempotency**: Each save operation uses unique IDs. If you don't provide an ID, one is auto-generated using a timestamp and random string.

2. **Real-time Updates**: When data is saved via the gateway, a custom event is dispatched. The Plate component listens for these events and automatically refreshes the relevant tab.

3. **Data Storage**: All data is stored in the Supabase KV store with user-specific prefixes (e.g., `posts:userId:postId`).

4. **Error Handling**: All methods return `{ success: boolean; data?: any; error?: string }` so you can handle errors gracefully.

## Backend Endpoints

The gateway communicates with these backend endpoints:

- `POST /make-server-6eeb9061/posts/:userId` - Save a post
- `POST /make-server-6eeb9061/photos/:userId` - Save a photo
- `POST /make-server-6eeb9061/recipes/:userId` - Save a recipe
- `POST /make-server-6eeb9061/offers/:userId` - Save an offer
- `POST /make-server-6eeb9061/videos/:userId` - Save a video
- `POST /make-server-6eeb9061/crew/:userId` - Save a crew member
- `POST /make-server-6eeb9061/places/:userId` - Save a place
- `POST /make-server-6eeb9061/batch-save/:userId` - Batch save multiple items

## Testing

You can test the gateway in the browser console:

```javascript
// Import the gateway
import { createPlateGateway } from './utils/plateGateway';

// Create instance
const gateway = createPlateGateway('00000000-0000-0000-0000-000000000001');

// Save a test post
await gateway.savePost({
  content: 'Test post from console!',
});
```

## Demo Data

If no data exists in the KV store, the Plate component will display demo content automatically. Once you save real data, it will replace the demo content.
