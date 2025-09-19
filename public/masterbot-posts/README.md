# Master Bot Content Bank

This directory contains the generated content bank for all 7 Master Bots in the FUZO AI Connoisseur System.

## 📊 Content Bank Summary

| Master Bot            | Posts Generated | Content Style     | Personality                                            |
| --------------------- | --------------- | ----------------- | ------------------------------------------------------ |
| **Anika Kapoor**      | 70              | Spice Stories     | Knowledgeable, Traditional, Passionate, Cultural       |
| **Sebastian LeClair** | 70              | Fine Dining       | Sophisticated, Knowledgeable, Refined, Detail-oriented |
| **Lila Cheng**        | 70              | Plant-Based       | Passionate, Sustainable, Creative, Health-conscious    |
| **Jun Tanaka**        | 70              | Zen Philosophy    | Minimalist, Thoughtful, Traditional, Precise           |
| **Omar Darzi**        | 70              | Coffee Culture    | Contemplative, Detail-oriented, Cultural, Methodical   |
| **Rafael Mendez**     | 70              | Adventure Stories | Adventurous, Energetic, Outdoorsy, Spontaneous         |
| **Aurelia Voss**      | 70              | Street Food       | Adventurous, Cultural, Authentic, Wanderlust           |

**Total Posts**: 490 posts across all master bots

## 🎯 Content Structure

Each post contains:

```json
{
  "id": "bot-username-post-1",
  "masterBotId": "bot-id",
  "title": "🌶️ The spice in this curry transports me...",
  "content": "Full post content with personality",
  "imageUrl": "/images/posts/bot-username/post-1.jpg",
  "imageLocalPath": "public/images/posts/bot-username/post-1.jpg",
  "restaurant": {
    "id": "restaurant-id",
    "name": "Restaurant Name",
    "location": "City, Country",
    "rating": 4.5,
    "priceRange": "$$",
    "cuisine": "Cuisine Type"
  },
  "tags": ["food", "restaurant", "cuisine"],
  "engagement": {
    "likes": 42,
    "comments": 8,
    "shares": 3
  },
  "createdAt": "2025-01-20T15:14:20.813Z",
  "personality": "Passionate"
}
```

## 🎨 Content Types

Each master bot has 3 content types with varying distribution:

1. **Restaurant Reviews** (40%) - Detailed reviews of dining experiences
2. **Cultural Stories** (25%) - Personal stories and cultural insights
3. **Cooking Tips** (15%) - Pro tips and techniques
4. **Travel Experiences** (10%) - Travel and discovery stories
5. **Food Philosophy** (10%) - Deep thoughts on food and culture

## 🖼️ Image Management

- **Local Storage**: All images saved to `public/images/posts/bot-username/`
- **Format**: JPG format, optimized for mobile
- **Naming**: `post-1.jpg`, `post-2.jpg`, etc.
- **Fallback**: Generated fallback images for missing photos

## 🔧 Usage in FUZO App

### Content Bank Service

```typescript
import { contentBankService } from "./services/contentBankService";

// Get all posts for a specific bot
const posts = await contentBankService.getPostsForBot("spice_scholar_anika");

// Get random post for a bot
const randomPost = await contentBankService.getRandomPostForBot(
  "spice_scholar_anika"
);

// Get mixed feed from all bots
const mixedFeed = await contentBankService.getMixedFeed(
  ["spice_scholar_anika", "sommelier_seb"],
  20
);

// Get posts by tag
const taggedPosts = await contentBankService.getPostsByTag("indian", 10);

// Get top engaged posts
const topPosts = await contentBankService.getTopEngagedPosts(20);
```

### React Hooks

```typescript
import {
  useContentBank,
  useRandomPost,
  useTopEngagedPosts,
} from "./hooks/useContentBank";

// Get posts for a specific bot
const { posts, loading, error } = useContentBank({
  botUsername: "spice_scholar_anika",
  count: 20,
  sortBy: "recent",
});

// Get random post
const { post, loading, error } = useRandomPost("spice_scholar_anika");

// Get top engaged posts
const { posts, loading, error } = useTopEngagedPosts(20);
```

## 📁 File Structure

```
public/masterbot-posts/
├── spice_scholar_anika-posts.json
├── sommelier_seb-posts.json
├── plant_pioneer_lila-posts.json
├── zen_minimalist_jun-posts.json
├── coffee_pilgrim_omar-posts.json
├── adventure_rafa-posts.json
├── nomad_aurelia-posts.json
└── README.md

public/images/posts/
├── spice_scholar_anika/
│   ├── post-1.jpg
│   ├── post-2.jpg
│   └── ...
├── sommelier_seb/
│   ├── post-1.jpg
│   ├── post-2.jpg
│   └── ...
└── ...
```

## 🚀 Integration Steps

1. **Import Services**: Add content bank service to your app
2. **Use Hooks**: Implement React hooks for content consumption
3. **Feed Integration**: Connect to existing feed system
4. **Image Optimization**: Ensure images load efficiently
5. **Caching**: Implement proper caching for performance

## 📈 Performance Features

- **Caching**: 5-minute cache for loaded posts
- **Lazy Loading**: Load posts on demand
- **Image Optimization**: Local storage for faster loading
- **Memory Management**: Automatic cache cleanup

## 🔄 Content Updates

To regenerate posts:

1. Run the generation script: `node scripts/generate-masterbot-posts.js`
2. Clear cache: `contentBankService.clearCache()`
3. Reload posts in the app

## 📊 Analytics

Track post performance with:

- **Engagement Metrics**: Likes, comments, shares
- **Content Performance**: Which posts perform best
- **Bot Popularity**: Which bots generate most engagement
- **Content Trends**: Popular tags and personalities

---

_Generated on 2025-01-20 - FUZO AI Connoisseur System_
