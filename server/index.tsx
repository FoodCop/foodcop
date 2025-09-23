// @ts-nocheck  -- Deno edge function code uses import specifiers unsupported by local TS config
import { createClient } from "npm:@supabase/supabase-js";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import figmaMCP from "./figma-mcp.tsx";
import * as kv from "./kv_store.tsx";
import supabaseMCP from "./supabase-mcp.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// External API configuration
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
const GOOGLE_PLACES_API_URL = "https://maps.googleapis.com/maps/api/place";

const SPOONACULAR_API_KEY = Deno.env.get("SPOONACULAR_API_KEY");
const SPOONACULAR_API_URL = "https://api.spoonacular.com/recipes";

// Supabase configuration for server-side operations
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// Create Supabase client for server operations (service role for privileged ops, anon for public reads)
let supabase: any = null;
let supabaseAnon: any = null;
try {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("✅ Supabase service role client initialized");
  } else {
    console.warn(
      "⚠️ Supabase service role credentials missing - privileged endpoints will be disabled"
    );
  }
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("✅ Supabase anon client initialized");
  } else {
    console.warn(
      "⚠️ Supabase anon credentials missing - public endpoints will be disabled"
    );
  }
} catch (error) {
  console.error("❌ Failed to initialize Supabase clients:", error);
}

// Helper function to authenticate user
async function authenticateUser(c: any) {
  if (!supabase) {
    return { error: "Authentication service not configured", status: 503 };
  }

  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) {
    return { error: "Authorization header required", status: 401 };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { error: "Invalid access token", status: 401 };
  }

  return { user };
}

// OAuth Configuration check endpoint
// Public signup endpoint: instruct client to use Supabase client-side signUp
app.post("/make-server-5976446e/auth/signup", async (c) => {
  // This endpoint is now a stub for client-side signUp. Do not use admin API here.
  return c.json({
    message:
      "Use Supabase client-side auth.signUp({ email, password }) from the browser. Then PATCH /auth/profile to create profile.",
  });
});

// PATCH endpoint to update/create profile (with Zod validation)
import { z } from "npm:zod";
const profileSchema = z.object({
  display_name: z.string().min(2).max(100).optional(),
  username: z.string().min(2).max(50).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional(),
  dietary_preferences: z.array(z.string()).optional(),
  cuisine_preferences: z.array(z.string()).optional(),
  onboarding_completed: z.boolean().optional(),
});

app.patch("/make-server-5976446e/auth/profile", async (c) => {
  try {
    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }
    const { user } = authResult;
    const body = await c.req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", details: parsed.error.errors },
        400
      );
    }
    const updates = {
      ...parsed.data,
      dietary_preferences: parsed.data.dietary_preferences
        ? JSON.stringify(parsed.data.dietary_preferences)
        : undefined,
      cuisine_preferences: parsed.data.cuisine_preferences
        ? JSON.stringify(parsed.data.cuisine_preferences)
        : undefined,
    };
    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        ...updates,
      },
      { onConflict: "id" }
    );
    if (upsertError) {
      return c.json({ error: upsertError.message }, 500);
    }
    return c.json({
      success: true,
      message: "Profile updated",
      profile: updates,
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// Get user profile
// Fetch merged auth + app profile
app.get("/make-server-5976446e/auth/profile", async (c) => {
  try {
    console.log("👤 Getting user profile...");

    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;

    // Attempt to fetch application profile using anon client (RLS enforced)
    let profileRow = null;
    try {
      const { data: row, error: rowError } = await supabaseAnon
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (rowError) {
        console.warn("⚠️ Profile fetch error:", rowError.message);
      } else if (row) {
        profileRow = row;
      }
    } catch (fetchErr) {
      console.warn("⚠️ Exception fetching profile row:", fetchErr);
    }

    if (!profileRow) {
      console.log("ℹ️ No profile row found — creating placeholder.");
      const placeholder = {
        id: user.id,
        email: user.email,
        username: user.email?.split("@")[0] || "user",
        display_name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "FUZO User",
        created_at: user.created_at,
      };
      try {
        const { error: insertError } = await supabase.from("users").upsert({
          id: placeholder.id,
          email: placeholder.email,
          username: placeholder.username,
          display_name: placeholder.display_name,
        });
        if (insertError)
          console.warn(
            "⚠️ Failed to create placeholder profile:",
            insertError.message
          );
        profileRow = placeholder;
      } catch (insErr) {
        console.warn("⚠️ Exception creating placeholder profile:", insErr);
        profileRow = placeholder;
      }
    }

    const mergedProfile = {
      id: user.id,
      email: user.email,
      username: profileRow.username || user.email?.split("@")[0] || "user",
      display_name:
        profileRow.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "FUZO User",
      bio: profileRow.bio || "",
      avatar_url:
        profileRow.avatar_url || user.user_metadata?.avatar_url || null,
      location_city: profileRow.location_city || null,
      location_state: profileRow.location_state || null,
      location_country: profileRow.location_country || null,
      dietary_preferences: profileRow.dietary_preferences || [],
      cuisine_preferences: profileRow.cuisine_preferences || [],
      total_points: profileRow.total_points || 0,
      current_level: profileRow.current_level || 1,
      is_private: profileRow.is_private || false,
      onboarding_completed: profileRow.onboarding_completed || false,
      created_at: profileRow.created_at || user.created_at,
      last_seen_at: new Date().toISOString(),
    };

    console.log("✅ Retrieved user profile:", {
      id: mergedProfile.id,
      display_name: mergedProfile.display_name,
      username: mergedProfile.username,
    });

    return c.json({ profile: mergedProfile });
  } catch (error) {
    console.error("❌ Get profile endpoint error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =====================================
// PROFILE ENDPOINTS
// =====================================

// Get user's saved restaurants
app.get("/make-server-5976446e/profile/saved-restaurants", async (c) => {
  try {
    console.log("📋 Get saved restaurants endpoint called");

    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;
    const savedRestaurantsKey = `user_saved_restaurants_${user.id}`;
    const savedData = (await kv.get(savedRestaurantsKey)) || {
      restaurants: [],
    };

    console.log("✅ Retrieved saved restaurants:", {
      userId: user.id,
      count: savedData.restaurants.length,
    });

    return c.json({
      restaurants: savedData.restaurants,
      totalCount: savedData.restaurants.length,
      lastUpdated: savedData.lastUpdated,
    });
  } catch (error) {
    console.error("❌ Get saved restaurants endpoint error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save restaurant to user profile
app.post("/make-server-5976446e/profile/save-restaurant", async (c) => {
  try {
    console.log("💾 Save restaurant endpoint called");

    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;
    const { restaurant } = await c.req.json();

    if (!restaurant || !restaurant.name) {
      return c.json({ error: "Restaurant data with name is required" }, 400);
    }

    const savedRestaurantsKey = `user_saved_restaurants_${user.id}`;
    const existingSaved = (await kv.get(savedRestaurantsKey)) || {
      restaurants: [],
    };

    // Check if already saved
    const isAlreadySaved = existingSaved.restaurants.some(
      (r: any) => r.place_id === restaurant.place_id || r.id === restaurant.id
    );

    if (isAlreadySaved) {
      return c.json({
        success: false,
        message: "Restaurant is already saved",
        totalSaved: existingSaved.restaurants.length,
      });
    }

    const savedRestaurant = {
      id: restaurant.id || `restaurant_${Date.now()}`,
      place_id: restaurant.place_id || restaurant.id,
      name: restaurant.name,
      image: restaurant.image || null,
      rating: restaurant.rating || 0,
      cuisine: Array.isArray(restaurant.cuisine)
        ? restaurant.cuisine.join(", ")
        : restaurant.cuisine || "Restaurant",
      price: "$".repeat(restaurant.price_level || restaurant.priceLevel || 1),
      location:
        restaurant.vicinity ||
        restaurant.formatted_address ||
        restaurant.address ||
        "Unknown location",
      savedAt: new Date().toISOString(),
      geometry: restaurant.geometry,
    };

    existingSaved.restaurants.push(savedRestaurant);
    existingSaved.lastUpdated = new Date().toISOString();

    await kv.set(savedRestaurantsKey, existingSaved);

    console.log("✅ Restaurant saved successfully:", {
      userId: user.id,
      restaurantName: restaurant.name,
      totalSaved: existingSaved.restaurants.length,
    });

    return c.json({
      success: true,
      message: "Restaurant saved successfully",
      savedRestaurant,
      totalSaved: existingSaved.restaurants.length,
    });
  } catch (error) {
    console.error("❌ Save restaurant endpoint error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Remove restaurant from user profile
app.delete(
  "/make-server-5976446e/profile/unsave-restaurant/:placeId",
  async (c) => {
    try {
      console.log("🗑️ Unsave restaurant endpoint called");

      const authResult = await authenticateUser(c);
      if (authResult.error) {
        return c.json({ error: authResult.error }, authResult.status);
      }

      const { user } = authResult;
      const placeId = c.req.param("placeId");

      if (!placeId) {
        return c.json({ error: "Place ID is required" }, 400);
      }

      const savedRestaurantsKey = `user_saved_restaurants_${user.id}`;
      const existingSaved = (await kv.get(savedRestaurantsKey)) || {
        restaurants: [],
      };

      const initialLength = existingSaved.restaurants.length;
      existingSaved.restaurants = existingSaved.restaurants.filter(
        (r: any) => r.place_id !== placeId
      );
      existingSaved.lastUpdated = new Date().toISOString();

      const wasRemoved = existingSaved.restaurants.length < initialLength;

      if (!wasRemoved) {
        return c.json({
          success: false,
          message: "Restaurant was not in saved list",
          isSaved: false,
        });
      }

      await kv.set(savedRestaurantsKey, existingSaved);

      console.log("✅ Restaurant unsaved successfully:", {
        userId: user.id,
        placeId,
        totalSaved: existingSaved.restaurants.length,
      });

      return c.json({
        success: true,
        message: "Restaurant removed from saved list",
        totalSaved: existingSaved.restaurants.length,
      });
    } catch (error) {
      console.error("❌ Unsave restaurant endpoint error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

// Get user's saved photos
app.get("/make-server-5976446e/profile/saved-photos", async (c) => {
  try {
    console.log("🖼️ Get saved photos endpoint called");

    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;
    const savedPhotosKey = `user_saved_photos_${user.id}`;
    const savedData = (await kv.get(savedPhotosKey)) || { photos: [] };

    console.log("✅ Retrieved saved photos:", {
      userId: user.id,
      count: savedData.photos.length,
    });

    return c.json({
      photos: savedData.photos,
      totalCount: savedData.photos.length,
      lastUpdated: savedData.lastUpdated,
    });
  } catch (error) {
    console.error("❌ Get saved photos endpoint error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save photo to user profile
app.post("/make-server-5976446e/profile/save-photo", async (c) => {
  try {
    console.log("📷 Save photo endpoint called");

    const authResult = await authenticateUser(c);
    if (authResult.error) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { user } = authResult;
    const { photo } = await c.req.json();

    if (!photo || !photo.image || !photo.caption) {
      return c.json(
        { error: "Photo data with image URL and caption is required" },
        400
      );
    }

    const savedPhotosKey = `user_saved_photos_${user.id}`;
    const existingSaved = (await kv.get(savedPhotosKey)) || { photos: [] };

    const savedPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      image: photo.image,
      caption: photo.caption,
      tags: photo.tags || [],
      points: photo.points || 10,
      likes: 0,
      uploadedAt: new Date().toISOString(),
      location: photo.location || null,
    };

    existingSaved.photos.unshift(savedPhoto);
    existingSaved.lastUpdated = new Date().toISOString();

    await kv.set(savedPhotosKey, existingSaved);

    console.log("✅ Photo saved successfully:", {
      userId: user.id,
      photoId: savedPhoto.id,
      totalPhotos: existingSaved.photos.length,
    });

    return c.json({
      success: true,
      message: "Photo saved successfully",
      savedPhoto,
      totalPhotos: existingSaved.photos.length,
    });
  } catch (error) {
    console.error("❌ Save photo endpoint error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =====================================
// GEOLOCATION ENDPOINTS
// =====================================

// IP-based geolocation
app.get("/make-server-5976446e/geolocation/ip", async (c) => {
  try {
    console.log("🌐 IP geolocation endpoint called");

    const clientIP =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For") ||
      c.req.header("X-Real-IP") ||
      "unknown";

    console.log("🔍 Client IP detected:", clientIP);

    try {
      const ipResponse = await fetch(
        `http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone`
      );

      if (!ipResponse.ok) {
        throw new Error(`IP API returned ${ipResponse.status}`);
      }

      const ipData = await ipResponse.json();

      if (ipData.status === "fail") {
        throw new Error(ipData.message || "IP geolocation failed");
      }

      const result = {
        latitude: ipData.lat,
        longitude: ipData.lon,
        city: ipData.city,
        region: ipData.regionName,
        country: ipData.country,
        timezone: ipData.timezone,
        method: "ip_geolocation",
        clientIP: clientIP !== "unknown" ? clientIP : null,
        timestamp: new Date().toISOString(),
      };

      console.log("✅ IP geolocation success:", {
        location: `${result.city}, ${result.region}, ${result.country}`,
        coords: `${result.latitude}, ${result.longitude}`,
        clientIP,
      });

      return c.json(result);
    } catch (ipError) {
      console.warn("⚠️ IP geolocation failed, using fallback:", ipError);

      const fallbackResult = {
        latitude: 37.7749,
        longitude: -122.4194,
        city: "San Francisco",
        region: "California",
        country: "United States",
        method: "ip_geolocation_fallback",
        fallback: true,
        error: "Could not determine location from IP",
        timestamp: new Date().toISOString(),
      };

      console.log("📍 Using IP geolocation fallback (San Francisco)");
      return c.json(fallbackResult);
    }
  } catch (error) {
    console.error("IP geolocation endpoint error:", error);
    return c.json(
      {
        error: "IP geolocation service failed",
        details: error.message,
      },
      500
    );
  }
});

// Get nearby restaurants using device location
app.post("/make-server-5976446e/geolocation/nearby", async (c) => {
  try {
    console.log("🗺️ Geolocation nearby endpoint called");

    const {
      latitude,
      longitude,
      radius = 5000,
      type = "restaurant",
    } = await c.req.json();

    if (!latitude || !longitude) {
      return c.json(
        {
          error: "Latitude and longitude are required",
        },
        400
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn(
        "⚠️ Google Maps API key not configured - returning mock data"
      );

      return c.json({
        results: [],
        status: "ZERO_RESULTS",
        error_message: "Google Maps API key not configured",
        location: { lat: latitude, lng: longitude },
        method: "fallback",
      });
    }

    const url = `${GOOGLE_PLACES_API_URL}/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;

    console.log("🔗 Calling Google Places API for nearby search...");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Places API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Google Places API response:", {
      status: data.status,
      results_count: data.results?.length || 0,
    });

    return c.json({
      ...data,
      location: { lat: latitude, lng: longitude },
      method: "google_places_api",
    });
  } catch (error) {
    console.error("Geolocation nearby endpoint error:", error);
    return c.json(
      {
        error: "Nearby search failed",
        details: error.message,
      },
      500
    );
  }
});

// =====================================
// GOOGLE PLACES ENDPOINTS
// =====================================

// Google Places - Search nearby restaurants
app.post("/make-server-5976446e/places/nearby", async (c) => {
  try {
    console.log("🗺️ Google Places nearby endpoint called");

    const { location, radius = 5000, type = "restaurant" } = await c.req.json();

    if (!location || !location.lat || !location.lng) {
      return c.json(
        {
          error: "Location with lat and lng is required",
        },
        400
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn(
        "⚠️ Google Maps API key not configured - returning mock data"
      );

      return c.json({
        results: [],
        status: "ZERO_RESULTS",
        error_message: "Google Maps API key not configured",
        search_location: location,
        search_radius: radius,
        method: "fallback",
      });
    }

    const url = `${GOOGLE_PLACES_API_URL}/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;

    console.log("🔗 Calling Google Places API for nearby search...");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Places API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Google Places API response:", {
      status: data.status,
      results_count: data.results?.length || 0,
    });

    return c.json({
      ...data,
      search_location: location,
      search_radius: radius,
      method: "google_places_api",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Google Places nearby endpoint error:", error);
    return c.json(
      {
        error: "Nearby search failed",
        details: error.message,
      },
      500
    );
  }
});

// Google Places - Text search
app.post("/make-server-5976446e/places/textsearch", async (c) => {
  try {
    console.log("🔍 Google Places text search endpoint called");

    const { query, location, radius = 50000 } = await c.req.json();

    if (!query) {
      return c.json(
        {
          error: "Search query is required",
        },
        400
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn(
        "⚠️ Google Maps API key not configured - returning mock data"
      );

      return c.json({
        results: [],
        status: "ZERO_RESULTS",
        error_message: "Google Maps API key not configured",
        query,
        location,
        method: "fallback",
      });
    }

    let url = `${GOOGLE_PLACES_API_URL}/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    if (location && location.lat && location.lng) {
      url += `&location=${location.lat},${location.lng}&radius=${radius}`;
    }

    console.log("🔗 Calling Google Places API for text search...");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Places API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Google Places text search response:", {
      status: data.status,
      results_count: data.results?.length || 0,
      query,
    });

    return c.json({
      ...data,
      query,
      location,
      method: "google_places_text_search",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Google Places text search endpoint error:", error);
    return c.json(
      {
        error: "Text search failed",
        details: error.message,
      },
      500
    );
  }
});

// Google Places - Place details
app.get("/make-server-5976446e/places/details/:placeId", async (c) => {
  try {
    console.log("📋 Google Places details endpoint called");

    const placeId = c.req.param("placeId");

    if (!placeId) {
      return c.json(
        {
          error: "Place ID is required",
        },
        400
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("⚠️ Google Maps API key not configured");

      return c.json({
        result: null,
        status: "REQUEST_DENIED",
        error_message: "Google Maps API key not configured",
        place_id: placeId,
        method: "fallback",
      });
    }

    const url = `${GOOGLE_PLACES_API_URL}/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;

    console.log("🔗 Calling Google Places API for place details...");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Places API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log("✅ Google Places details response:", {
      status: data.status,
      has_result: !!data.result,
      place_id: placeId,
    });

    return c.json({
      ...data,
      place_id: placeId,
      method: "google_places_details",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Google Places details endpoint error:", error);
    return c.json(
      {
        error: "Place details request failed",
        details: error.message,
      },
      500
    );
  }
});

// Mount MCP / integration routes
app.route("/", figmaMCP);
app.route("/", supabaseMCP);

console.log("🚀 FUZO Edge Function server starting...");

// Geocoding endpoints
app.post("/make-server-5976446e/geocoding/geocode", async (c) => {
  try {
    const { address } = await c.req.json();

    if (!address) {
      return c.json({ success: false, error: "Address is required" }, 400);
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return c.json(
        { success: false, error: "Google Maps API key not configured" },
        500
      );
    }

    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(geocodingUrl);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      return c.json({
        success: true,
        data: {
          results: [
            {
              formatted_address: result.formatted_address,
              geometry: {
                location: {
                  lat: result.geometry.location.lat,
                  lng: result.geometry.location.lng,
                },
              },
              place_id: result.place_id,
            },
          ],
        },
      });
    } else {
      return c.json(
        {
          success: false,
          error: `Geocoding failed: ${data.status}`,
          details: data.error_message || "Unknown error",
        },
        400
      );
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

app.post("/make-server-5976446e/geocoding/reverse", async (c) => {
  try {
    const { lat, lng } = await c.req.json();

    if (!lat || !lng) {
      return c.json(
        { success: false, error: "Latitude and longitude are required" },
        400
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return c.json(
        { success: false, error: "Google Maps API key not configured" },
        500
      );
    }

    const reverseGeocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(reverseGeocodingUrl);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      return c.json({
        success: true,
        data: {
          results: [
            {
              formatted_address: result.formatted_address,
              geometry: {
                location: {
                  lat: result.geometry.location.lat,
                  lng: result.geometry.location.lng,
                },
              },
              place_id: result.place_id,
            },
          ],
        },
      });
    } else {
      return c.json(
        {
          success: false,
          error: `Reverse geocoding failed: ${data.status}`,
          details: data.error_message || "Unknown error",
        },
        400
      );
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);
