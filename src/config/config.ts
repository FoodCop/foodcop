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

  // YouTube Data API Configuration
  youtube: {
    apiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
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
    url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
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