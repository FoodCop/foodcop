import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-6eeb9061/health", (c) => {
  return c.json({ status: "ok" });
});

// Get user profile
app.get("/make-server-6eeb9061/profile/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log(`Error fetching user profile for user ${userId}:`, error);
      
      // If user doesn't exist, return a demo user profile
      if (error.code === 'PGRST116') {
        console.log('User not found in database, returning demo profile');
        return c.json({ 
          user: {
            id: userId,
            name: 'Demo User',
            username: 'demouser',
            email: 'demo@plate.app',
            bio: 'Food lover and culinary explorer 🍕🍜🍰',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
            location: 'San Francisco, CA',
            website: 'https://plate.app',
            created_at: new Date().toISOString(),
          }
        });
      }
      
      return c.json({ error: error.message }, 500);
    }

    return c.json({ user: data });
  } catch (error) {
    console.log('Error in /profile/:userId route:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Update user profile
app.put("/make-server-6eeb9061/profile/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify user is authorized
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    
    const { data, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.log(`Error updating user profile for user ${userId}:`, error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ user: data });
  } catch (error) {
    console.log('Error in PUT /profile/:userId route:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user posts
app.get("/make-server-6eeb9061/posts/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const posts = await kv.getByPrefix(`posts:${userId}`);
    
    // Filter out null values and extract the value field
    const validPosts = posts
      .filter(p => p && p.value)
      .map(p => p.value);
    
    // If no posts exist, return demo data
    if (validPosts.length === 0) {
      const demoPosts = [
        {
          id: '1',
          content: 'Just discovered this amazing new sushi place downtown! The omakase was absolutely incredible. 🍣',
          image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
        {
          id: '2',
          content: 'Sunday brunch at The Garden Cafe was perfect. Their avocado toast is life-changing! 🥑',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
        {
          id: '3',
          content: 'Trying out this new recipe for homemade pasta tonight. Wish me luck! 🍝',
          image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
          timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        },
        {
          id: '4',
          content: 'Coffee date at my favorite spot. Their flat white never disappoints ☕',
          timestamp: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        },
      ];
      return c.json({ posts: demoPosts });
    }
    
    return c.json({ posts: validPosts });
  } catch (error) {
    console.log('Error fetching posts:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user photos
app.get("/make-server-6eeb9061/photos/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const photos = await kv.getByPrefix(`photos:${userId}`);
    
    // Filter out null values and extract the value field
    const validPhotos = photos
      .filter(p => p && p.value)
      .map(p => p.value);
    
    // If no photos exist, return demo data
    if (validPhotos.length === 0) {
      const demoPhotos = [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1hcmdoZXJpdGF8ZW58MXx8fHwxNzYxMjQxNDgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Classic Margherita',
        },
        {
          id: '2',
          url: 'https://images.unsplash.com/photo-1656439659132-24c68e36b553?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwZm9vZHxlbnwxfHx8fDE3NjExNDk4NDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Gourmet Burger',
        },
        {
          id: '3',
          url: 'https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzYxMTkzNjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Fresh Sushi Platter',
        },
        {
          id: '4',
          url: 'https://images.unsplash.com/photo-1697652973385-ccf1e85496b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW1lbiUyMG5vb2RsZXMlMjBib3dsfGVufDF8fHx8MTc2MTIwMjg0OHww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Ramen Bowl',
        },
        {
          id: '5',
          url: 'https://images.unsplash.com/photo-1620019989479-d52fcedd99fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNhbGFkJTIwYm93bHxlbnwxfHx8fDE3NjExODEzNDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Fresh Salad Bowl',
        },
        {
          id: '6',
          url: 'https://images.unsplash.com/photo-1736840334919-aac2d5af73e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NjExODgwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Chocolate Dessert',
        },
        {
          id: '7',
          url: 'https://images.unsplash.com/photo-1711539137930-3fa2ae6cec60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBwYXN0YSUyMGRpc2h8ZW58MXx8fHwxNzYxMTM3MjU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Truffle Pasta',
        },
        {
          id: '8',
          url: 'https://images.unsplash.com/photo-1676471970358-1cff04452e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVha2Zhc3QlMjBhdm9jYWRvJTIwdG9hc3R8ZW58MXx8fHwxNzYxMjM0ODUyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Avocado Toast',
        },
        {
          id: '9',
          url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBsYXR0ZSUyMGFydHxlbnwxfHx8fDE3NjExNDE2NTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Latte Art',
        },
      ];
      return c.json({ photos: demoPhotos });
    }
    
    return c.json({ photos: validPhotos });
  } catch (error) {
    console.log('Error fetching photos:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user recipes
app.get("/make-server-6eeb9061/recipes/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const recipes = await kv.getByPrefix(`recipes:${userId}`);
    
    // Filter out null values and extract the value field
    const validRecipes = recipes
      .filter(r => r && r.value)
      .map(r => r.value);
    
    // If no recipes exist, return demo data
    if (validRecipes.length === 0) {
      const demoRecipes = [
        {
          id: '1',
          title: 'Classic Truffle Pasta',
          description: 'Creamy pasta with black truffle and parmesan cheese. A luxurious dish that takes just 20 minutes to make!',
          image: 'https://images.unsplash.com/photo-1711539137930-3fa2ae6cec60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBwYXN0YSUyMGRpc2h8ZW58MXx8fHwxNzYxMTM3MjU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          prepTime: '20 mins',
          difficulty: 'Easy',
        },
        {
          id: '2',
          title: 'Gourmet Burger Stack',
          description: 'Juicy beef patty with caramelized onions, aged cheddar, and secret sauce on a brioche bun.',
          image: 'https://images.unsplash.com/photo-1656439659132-24c68e36b553?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwZm9vZHxlbnwxfHx8fDE3NjExNDk4NDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          prepTime: '30 mins',
          difficulty: 'Medium',
        },
        {
          id: '3',
          title: 'Homemade Sushi Rolls',
          description: 'Fresh salmon and avocado rolls with perfectly seasoned sushi rice. Impress your guests!',
          image: 'https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzYxMTkzNjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
          prepTime: '45 mins',
          difficulty: 'Hard',
        },
        {
          id: '4',
          title: 'Authentic Ramen Bowl',
          description: 'Rich pork broth with handmade noodles, soft-boiled egg, and fresh vegetables.',
          image: 'https://images.unsplash.com/photo-1697652973385-ccf1e85496b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW1lbiUyMG5vb2RsZXMlMjBib3dsfGVufDF8fHx8MTc2MTIwMjg0OHww&ixlib=rb-4.1.0&q=80&w=1080',
          prepTime: '60 mins',
          difficulty: 'Hard',
        },
        {
          id: '5',
          title: 'Rainbow Power Bowl',
          description: 'Quinoa bowl packed with roasted vegetables, chickpeas, and tahini dressing. Healthy and delicious!',
          image: 'https://images.unsplash.com/photo-1620019989479-d52fcedd99fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNhbGFkJTIwYm93bHxlbnwxfHx8fDE3NjExODEzNDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          prepTime: '25 mins',
          difficulty: 'Easy',
        },
        {
          id: '6',
          title: 'Decadent Chocolate Cake',
          description: 'Moist chocolate layers with rich ganache frosting. Perfect for special occasions!',
          image: 'https://images.unsplash.com/photo-1736840334919-aac2d5af73e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NjExODgwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          prepTime: '90 mins',
          difficulty: 'Medium',
        },
      ];
      return c.json({ recipes: demoRecipes });
    }
    
    return c.json({ recipes: validRecipes });
  } catch (error) {
    console.log('Error fetching recipes:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user offers and ads
app.get("/make-server-6eeb9061/offers/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const offers = await kv.getByPrefix(`offers:${userId}`);
    
    // Filter out null values and extract the value field
    const validOffers = offers
      .filter(o => o && o.value)
      .map(o => o.value);
    
    // If no offers exist, return demo data
    if (validOffers.length === 0) {
      const demoOffers = [
        {
          id: '1',
          title: '20% Off Your Next Pizza',
          description: 'Get 20% off any large pizza at Pizzeria Napoli. Valid until end of month!',
          discount: 20,
          validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          restaurant: 'Pizzeria Napoli',
        },
        {
          id: '2',
          title: 'Buy One Get One Free Burgers',
          description: 'BOGO deal on all gourmet burgers every Tuesday at Burger House.',
          discount: 50,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          restaurant: 'Burger House',
        },
        {
          id: '3',
          title: 'Happy Hour Sushi Special',
          description: '30% off all sushi rolls from 4-6 PM daily at Sushi Palace.',
          discount: 30,
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          restaurant: 'Sushi Palace',
        },
        {
          id: '4',
          title: 'Free Dessert with Entree',
          description: 'Enjoy a complimentary dessert with any main course at The Sweet Spot.',
          discount: 100,
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          restaurant: 'The Sweet Spot',
        },
        {
          id: '5',
          title: '15% Off Brunch',
          description: 'Weekend brunch discount at Sunrise Cafe. Includes bottomless mimosas!',
          discount: 15,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          restaurant: 'Sunrise Cafe',
        },
      ];
      return c.json({ offers: demoOffers });
    }
    
    return c.json({ offers: validOffers });
  } catch (error) {
    console.log('Error fetching offers:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user videos
app.get("/make-server-6eeb9061/videos/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const videos = await kv.getByPrefix(`videos:${userId}`);
    
    // Filter out null values and extract the value field
    const validVideos = videos
      .filter(v => v && v.value)
      .map(v => v.value);
    
    // If no videos exist, return demo data
    if (validVideos.length === 0) {
      const demoVideos = [
        {
          id: '1',
          title: 'How to Make Perfect Pasta',
          thumbnail: 'https://images.unsplash.com/photo-1711539137930-3fa2ae6cec60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBwYXN0YSUyMGRpc2h8ZW58MXx8fHwxNzYxMTM3MjU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
          duration: '12:45',
          views: '24.5K',
        },
        {
          id: '2',
          title: 'Burger Assembly Masterclass',
          thumbnail: 'https://images.unsplash.com/photo-1656439659132-24c68e36b553?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwZm9vZHxlbnwxfHx8fDE3NjExNDk4NDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          duration: '8:30',
          views: '18.2K',
        },
        {
          id: '3',
          title: 'Sushi Rolling Tutorial',
          thumbnail: 'https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzYxMTkzNjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
          duration: '15:20',
          views: '32.1K',
        },
        {
          id: '4',
          title: 'Ramen Broth Secrets',
          thumbnail: 'https://images.unsplash.com/photo-1697652973385-ccf1e85496b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW1lbiUyMG5vb2RsZXMlMjBib3dsfGVufDF8fHx8MTc2MTIwMjg0OHww&ixlib=rb-4.1.0&q=80&w=1080',
          duration: '20:15',
          views: '45.8K',
        },
        {
          id: '5',
          title: 'Coffee Latte Art Guide',
          thumbnail: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBsYXR0ZSUyMGFydHxlbnwxfHx8fDE3NjExNDE2NTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
          duration: '6:40',
          views: '12.3K',
        },
        {
          id: '6',
          title: 'Cake Decorating Tips',
          thumbnail: 'https://images.unsplash.com/photo-1736840334919-aac2d5af73e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NjExODgwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          duration: '18:55',
          views: '28.7K',
        },
      ];
      return c.json({ videos: demoVideos });
    }
    
    return c.json({ videos: validVideos });
  } catch (error) {
    console.log('Error fetching videos:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user crew (friends)
app.get("/make-server-6eeb9061/crew/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const crew = await kv.getByPrefix(`crew:${userId}`);
    
    // Filter out null values and extract the value field
    const validCrew = crew
      .filter(c => c && c.value)
      .map(c => c.value);
    
    // If no crew exists, return demo data
    if (validCrew.length === 0) {
      const demoCrew = [
        {
          id: '1',
          name: 'Sarah Chen',
          username: 'sarahchen',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
          bio: 'Pastry chef & food blogger',
        },
        {
          id: '2',
          name: 'Marcus Rodriguez',
          username: 'marcusr',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
          bio: 'BBQ enthusiast',
        },
        {
          id: '3',
          name: 'Emily Watson',
          username: 'emilyw',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
          bio: 'Vegan recipe creator',
        },
        {
          id: '4',
          name: 'David Kim',
          username: 'davidkim',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
          bio: 'Sushi master',
        },
        {
          id: '5',
          name: 'Isabella Martinez',
          username: 'isabellamtz',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=isabella',
          bio: 'Italian cuisine lover',
        },
        {
          id: '6',
          name: 'James Taylor',
          username: 'jamest',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
          bio: 'Coffee connoisseur',
        },
        {
          id: '7',
          name: 'Aisha Patel',
          username: 'aishap',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha',
          bio: 'Spice expert',
        },
        {
          id: '8',
          name: 'Ryan O\'Connor',
          username: 'ryanoc',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ryan',
          bio: 'Brunch aficionado',
        },
      ];
      return c.json({ crew: demoCrew });
    }
    
    return c.json({ crew: validCrew });
  } catch (error) {
    console.log('Error fetching crew:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user places (restaurants)
app.get("/make-server-6eeb9061/places/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const places = await kv.getByPrefix(`places:${userId}`);
    
    // Filter out null values and extract the value field
    const validPlaces = places
      .filter(p => p && p.value)
      .map(p => p.value);
    
    // If no places exist, return demo data
    if (validPlaces.length === 0) {
      const demoPlaces = [
        {
          id: '1',
          name: 'Osteria Moderna',
          address: '123 Main Street, San Francisco, CA',
          cuisine: 'Italian',
          rating: 4.8,
          priceRange: '$$$',
        },
        {
          id: '2',
          name: 'Sushi Palace',
          address: '456 Market Street, San Francisco, CA',
          cuisine: 'Japanese',
          rating: 4.9,
          priceRange: '$$$$',
        },
        {
          id: '3',
          name: 'La Cocina',
          address: '789 Valencia Street, San Francisco, CA',
          cuisine: 'Mexican',
          rating: 4.7,
          priceRange: '$$',
        },
        {
          id: '4',
          name: 'Burger House',
          address: '321 Castro Street, San Francisco, CA',
          cuisine: 'American',
          rating: 4.6,
          priceRange: '$$',
        },
        {
          id: '5',
          name: 'The Ramen Spot',
          address: '654 Geary Boulevard, San Francisco, CA',
          cuisine: 'Japanese Ramen',
          rating: 4.8,
          priceRange: '$$$',
        },
        {
          id: '6',
          name: 'Green Garden Cafe',
          address: '987 Hayes Street, San Francisco, CA',
          cuisine: 'Vegan',
          rating: 4.5,
          priceRange: '$$',
        },
        {
          id: '7',
          name: 'Pizzeria Napoli',
          address: '147 Columbus Avenue, San Francisco, CA',
          cuisine: 'Italian Pizza',
          rating: 4.7,
          priceRange: '$$',
        },
        {
          id: '8',
          name: 'Brew & Bean',
          address: '258 Divisadero Street, San Francisco, CA',
          cuisine: 'Coffee & Pastries',
          rating: 4.9,
          priceRange: '$',
        },
      ];
      return c.json({ places: demoPlaces });
    }
    
    return c.json({ places: validPlaces });
  } catch (error) {
    console.log('Error fetching places:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// POST endpoints for saving content

// Save a post
app.post("/make-server-6eeb9061/posts/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    // Generate unique key for the post
    const timestamp = Date.now();
    const postId = body.id || `post-${timestamp}`;
    const key = `posts:${userId}:${postId}`;
    
    const postData = {
      id: postId,
      ...body,
      userId,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    
    await kv.set(key, postData);
    
    console.log(`Post saved successfully for user ${userId}:`, postId);
    return c.json({ success: true, post: postData });
  } catch (error) {
    console.log('Error saving post:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Save a photo
app.post("/make-server-6eeb9061/photos/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const timestamp = Date.now();
    const photoId = body.id || `photo-${timestamp}`;
    const key = `photos:${userId}:${photoId}`;
    
    const photoData = {
      id: photoId,
      ...body,
      userId,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    
    await kv.set(key, photoData);
    
    console.log(`Photo saved successfully for user ${userId}:`, photoId);
    return c.json({ success: true, photo: photoData });
  } catch (error) {
    console.log('Error saving photo:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Save a recipe
app.post("/make-server-6eeb9061/recipes/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const timestamp = Date.now();
    const recipeId = body.id || `recipe-${timestamp}`;
    const key = `recipes:${userId}:${recipeId}`;
    
    const recipeData = {
      id: recipeId,
      ...body,
      userId,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    
    await kv.set(key, recipeData);
    
    console.log(`Recipe saved successfully for user ${userId}:`, recipeId);
    return c.json({ success: true, recipe: recipeData });
  } catch (error) {
    console.log('Error saving recipe:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Save an offer
app.post("/make-server-6eeb9061/offers/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const timestamp = Date.now();
    const offerId = body.id || `offer-${timestamp}`;
    const key = `offers:${userId}:${offerId}`;
    
    const offerData = {
      id: offerId,
      ...body,
      userId,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    
    await kv.set(key, offerData);
    
    console.log(`Offer saved successfully for user ${userId}:`, offerId);
    return c.json({ success: true, offer: offerData });
  } catch (error) {
    console.log('Error saving offer:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Save a video
app.post("/make-server-6eeb9061/videos/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const timestamp = Date.now();
    const videoId = body.id || `video-${timestamp}`;
    const key = `videos:${userId}:${videoId}`;
    
    const videoData = {
      id: videoId,
      ...body,
      userId,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    
    await kv.set(key, videoData);
    
    console.log(`Video saved successfully for user ${userId}:`, videoId);
    return c.json({ success: true, video: videoData });
  } catch (error) {
    console.log('Error saving video:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Save a crew member
app.post("/make-server-6eeb9061/crew/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const timestamp = Date.now();
    const memberId = body.id || `crew-${timestamp}`;
    const key = `crew:${userId}:${memberId}`;
    
    const crewData = {
      id: memberId,
      ...body,
      userId,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    
    await kv.set(key, crewData);
    
    console.log(`Crew member saved successfully for user ${userId}:`, memberId);
    return c.json({ success: true, crew: crewData });
  } catch (error) {
    console.log('Error saving crew member:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Save a place
app.post("/make-server-6eeb9061/places/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const timestamp = Date.now();
    const placeId = body.id || `place-${timestamp}`;
    const key = `places:${userId}:${placeId}`;
    
    const placeData = {
      id: placeId,
      ...body,
      userId,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    
    await kv.set(key, placeData);
    
    console.log(`Place saved successfully for user ${userId}:`, placeId);
    return c.json({ success: true, place: placeData });
  } catch (error) {
    console.log('Error saving place:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Batch save endpoint - saves multiple items at once
app.post("/make-server-6eeb9061/batch-save/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    
    const results = {
      posts: [],
      photos: [],
      recipes: [],
      offers: [],
      videos: [],
      crew: [],
      places: [],
    };
    
    // Save posts
    if (body.posts && Array.isArray(body.posts)) {
      for (const post of body.posts) {
        const timestamp = Date.now();
        const postId = post.id || `post-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const key = `posts:${userId}:${postId}`;
        const postData = { id: postId, ...post, userId, createdAt: post.createdAt || new Date().toISOString() };
        await kv.set(key, postData);
        results.posts.push(postData);
      }
    }
    
    // Save photos
    if (body.photos && Array.isArray(body.photos)) {
      for (const photo of body.photos) {
        const timestamp = Date.now();
        const photoId = photo.id || `photo-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const key = `photos:${userId}:${photoId}`;
        const photoData = { id: photoId, ...photo, userId, createdAt: photo.createdAt || new Date().toISOString() };
        await kv.set(key, photoData);
        results.photos.push(photoData);
      }
    }
    
    // Save recipes
    if (body.recipes && Array.isArray(body.recipes)) {
      for (const recipe of body.recipes) {
        const timestamp = Date.now();
        const recipeId = recipe.id || `recipe-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const key = `recipes:${userId}:${recipeId}`;
        const recipeData = { id: recipeId, ...recipe, userId, createdAt: recipe.createdAt || new Date().toISOString() };
        await kv.set(key, recipeData);
        results.recipes.push(recipeData);
      }
    }
    
    // Save offers
    if (body.offers && Array.isArray(body.offers)) {
      for (const offer of body.offers) {
        const timestamp = Date.now();
        const offerId = offer.id || `offer-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const key = `offers:${userId}:${offerId}`;
        const offerData = { id: offerId, ...offer, userId, createdAt: offer.createdAt || new Date().toISOString() };
        await kv.set(key, offerData);
        results.offers.push(offerData);
      }
    }
    
    // Save videos
    if (body.videos && Array.isArray(body.videos)) {
      for (const video of body.videos) {
        const timestamp = Date.now();
        const videoId = video.id || `video-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const key = `videos:${userId}:${videoId}`;
        const videoData = { id: videoId, ...video, userId, createdAt: video.createdAt || new Date().toISOString() };
        await kv.set(key, videoData);
        results.videos.push(videoData);
      }
    }
    
    // Save crew
    if (body.crew && Array.isArray(body.crew)) {
      for (const member of body.crew) {
        const timestamp = Date.now();
        const memberId = member.id || `crew-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const key = `crew:${userId}:${memberId}`;
        const crewData = { id: memberId, ...member, userId, createdAt: member.createdAt || new Date().toISOString() };
        await kv.set(key, crewData);
        results.crew.push(crewData);
      }
    }
    
    // Save places
    if (body.places && Array.isArray(body.places)) {
      for (const place of body.places) {
        const timestamp = Date.now();
        const placeId = place.id || `place-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const key = `places:${userId}:${placeId}`;
        const placeData = { id: placeId, ...place, userId, createdAt: place.createdAt || new Date().toISOString() };
        await kv.set(key, placeData);
        results.places.push(placeData);
      }
    }
    
    console.log(`Batch save completed for user ${userId}:`, {
      posts: results.posts.length,
      photos: results.photos.length,
      recipes: results.recipes.length,
      offers: results.offers.length,
      videos: results.videos.length,
      crew: results.crew.length,
      places: results.places.length,
    });
    
    return c.json({ success: true, results });
  } catch (error) {
    console.log('Error in batch save:', error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);