// Early environment initialization for Figma Make
// This script runs before React to set up environment variables

(function() {
  // Only initialize in browser environments
  if (typeof window === 'undefined') return;

  console.log('🌍 Early environment initialization...');

  // Initialize FUZO_ENV with safe defaults
  window.FUZO_ENV = window.FUZO_ENV || {
    // Safe defaults that work everywhere
    VITE_DEFAULT_LATITUDE: '37.7749',
    VITE_DEFAULT_LONGITUDE: '-122.4194', 
    VITE_LOCATION_SEARCH_RADIUS: '25000',
    VITE_ENVIRONMENT: 'browser',
    VITE_ENABLE_AI_ASSISTANT: 'true'
  };

  // Try to detect if we're in Figma Make
  const isFigmaMake = window.location.hostname.includes('figma.com') || 
                      window.navigator.userAgent.includes('figma') ||
                      window.location.hostname.includes('figma');

  if (isFigmaMake) {
    window.FUZO_ENV.VITE_ENVIRONMENT = 'figma-make';
    console.log('🎨 Detected Figma Make environment');
  }

  // Check for any environment variables that might have been injected
  if (typeof process !== 'undefined' && process.env) {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('VITE_') && process.env[key]) {
        window.FUZO_ENV[key] = process.env[key];
      }
    });
  }

  console.log('✅ Environment initialized:', Object.keys(window.FUZO_ENV).length, 'variables');
})();