// Configuration for FUZO Food Discovery App APIs

export const config = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // Google APIs Configuration
  google: {
    placesApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  },

  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
    maxTokens: 1000,
  },

  // Spoonacular Food API Configuration
  spoonacular: {
    apiKey: import.meta.env.VITE_SPOONACULAR_API_KEY || '',
    baseUrl: 'https://api.spoonacular.com',
    endpoints: {
      recipeSearch: '/recipes/complexSearch',
      recipeInformation: '/recipes/{id}/information',
      restaurantSearch: '/food/restaurants/search',
      menuItems: '/food/menuItems/search',
      nutritionAnalysis: '/recipes/analyze',
    },
  },

  // YouTube Data API Configuration (uses Supabase Edge Function proxy)
  youtube: {
    // API key is stored server-side in Supabase Edge Function
    // No client-side key needed - all requests go through youtube-proxy
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    endpoints: {
      search: '/search',
      videos: '/videos',
      channels: '/channels',
    },
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'FUZO Food Discovery',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    // Use current origin in development, or VITE_APP_URL if set (for production builds)
    url: import.meta.env.DEV 
      ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      : (import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')),
    newUiUrl: import.meta.env.VITE_NEW_UI_URL || (import.meta.env.DEV ? 'http://localhost:3000/' : '/new_UI/index.html'),
    // Feature Flags
    features: {
      // Chat functionality - disabled until proper integration is complete
      chatEnabled: false,
    },
  },

  // Feature Flags
  features: {
    aiAssistant: import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true',
    pointsSystem: import.meta.env.VITE_ENABLE_POINTS_SYSTEM === 'true',
    socialFeatures: import.meta.env.VITE_ENABLE_SOCIAL_FEATURES === 'true',
    videoReviews: import.meta.env.VITE_ENABLE_VIDEO_REVIEWS === 'true',
  },

  // API Rate Limits and Retry Configuration
  api: {
    retryAttempts: 3,
    retryDelay: 1000, // milliseconds
    timeout: 10000, // milliseconds
  },
} as const;

export default config;