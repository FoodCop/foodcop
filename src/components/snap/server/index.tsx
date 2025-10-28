import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
app.get("/make-server-906257ef/health", (c) => {
  return c.json({ status: "ok" });
});

// Get user stats endpoint (for gamification)
app.get("/make-server-906257ef/user-stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // For now, return mock stats
    // When ready, implement real logic using accessToken to identify user
    const stats = {
      totalPhotos: 42,
      points: 420,
      level: 5,
      restaurantsVisited: 28,
      recentAchievements: [
        { name: "First Snap", date: new Date().toISOString() },
        { name: "Restaurant Explorer", date: new Date().toISOString() }
      ]
    };

    return c.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return c.json({ error: 'Failed to fetch user stats' }, 500);
  }
});

// Save photo endpoint (optional - can also save directly from frontend)
app.post("/make-server-906257ef/save-photo", async (c) => {
  try {
    const body = await c.req.json();
    const { metadata, restaurant } = body;

    // Create Supabase client with service role for server-side operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Save to database (adjust table name and columns to match your schema)
    const { data, error } = await supabase
      .from('photos')
      .insert({
        restaurant_name: restaurant.name,
        cuisine_type: restaurant.cuisine,
        rating: restaurant.rating,
        description: restaurant.description,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        location_accuracy: metadata.accuracy,
        captured_at: metadata.timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error while saving photo:', error);
      return c.json({ error: 'Failed to save photo data', details: error.message }, 500);
    }

    return c.json({ success: true, photoId: data.id });
  } catch (error) {
    console.error('Error in save-photo endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);