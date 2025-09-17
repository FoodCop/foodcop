// SECURE API Configuration for FUZO
// 🚨 SECURITY WARNING: Never expose sensitive API keys in client-side code!
// 
// This file demonstrates the CORRECT way to handle API keys:
// ✅ Safe for client-side: Google Maps/Places API (with domain restrictions)
// ❌ NEVER client-side: OpenAI API keys, Spoonacular API keys, Stream Chat secrets
//
// IMMEDIATE ACTION REQUIRED:
// 1. Regenerate your exposed API keys from their respective dashboards
// 2. Use environment variables or backend proxies for sensitive keys
// 3. Only use this configuration for development

export const SECURE_API_CONFIG = {
  // ✅ SAFE: Google APIs (designed for client-side use with domain restrictions)
  GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "YOUR_GOOGLE_API_KEY_HERE",
  GOOGLE_PLACES_API_URL: "https://maps.googleapis.com/maps/api/place",
  GOOGLE_MAPS_API_URL: "https://maps.googleapis.com/maps/api/js",
  
  // ❌ UNSAFE: These should be moved to backend/environment variables
  // For demo purposes only - DO NOT use real keys here
  OPENAI_API_KEY: "DEMO_ONLY_USE_BACKEND_PROXY",
  OPENAI_API_URL: "https://api.openai.com/v1",
  OPENAI_MODEL: "gpt-4-turbo-preview",
  
  SPOONACULAR_API_KEY: "DEMO_ONLY_USE_BACKEND_PROXY", 
  SPOONACULAR_API_URL: "https://api.spoonacular.com",
  
  // ✅ SAFE: Stream Chat API Key (public key for client-side)
  // ❌ UNSAFE: Stream Chat API Secret (must be server-side only)
  STREAM_CHAT_API_KEY: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY || "YOUR_STREAM_CHAT_API_KEY_HERE",
  STREAM_CHAT_APP_ID: process.env.NEXT_PUBLIC_STREAM_CHAT_APP_ID || "YOUR_STREAM_CHAT_APP_ID_HERE",
  // Note: Stream Chat API Secret should NEVER be in client-side code
  
  // Mock API endpoints (safe for development)
  MOCK_RESTAURANTS_API: "/api/mock/restaurants",
  MOCK_RECIPES_API: "/api/mock/recipes",
  
  // Feature flags
  USE_REAL_APIs: false,
  USE_GOOGLE_APIS: false,
  USE_OPENAI_API: false, // Should be false until backend proxy is implemented
  USE_SPOONACULAR_API: false, // Should be false until backend proxy is implemented
  USE_STREAM_CHAT: false,
  
  // Safe configuration
  DEFAULT_LOCATION: {
    lat: 37.7749,
    lng: -122.4194,
    city: "San Francisco",
    country: "US"
  },
  
  AI_ASSISTANT_CONFIG: {
    maxTokens: 500,
    temperature: 0.7,
    systemPrompt: "You are Tako, FUZO's friendly AI food assistant. Help users discover amazing food experiences with enthusiasm and local knowledge."
  },
  
  RECIPE_API_CONFIG: {
    resultsPerPage: 12,
    maxResults: 100,
    includeNutrition: true,
    includeInstructions: true
  }
};

// Helper functions
export const isGoogleAPIAvailable = (): boolean => {
  return SECURE_API_CONFIG.GOOGLE_API_KEY !== "YOUR_GOOGLE_API_KEY_HERE" && 
         SECURE_API_CONFIG.USE_GOOGLE_APIS;
};

export const isStreamChatAvailable = (): boolean => {
  return SECURE_API_CONFIG.STREAM_CHAT_API_KEY !== "YOUR_STREAM_CHAT_API_KEY_HERE" && 
         SECURE_API_CONFIG.USE_STREAM_CHAT;
};

// ✅ SAFE: Google Places URL builder
export const buildGooglePlacesURL = (endpoint: string, params: Record<string, any>) => {
  const url = new URL(`${SECURE_API_CONFIG.GOOGLE_PLACES_API_URL}/${endpoint}/json`);
  url.searchParams.append('key', SECURE_API_CONFIG.GOOGLE_API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });
  
  return url.toString();
};

// ✅ SAFE: Stream Chat config (only public keys)
export const getStreamChatConfig = () => ({
  apiKey: SECURE_API_CONFIG.STREAM_CHAT_API_KEY,
  appId: SECURE_API_CONFIG.STREAM_CHAT_APP_ID
  // Note: No secret included - that stays server-side
});

// Mock implementations for unsafe APIs (for demo purposes)
export const mockOpenAICall = async (prompt: string) => {
  // Simulate AI response for demo
  return {
    choices: [{
      message: {
        content: `Tako here! 🐙 I'd love to help you with "${prompt.slice(0, 50)}..." but I need a secure backend connection first! For now, try exploring the amazing restaurants in your area!`
      }
    }]
  };
};

export const mockSpoonacularCall = async (query: string) => {
  // Return mock recipe data
  return {
    results: [
      {
        id: 1,
        title: "Demo Recipe: Octopus Pasta",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc736d52e?w=300",
        readyInMinutes: 30,
        servings: 4
      }
    ]
  };
};