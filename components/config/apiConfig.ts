import { APP_ENV, FEATURES } from "../../utils/env";

// FUZO API Configuration - Universal Environment Support
//
// This configuration uses a resilient environment system that works across:
// - Vite development (import.meta.env)
// - Figma Make preview (window-scoped variables)
// - Vercel production (process.env)
//
// GOOGLE MAPS/PLACES API:
// ✅ Safe for client-side use when properly configured
//
// Setup Instructions:
// 1. Go to Google Cloud Console (console.cloud.google.com)
// 2. Create a new project or select existing one
// 3. Enable these APIs: Places API, Maps JavaScript API, Geocoding API
// 4. Create credentials > API Key
// 5. IMPORTANT: Add HTTP referrer restrictions to your API key
// 6. Set VITE_GOOGLE_MAPS_API_KEY in your environment
//
// STREAM CHAT API:
// ✅ API Key safe for client-side (App ID also safe)
// ❌ API Secret must stay server-side only

export const API_CONFIG = {
  // Backend API URL
  BACKEND_URL: APP_ENV.BACKEND_URL || "http://localhost:3000",

  // ✅ Google APIs (Safe for client-side with restrictions)
  GOOGLE_API_KEY: APP_ENV.GOOGLE_MAPS_KEY,
  GOOGLE_PLACES_API_URL: "https://maps.googleapis.com/maps/api/place",
  GOOGLE_MAPS_API_URL: "https://maps.googleapis.com/maps/api/js",

  // ✅ Stream Chat API (Public keys only - no secrets)
  STREAM_CHAT_API_KEY: APP_ENV.STREAM_CHAT_API_KEY,
  STREAM_CHAT_APP_ID: APP_ENV.STREAM_CHAT_API_KEY,

  // Mock API endpoints (for development)
  MOCK_RESTAURANTS_API: "/api/mock/restaurants",
  MOCK_RECIPES_API: "/api/mock/recipes",

  // Feature flags
  USE_GOOGLE_APIS: FEATURES.GOOGLE_MAPS,
  USE_STREAM_CHAT: FEATURES.STREAM_CHAT,

  // Geolocation settings
  DEFAULT_LOCATION: {
    lat: APP_ENV.DEFAULT_LAT,
    lng: APP_ENV.DEFAULT_LNG,
    city: "San Francisco",
    country: "US",
  },

  // AI Assistant settings
  AI_ASSISTANT_CONFIG: {
    maxTokens: 500,
    temperature: 0.7,
    systemPrompt:
      "You are Tako, FUZO's friendly AI food assistant. Help users discover amazing food experiences with enthusiasm and local knowledge.",
  },

  // Recipe API settings
  RECIPE_API_CONFIG: {
    resultsPerPage: 12,
    maxResults: 100,
    includeNutrition: true,
    includeInstructions: true,
  },
};

// Safe API key getter with validation
export function getGoogleApiKeySafe(): string | null {
  const key = API_CONFIG.GOOGLE_API_KEY;

  console.log("🔑 API Key Validation:", {
    provided: !!key,
    notDefault: key !== "YOUR_GOOGLE_MAPS_API_KEY_HERE",
    value: key
      ? key.length > 10
        ? `${key.substring(0, 8)}...`
        : key
      : "missing",
    startsWithAIza: key ? key.startsWith("AIza") : false,
    length: key ? key.length : 0,
  });

  if (!key || key === "YOUR_GOOGLE_MAPS_API_KEY_HERE" || key === "") {
    console.log("ℹ️ Google Maps API key not configured - using mock data");
    return null;
  }

  if (!key.startsWith("AIza")) {
    console.warn(
      '⚠️ Google Maps API key format appears invalid - expected to start with "AIza"'
    );
    console.log(
      "💡 If this is a valid key, it might work anyway. Proceeding..."
    );
    // Don't return null for potentially valid non-standard keys
  }

  console.log("✅ Google Maps API key validated successfully");
  return key;
}

// Helper functions to check if APIs are available
export const isGoogleAPIAvailable = (): boolean => {
  return FEATURES.GOOGLE_MAPS && !!getGoogleApiKeySafe();
};

export const isStreamChatAvailable = (): boolean => {
  return FEATURES.STREAM_CHAT;
};

export const isAIAssistantAvailable = (): boolean => {
  return FEATURES.AI_ASSISTANT;
};

// Check if any real APIs are configured
export const hasRealAPIsConfigured = (): boolean => {
  return (
    isGoogleAPIAvailable() ||
    isStreamChatAvailable() ||
    isAIAssistantAvailable()
  );
};

// Mock functions for removed APIs (for demo purposes)
export const mockOpenAIResponse = async (prompt: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
  return {
    choices: [
      {
        message: {
          content: `🐙 Tako here! I'd love to help you with food recommendations, but I need a secure backend connection for AI features. For now, explore the amazing restaurants around you using our location services!`,
        },
      },
    ],
  };
};

export const mockSpoonacularResponse = async (query: string) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    results: [
      {
        id: 1,
        title: "Mock Recipe: Delicious Pasta",
        image:
          "https://images.unsplash.com/photo-1621996346565-e3dbc736d52e?w=300",
        readyInMinutes: 30,
        servings: 4,
        summary: "A demo recipe while we set up secure API connections.",
      },
    ],
  };
};

// Google Places search parameters
export const GOOGLE_PLACES_CONFIG = {
  radius: APP_ENV.RADIUS_M,
  types: ["restaurant", "food", "meal_takeaway", "cafe"],
  fields: [
    "place_id",
    "name",
    "rating",
    "price_level",
    "photos",
    "geometry",
    "vicinity",
    "types",
    "opening_hours",
    "formatted_phone_number",
    "website",
    "reviews",
    "formatted_address",
  ],
};

// API URL builders (with null checks)
export const buildGooglePlacesURL = (
  endpoint: string,
  params: Record<string, any>
) => {
  const apiKey = getGoogleApiKeySafe();
  if (!apiKey) {
    throw new Error("Google API key not available");
  }

  const url = new URL(`${API_CONFIG.GOOGLE_PLACES_API_URL}/${endpoint}/json`);
  url.searchParams.append("key", apiKey);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  return url.toString();
};

// Google Distance Matrix API
export const buildDistanceMatrixURL = (
  origins: string[],
  destinations: string[],
  params: Record<string, any> = {}
) => {
  const apiKey = getGoogleApiKeySafe();
  if (!apiKey) {
    throw new Error("Google API key not available");
  }

  const url = new URL(
    `https://maps.googleapis.com/maps/api/distancematrix/json`
  );
  url.searchParams.append("key", apiKey);
  url.searchParams.append("origins", origins.join("|"));
  url.searchParams.append("destinations", destinations.join("|"));

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  return url.toString();
};

// Google Directions API
export const buildDirectionsURL = (
  origin: string,
  destination: string,
  params: Record<string, any> = {}
) => {
  const apiKey = getGoogleApiKeySafe();
  if (!apiKey) {
    throw new Error("Google API key not available");
  }

  const url = new URL(`https://maps.googleapis.com/maps/api/directions/json`);
  url.searchParams.append("key", apiKey);
  url.searchParams.append("origin", origin);
  url.searchParams.append("destination", destination);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  return url.toString();
};

// Google Place Details API
export const buildPlaceDetailsURL = (
  placeId: string,
  params: Record<string, any> = {}
) => {
  const apiKey = getGoogleApiKeySafe();
  if (!apiKey) {
    throw new Error("Google API key not available");
  }

  const url = new URL(`${API_CONFIG.GOOGLE_PLACES_API_URL}/details/json`);
  url.searchParams.append("key", apiKey);
  url.searchParams.append("place_id", placeId);

  // Default fields for place details
  const defaultFields = [
    "name",
    "formatted_address",
    "geometry",
    "rating",
    "price_level",
    "photos",
    "opening_hours",
    "formatted_phone_number",
    "website",
    "reviews",
    "types",
  ];

  url.searchParams.append("fields", defaultFields.join(","));

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  return url.toString();
};

// Google Photos API
export const buildPhotoURL = (
  photoReference: string,
  maxWidth: number = 400,
  maxHeight?: number
) => {
  const apiKey = getGoogleApiKeySafe();
  if (!apiKey) {
    throw new Error("Google API key not available");
  }

  const url = new URL(`${API_CONFIG.GOOGLE_PLACES_API_URL}/photo`);
  url.searchParams.append("key", apiKey);
  url.searchParams.append("photoreference", photoReference);
  url.searchParams.append("maxwidth", maxWidth.toString());

  if (maxHeight) {
    url.searchParams.append("maxheight", maxHeight.toString());
  }

  return url.toString();
};

// Stream Chat configuration (public keys only)
export const getStreamChatConfig = () => ({
  apiKey: API_CONFIG.STREAM_CHAT_API_KEY,
  appId: API_CONFIG.STREAM_CHAT_APP_ID,
  // Note: No secret included - that must stay on the server side
});
