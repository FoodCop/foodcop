import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import figmaMCP from "./figma-mcp.tsx";

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

// External API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';

const SPOONACULAR_API_KEY = Deno.env.get('SPOONACULAR_API_KEY');
const SPOONACULAR_API_URL = 'https://api.spoonacular.com/recipes';

// Supabase configuration for server-side operations
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create Supabase client for server operations (with fallback handling)
let supabase: any = null;
try {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.warn('⚠️ Supabase credentials missing - auth endpoints will be disabled');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
}

// Helper function to authenticate user
async function authenticateUser(c: any) {
  if (!supabase) {
    return { error: 'Authentication service not configured', status: 503 };
  }
  
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { error: 'Authorization header required', status: 401 };
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { error: 'Invalid access token', status: 401 };
  }

  return { user };
}

// OAuth Configuration check endpoint
app.get("/make-server-5976446e/test-oauth-config", (c) => {
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  console.log('🔐 OAuth config check requested:', {
    hasClientId: !!googleClientId,
    hasClientSecret: !!googleClientSecret,
    clientIdPreview: googleClientId ? `${googleClientId.substring(0, 20)}...` : null
  });
  
  return c.json({
    hasClientId: !!googleClientId,
    hasClientSecret: !!googleClientSecret,
    clientIdPreview: googleClientId ? `${googleClientId.substring(0, 20)}...` : null,
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/make-server-5976446e/health", (c) => {
  const openaiConfigured = !!OPENAI_API_KEY;
  const googleMapsConfigured = !!GOOGLE_MAPS_API_KEY;
  const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
  const spoonacularConfigured = !!SPOONACULAR_API_KEY;
  
  console.log('🏥 Health check requested:', {
    openai_configured: openaiConfigured,
    google_maps_configured: googleMapsConfigured,
    supabase_configured: supabaseConfigured,
    spoonacular_configured: spoonacularConfigured
  });
  
  return c.json({ 
    status: "ok", 
    services: {
      openai_configured: openaiConfigured,
      google_maps_configured: googleMapsConfigured,
      supabase_configured: supabaseConfigured,
      spoonacular_configured: spoonacularConfigured
    },
    timestamp: new Date().toISOString()
  });
});

// DEBUG: Check saved items by email (development only) - NO AUTH REQUIRED
app.get("/make-server-5976446e/debug/saved-items/:email", async (c) => {
  try {
    const email = c.req.param('email');
    console.log('🔍 DEBUG: Checking saved items for email:', email);
    
    // Create admin client for debugging (no auth required)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!supabaseAdmin) {
      return c.json({ error: 'Supabase not configured' }, 503);
    }

    // Get user by email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing users:', authError);
      return c.json({ error: 'Failed to list users', details: authError.message }, 500);
    }

    const user = authUsers?.users?.find((u: any) => u.email === email);
    
    if (!user) {
      return c.json({ 
        found: false,
        message: `No user found with email: ${email}`,
        totalUsersInSystem: authUsers?.users?.length || 0,
        allEmails: authUsers?.users?.map((u: any) => u.email) || []
      });
    }

    console.log('✅ Found user:', { id: user.id, email: user.email });

    // Check saved_items table
    const { data: savedItems, error: itemsError } = await supabaseAdmin
      .from('saved_items')
      .select(`
        id,
        user_id,
        restaurant_id,
        saved_type,
        created_at,
        restaurant:restaurants (
          id,
          name,
          place_id
        )
      `)
      .eq('user_id', user.id);

    if (itemsError) {
      console.error('❌ Error querying saved_items:', itemsError);
      return c.json({ 
        error: 'Failed to query saved_items', 
        details: itemsError.message,
        hint: itemsError.hint,
        code: itemsError.code
      }, 500);
    }

    // Also check KV store
    const kvKey = `user_saved_restaurants_${user.id}`;
    const kvData = await kv.get(kvKey);

    return c.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      database: {
        saved_items_count: savedItems?.length || 0,
        saved_items: savedItems || []
      },
      kv_store: {
        has_data: !!kvData,
        restaurants_count: kvData?.restaurants?.length || 0,
        restaurants: kvData?.restaurants || []
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return c.json({ 
      error: 'Debug query failed', 
      details: error.message,
      stack: error.stack
    }, 500);
  }
});

// =====================================
// AUTHENTICATION ENDPOINTS
// =====================================

// Sign up with email and password
app.post("/make-server-5976446e/auth/signup", async (c) => {
  try {
    console.log('📝 Signup endpoint called');
    
    if (!supabase) {
      return c.json({ 
        error: 'Authentication service not configured',
        details: 'Supabase client initialization failed'
      }, 503);
    }
    
    const { email, password, metadata = {} } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    console.log('🚀 Creating new user account:', { email });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: metadata.fullName || metadata.display_name || email.split('@')[0],
        ...metadata
      },
      email_confirm: true
    });

    if (error) {
      console.error('❌ Failed to create user:', error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      console.error('❌ User creation returned no user');
      return c.json({ error: 'Failed to create user account' }, 500);
    }

    console.log('✅ User created successfully:', {
      id: data.user.id,
      email: data.user.email
    });

    return c.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      },
      message: 'User created successfully. You can now sign in with your credentials.'
    });

  } catch (error) {
    console.error('❌ Signup endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get user profile
app.get("/make-server-5976446e/auth/profile", async (c) => {
  try {
    console.log('👤 Getting user profile...');
    
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;
    
    const profile = {
      id: user.id,
      email: user.email,
      username: user.email?.split('@')[0] || 'user',
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'FUZO User',
      bio: '',
      avatar_url: user.user_metadata?.avatar_url || null,
      location_city: null,
      location_state: null,
      location_country: null,
      dietary_preferences: [],
      cuisine_preferences: [],
      total_points: 0,
      current_level: 1,
      is_private: false,
      created_at: user.created_at,
      last_seen_at: new Date().toISOString(),
      fallback: true
    };

    console.log('✅ Retrieved user profile (fallback mode):', {
      id: profile.id,
      display_name: profile.display_name,
      username: profile.username
    });

    return c.json({ profile });

  } catch (error) {
    console.error('��� Get profile endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================
// PROFILE ENDPOINTS
// =====================================

// Get user's saved restaurants
app.get("/make-server-5976446e/profile/saved-restaurants", async (c) => {
  try {
    console.log('📋 Get saved restaurants endpoint called');
    
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }
    const userId = authResult.user.id;
    
    console.log('👤 Fetching saved restaurants for user:', userId);
    
    // Query saved_items table with restaurant join
    const { data: savedItems, error } = await supabase
      .from('saved_items')
      .select(`
        id,
        user_id,
        restaurant_id,
        saved_type,
        created_at,
        restaurant:restaurants (
          id,
          name,
          place_id,
          image,
          rating,
          cuisine,
          price,
          location,
          geometry
        )
      `)
      .eq('user_id', userId)
      .eq('saved_type', 'restaurant')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying saved_items:', error);
      return c.json({ 
        error: 'Failed to fetch saved restaurants',
        details: error.message 
      }, 500);
    }

    // Transform to expected format
    const restaurants = savedItems.map((item: any) => ({
      id: item.restaurant?.id || item.restaurant_id,
      place_id: item.restaurant?.place_id || '',
      name: item.restaurant?.name || 'Unknown Restaurant',
      image: item.restaurant?.image || null,
      rating: item.restaurant?.rating || 4.0,
      cuisine: item.restaurant?.cuisine || 'Restaurant',
      price: item.restaurant?.price || '$$',
      location: item.restaurant?.location || 'Unknown location',
      savedAt: item.created_at,
      geometry: item.restaurant?.geometry || null
    }));

    console.log('✅ Retrieved saved restaurants:', restaurants.length);

    return c.json({
      restaurants,
      totalCount: restaurants.length
    });

  } catch (error) {
    console.error('❌ Get saved restaurants error:', error);
    return c.json({ 
      error: 'Failed to retrieve saved restaurants',
      details: error.message 
    }, 500);
  }
});

// Save restaurant to user profile
app.post("/make-server-5976446e/profile/save-restaurant", async (c) => {
  try {
    console.log('💾 Save restaurant endpoint called');
    
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }
    const userId = authResult.user.id;
    
    const { restaurant } = await c.req.json();
    
    if (!restaurant || !restaurant.id) {
      return c.json({ error: 'Restaurant data with ID is required' }, 400);
    }

    console.log('💾 Saving restaurant for user:', userId, 'Restaurant:', restaurant.name);

    // First, check if restaurant exists in restaurants table
    const { data: existingRestaurant, error: checkError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('place_id', restaurant.id)
      .single();

    let restaurantId: string;

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking restaurant:', checkError);
      return c.json({ error: 'Database error', details: checkError.message }, 500);
    }

    if (existingRestaurant) {
      restaurantId = existingRestaurant.id;
      console.log('✅ Restaurant already exists:', restaurantId);
    } else {
      // Insert restaurant into restaurants table
      const { data: newRestaurant, error: insertError } = await supabase
        .from('restaurants')
        .insert({
          place_id: restaurant.id,
          name: restaurant.name,
          image: restaurant.image || null,
          rating: restaurant.rating || 4.0,
          cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : 'Restaurant',
          price: '$'.repeat(restaurant.priceLevel || 2),
          location: restaurant.address || 'Unknown location',
          geometry: restaurant.coordinates || null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error inserting restaurant:', insertError);
        return c.json({ error: 'Failed to save restaurant', details: insertError.message }, 500);
      }

      restaurantId = newRestaurant.id;
      console.log('✅ Created new restaurant:', restaurantId);
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .eq('saved_type', 'restaurant')
      .single();

    if (existingSave) {
      return c.json({
        success: true,
        message: 'Restaurant already saved',
        savedRestaurant: {
          id: restaurant.id,
          place_id: restaurant.id,
          name: restaurant.name,
          savedAt: new Date().toISOString()
        }
      });
    }

    // Insert into saved_items table
    const { data: savedItem, error: saveError } = await supabase
      .from('saved_items')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        saved_type: 'restaurant'
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Error saving to saved_items:', saveError);
      return c.json({ error: 'Failed to save restaurant', details: saveError.message }, 500);
    }

    console.log('✅ Restaurant saved successfully');

    return c.json({
      success: true,
      message: 'Restaurant saved successfully',
      savedRestaurant: {
        id: restaurant.id,
        place_id: restaurant.id,
        name: restaurant.name,
        savedAt: savedItem.created_at
      }
    });

  } catch (error) {
    console.error('❌ Save restaurant error:', error);
    return c.json({ 
      error: 'Failed to save restaurant',
      details: error.message 
    }, 500);
  }
});

// Remove restaurant from user profile
app.delete("/make-server-5976446e/profile/unsave-restaurant/:placeId", async (c) => {
  try {
    console.log('🗑️ Unsave restaurant endpoint called');
    
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }
    const userId = authResult.user.id;
    
    const placeId = c.req.param('placeId');
    
    console.log('🗑️ Unsaving restaurant for user:', userId, 'Place ID:', placeId);

    // Find the restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('place_id', placeId)
      .single();

    if (!restaurant) {
      return c.json({ 
        success: true,
        message: 'Restaurant not found or not saved' 
      });
    }

    // Delete from saved_items
    const { error: deleteError } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurant.id)
      .eq('saved_type', 'restaurant');

    if (deleteError) {
      console.error('❌ Error deleting saved item:', deleteError);
      return c.json({ error: 'Failed to unsave restaurant', details: deleteError.message }, 500);
    }

    console.log('✅ Restaurant unsaved successfully');

    return c.json({
      success: true,
      message: 'Restaurant unsaved successfully'
    });

  } catch (error) {
    console.error('❌ Unsave restaurant error:', error);
    return c.json({ 
      error: 'Failed to unsave restaurant',
      details: error.message 
    }, 500);
  }
});

// Check if restaurant is saved
app.get("/make-server-5976446e/profile/is-restaurant-saved/:placeId", async (c) => {
  try {
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ isSaved: false });
    }
    const userId = authResult.user.id;
    
    const placeId = c.req.param('placeId');

    // Find the restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('place_id', placeId)
      .single();

    if (!restaurant) {
      return c.json({ isSaved: false });
    }

    // Check if saved
    const { data: savedItem } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurant.id)
      .eq('saved_type', 'restaurant')
      .single();

    return c.json({ isSaved: !!savedItem });

  } catch (error) {
    console.error('❌ Check saved status error:', error);
    return c.json({ isSaved: false });
  }
});

// Get user's saved photos
app.get("/make-server-5976446e/profile/saved-photos", async (c) => {
  try {
    console.log('🖼️ Get saved photos endpoint called');
    
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;
    const savedPhotosKey = `user_saved_photos_${user.id}`;
    const savedData = await kv.get(savedPhotosKey) || { photos: [] };
    
    console.log('✅ Retrieved saved photos:', {
      userId: user.id,
      count: savedData.photos.length
    });

    return c.json({ 
      photos: savedData.photos,
      totalCount: savedData.photos.length,
      lastUpdated: savedData.lastUpdated
    });

  } catch (error) {
    console.error('❌ Get saved photos endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Save photo to user profile
app.post("/make-server-5976446e/profile/save-photo", async (c) => {
  try {
    console.log('📷 Save photo endpoint called');
    
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;
    const { photo } = await c.req.json();
    
    if (!photo || !photo.image || !photo.caption) {
      return c.json({ error: 'Photo data with image URL and caption is required' }, 400);
    }

    const savedPhotosKey = `user_saved_photos_${user.id}`;
    const existingSaved = await kv.get(savedPhotosKey) || { photos: [] };
    
    const savedPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      image: photo.image,
      caption: photo.caption,
      tags: photo.tags || [],
      points: photo.points || 10,
      likes: 0,
      uploadedAt: new Date().toISOString(),
      location: photo.location || null
    };

    existingSaved.photos.unshift(savedPhoto);
    existingSaved.lastUpdated = new Date().toISOString();
    
    await kv.set(savedPhotosKey, existingSaved);

    console.log('✅ Photo saved successfully:', {
      userId: user.id,
      photoId: savedPhoto.id,
      totalPhotos: existingSaved.photos.length
    });

    return c.json({ 
      success: true, 
      message: 'Photo saved successfully',
      savedPhoto,
      totalPhotos: existingSaved.photos.length
    });

  } catch (error) {
    console.error('❌ Save photo endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================
// GEOLOCATION ENDPOINTS
// =====================================

// IP-based geolocation
app.get("/make-server-5976446e/geolocation/ip", async (c) => {
  try {
    console.log('🌐 IP geolocation endpoint called');
    
    const clientIP = c.req.header('CF-Connecting-IP') || 
                     c.req.header('X-Forwarded-For') || 
                     c.req.header('X-Real-IP') || 
                     'unknown';
                     
    console.log('🔍 Client IP detected:', clientIP);
    
    try {
      const ipResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone`);
      
      if (!ipResponse.ok) {
        throw new Error(`IP API returned ${ipResponse.status}`);
      }
      
      const ipData = await ipResponse.json();
      
      if (ipData.status === 'fail') {
        throw new Error(ipData.message || 'IP geolocation failed');
      }
      
      const result = {
        latitude: ipData.lat,
        longitude: ipData.lon,
        city: ipData.city,
        region: ipData.regionName,
        country: ipData.country,
        timezone: ipData.timezone,
        method: 'ip_geolocation',
        clientIP: clientIP !== 'unknown' ? clientIP : null,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ IP geolocation success:', {
        location: `${result.city}, ${result.region}, ${result.country}`,
        coords: `${result.latitude}, ${result.longitude}`,
        clientIP
      });
      
      return c.json(result);
      
    } catch (ipError) {
      console.warn('⚠️ IP geolocation failed, using fallback:', ipError);
      
      const fallbackResult = {
        latitude: 37.7749,
        longitude: -122.4194,
        city: 'San Francisco',
        region: 'California',
        country: 'United States',
        method: 'ip_geolocation_fallback',
        fallback: true,
        error: 'Could not determine location from IP',
        timestamp: new Date().toISOString()
      };
      
      console.log('📍 Using IP geolocation fallback (San Francisco)');
      return c.json(fallbackResult);
    }
    
  } catch (error) {
    console.error('IP geolocation endpoint error:', error);
    return c.json({
      error: 'IP geolocation service failed',
      details: error.message
    }, 500);
  }
});

// Get nearby restaurants using device location
app.post("/make-server-5976446e/geolocation/nearby", async (c) => {
  try {
    console.log('🗺️ Geolocation nearby endpoint called');
    
    const { latitude, longitude, radius = 5000, type = 'restaurant' } = await c.req.json();
    
    if (!latitude || !longitude) {
      return c.json({ 
        error: 'Latitude and longitude are required' 
      }, 400);
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API key not configured - returning mock data');
      
      return c.json({
        results: [],
        status: 'ZERO_RESULTS',
        error_message: 'Google Maps API key not configured',
        location: { lat: latitude, lng: longitude },
        method: 'fallback'
      });
    }

    const url = `${GOOGLE_PLACES_API_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('🔗 Calling Google Places API for nearby search...');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Google Places API response:', {
      status: data.status,
      results_count: data.results?.length || 0
    });

    return c.json({
      ...data,
      location: { lat: latitude, lng: longitude },
      method: 'google_places_api'
    });

  } catch (error) {
    console.error('Geolocation nearby endpoint error:', error);
    return c.json({
      error: 'Nearby search failed',
      details: error.message
    }, 500);
  }
});

// =====================================
// GOOGLE PLACES ENDPOINTS  
// =====================================

// Google Places - Search nearby restaurants
app.post("/make-server-5976446e/places/nearby", async (c) => {
  try {
    console.log('🗺️ Google Places nearby endpoint called');
    
    const { location, radius = 5000, type = 'restaurant' } = await c.req.json();
    
    if (!location || !location.lat || !location.lng) {
      return c.json({ 
        error: 'Location with lat and lng is required' 
      }, 400);
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API key not configured - returning mock data');
      
      return c.json({
        results: [],
        status: 'ZERO_RESULTS',
        error_message: 'Google Maps API key not configured',
        search_location: location,
        search_radius: radius,
        method: 'fallback'
      });
    }

    const url = `${GOOGLE_PLACES_API_URL}/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('🔗 Calling Google Places API for nearby search...');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Google Places API response:', {
      status: data.status,
      results_count: data.results?.length || 0
    });

    return c.json({
      ...data,
      search_location: location,
      search_radius: radius,
      method: 'google_places_api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google Places nearby endpoint error:', error);
    return c.json({
      error: 'Nearby search failed',
      details: error.message
    }, 500);
  }
});

// Google Places - Text search
app.post("/make-server-5976446e/places/textsearch", async (c) => {
  try {
    console.log('🔍 Google Places text search endpoint called');
    
    const { query, location, radius = 50000 } = await c.req.json();
    
    if (!query) {
      return c.json({ 
        error: 'Search query is required' 
      }, 400);
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API key not configured - returning mock data');
      
      return c.json({
        results: [],
        status: 'ZERO_RESULTS',
        error_message: 'Google Maps API key not configured',
        query,
        location,
        method: 'fallback'
      });
    }

    let url = `${GOOGLE_PLACES_API_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    if (location && location.lat && location.lng) {
      url += `&location=${location.lat},${location.lng}&radius=${radius}`;
    }
    
    console.log('🔗 Calling Google Places API for text search...');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Google Places text search response:', {
      status: data.status,
      results_count: data.results?.length || 0,
      query
    });

    return c.json({
      ...data,
      query,
      location,
      method: 'google_places_text_search',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google Places text search endpoint error:', error);
    return c.json({
      error: 'Text search failed',
      details: error.message
    }, 500);
  }
});

// Google Places - Place details
app.get("/make-server-5976446e/places/details/:placeId", async (c) => {
  try {
    console.log('📋 Google Places details endpoint called');
    
    const placeId = c.req.param('placeId');
    
    if (!placeId) {
      return c.json({ 
        error: 'Place ID is required' 
      }, 400);
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API key not configured');
      
      return c.json({
        result: null,
        status: 'REQUEST_DENIED',
        error_message: 'Google Maps API key not configured',
        place_id: placeId,
        method: 'fallback'
      });
    }

    const url = `${GOOGLE_PLACES_API_URL}/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('🔗 Calling Google Places API for place details...');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Google Places details response:', {
      status: data.status,
      has_result: !!data.result,
      place_id: placeId
    });

    return c.json({
      ...data,
      place_id: placeId,
      method: 'google_places_details',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google Places details endpoint error:', error);
    return c.json({
      error: 'Place details request failed',
      details: error.message
    }, 500);
  }
});

// =====================================================
// RECIPE ENDPOINTS (Spoonacular API)
// =====================================================

// Recipe search endpoint
app.get("/make-server-5976446e/recipes/search", async (c) => {
  try {
    console.log('🔍 Recipe search endpoint called');
    
    const query = c.req.query('query') || '';
    const cuisine = c.req.query('cuisine') || '';
    const diet = c.req.query('diet') || '';
    const number = c.req.query('number') || '12';
    
    if (!SPOONACULAR_API_KEY) {
      console.warn('⚠️ Spoonacular API key not configured - returning mock data');
      
      // Return mock recipe data
      const mockRecipes = [
        {
          id: 1,
          title: 'Spaghetti Carbonara',
          image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
          readyInMinutes: 30,
          servings: 4,
          sourceUrl: '#'
        },
        {
          id: 2,
          title: 'Chicken Tikka Masala',
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
          readyInMinutes: 45,
          servings: 6,
          sourceUrl: '#'
        },
        {
          id: 3,
          title: 'Caesar Salad',
          image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
          readyInMinutes: 15,
          servings: 2,
          sourceUrl: '#'
        }
      ];
      
      return c.json({
        results: mockRecipes,
        totalResults: mockRecipes.length,
        method: 'mock_data',
        message: 'Using mock data - Spoonacular API key not configured'
      });
    }

    // Build Spoonacular API URL
    let url = `${SPOONACULAR_API_URL}/complexSearch?apiKey=${SPOONACULAR_API_KEY}&number=${number}&addRecipeInformation=true`;
    
    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }
    if (cuisine) {
      url += `&cuisine=${encodeURIComponent(cuisine)}`;
    }
    if (diet) {
      url += `&diet=${encodeURIComponent(diet)}`;
    }
    
    console.log('🔗 Calling Spoonacular API for recipe search...');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Spoonacular API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Spoonacular API response:', {
      results_count: data.results?.length || 0,
      query
    });

    return c.json({
      results: data.results || [],
      totalResults: data.totalResults || 0,
      method: 'spoonacular_api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Recipe search endpoint error:', error);
    return c.json({
      error: 'Recipe search failed',
      details: error.message,
      results: [],
      totalResults: 0
    }, 500);
  }
});

// Recipe details endpoint
app.get("/make-server-5976446e/recipes/:id", async (c) => {
  try {
    const recipeId = c.req.param('id');
    console.log('🍳 Recipe details endpoint called for ID:', recipeId);
    
    if (!SPOONACULAR_API_KEY) {
      console.warn('⚠️ Spoonacular API key not configured');
      return c.json({
        error: 'Spoonacular API key not configured'
      }, 503);
    }

    const url = `${SPOONACULAR_API_URL}/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`;
    
    console.log('🔗 Calling Spoonacular API for recipe details...');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Spoonacular API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Recipe details retrieved:', data.title);

    return c.json({
      recipe: data,
      method: 'spoonacular_api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Recipe details endpoint error:', error);
    return c.json({
      error: 'Failed to get recipe details',
      details: error.message
    }, 500);
  }
});

// Mount Figma MCP routes
app.route('/', figmaMCP);

console.log('🚀 FUZO Edge Function server starting...');

// Start the server
Deno.serve(app.fetch);