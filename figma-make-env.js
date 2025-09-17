// Figma Make Environment Initialization
// This script sets up environment variables for Figma Make preview environment
// where import.meta.env is not available

(function() {
  // Only run if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  console.log('🔧 Initializing Figma Make environment variables...');

  // Initialize FUZO_ENV if it doesn't exist
  if (!window.FUZO_ENV) {
    window.FUZO_ENV = {};
  }

  // Set default values for common environment variables
  const defaults = {
    // Location defaults
    VITE_DEFAULT_LATITUDE: '37.7749',
    VITE_DEFAULT_LONGITUDE: '-122.4194',
    VITE_LOCATION_SEARCH_RADIUS: '25000',
    
    // App configuration
    VITE_ENVIRONMENT: 'figma-make',
    VITE_ENABLE_AI_ASSISTANT: 'true',
  };

  // Merge defaults with any existing values
  Object.keys(defaults).forEach(key => {
    if (!window.FUZO_ENV[key]) {
      window.FUZO_ENV[key] = defaults[key];
    }
  });

  console.log('✅ Figma Make environment initialized with defaults');
  console.log('💡 Add API keys in Figma Make Project → Environment Variables:');
  console.log('   - VITE_GOOGLE_MAPS_API_KEY for location features');
  console.log('   - VITE_OPENAI_API_KEY for AI assistant');
})();