/**
 * Basic Environment Variable Utilities
 * 
 * Ultra-simple version for maximum compatibility
 */

// Safe wrapper function for environment variable access
function safeEnvAccess(key: string): string | undefined {
  try {
    // Try to access import.meta.env directly
    if (import.meta?.env && key in import.meta.env && import.meta.env[key]) {
      console.log(`🔍 Found ${key} via import.meta.env`);
      return import.meta.env[key];
    }
  } catch (error) {
    console.warn(`⚠️ Error accessing import.meta.env.${key}:`, error);
  }

  try {
    // Try process.env
    if (typeof process !== 'undefined' && process.env && key in process.env && process.env[key]) {
      console.log(`🔍 Found ${key} via process.env`);
      return process.env[key];
    }
  } catch (error) {
    console.warn(`⚠️ Error accessing process.env.${key}:`, error);
  }

  try {
    // Try window object for client-side (sometimes Vite injects here)
    if (typeof window !== 'undefined' && (window as any).__VITE_ENV__?.[key]) {
      console.log(`🔍 Found ${key} via window.__VITE_ENV__`);
      return (window as any).__VITE_ENV__[key];
    }
  } catch (error) {
    console.warn(`⚠️ Error accessing window.__VITE_ENV__.${key}:`, error);
  }

  console.warn(`❌ Environment variable ${key} not found in any source`);
  return undefined;
}

/**
 * Get environment variable with fallback
 */
export const getEnvVar = (key: string, fallback = ''): string => {
  return safeEnvAccess(key) || fallback;
};

/**
 * Check if environment variable exists
 */
export const hasEnvVar = (key: string): boolean => {
  const value = safeEnvAccess(key);
  return !!value && value !== '';
};

/**
 * Get environment variable as number
 */
export const getEnvNumber = (key: string, fallback: number): number => {
  const value = safeEnvAccess(key);
  if (!value) return fallback;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Simple environment status logging
 */
export const logEnvStatus = (): void => {
  try {
    const isDev = !getEnvVar('NODE_ENV') || getEnvVar('NODE_ENV') === 'development';
    
    console.log('🔧 FUZO Environment Status:');
    console.log('- Environment:', isDev ? 'Development' : 'Production');
    
    // Check Google Maps API
    const hasGoogleMaps = hasEnvVar('VITE_GOOGLE_MAPS_API_KEY');
    const googleMapsKey = getEnvVar('VITE_GOOGLE_MAPS_API_KEY');
    console.log('- Google Maps API:', hasGoogleMaps ? '✅ Configured' : '❌ Missing');
    if (hasGoogleMaps) {
      console.log(`  - Key length: ${googleMapsKey.length} characters`);
      console.log(`  - Key format: ${googleMapsKey.startsWith('AIza') ? '✅ Valid' : '❌ Invalid'}`);
    }
    
    // Check Stream Chat API
    const hasStreamChat = hasEnvVar('VITE_STREAM_CHAT_API_KEY');
    console.log('- Stream Chat API:', hasStreamChat ? '✅ Configured' : '❌ Missing');
    
    // Debug info
    console.log('🔍 Environment Debug:');
    console.log('- import.meta.env available:', !!import.meta?.env);
    console.log('- process.env available:', typeof process !== 'undefined' && !!process.env);
    
    if (import.meta?.env) {
      const viteVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
      console.log(`- VITE_ variables found: ${viteVars.length}`);
      console.log('- VITE_ variables:', viteVars);
    }
    
  } catch (error) {
    console.error('❌ Error in environment status logging:', error);
  }
};