/**
 * Simple Environment Variable Utilities
 * 
 * Simplified version with maximum compatibility across build environments
 */

/**
 * Safely access environment variables with fallback support
 * @param key - Environment variable key (should start with VITE_ for client-side access)
 * @param fallback - Fallback value if environment variable is not available
 * @returns The environment variable value or fallback
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  // Try different environment sources in order of preference
  let value: string | undefined;

  // Method 1: Try Vite's import.meta.env (wrapped in try-catch for safety)
  try {
    // Access Vite environment (supported in bundler contexts). Direct reference to import.meta is valid.
    // We avoid using 'typeof import' which is invalid syntax.
    // @ts-ignore - Narrowing for non-Vite environments
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      // @ts-ignore
      value = (import.meta as any).env[key];
    }
  } catch {
    // Silently continue to next method
  }

  // Method 2: Try process.env for Node.js environments
  if (!value && typeof process !== 'undefined' && process.env) {
    value = process.env[key];
  }

  // Method 3: Try window environment variables (if any custom implementation exists)
  if (!value && typeof window !== 'undefined' && (window as any).env) {
    value = (window as any).env[key];
  }

  // Return value or fallback
  return value || fallback;
};

/**
 * Check if an environment variable is defined and non-empty
 * @param key - Environment variable key
 * @returns boolean indicating if the variable is available
 */
export const hasEnvVar = (key: string): boolean => {
  const value = getEnvVar(key);
  return value !== '' && value !== undefined && value !== null;
};

/**
 * Get environment variable as number with fallback
 * @param key - Environment variable key
 * @param fallback - Fallback number value
 * @returns The parsed number or fallback
 */
export const getEnvNumber = (key: string, fallback: number): number => {
  const value = getEnvVar(key);
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Get environment variable as boolean with fallback
 * @param key - Environment variable key
 * @param fallback - Fallback boolean value
 * @returns The parsed boolean or fallback
 */
export const getEnvBoolean = (key: string, fallback: boolean = false): boolean => {
  const value = getEnvVar(key).toLowerCase();
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
};

/**
 * Development helper to log a few key environment variables
 */
export const logEnvStatus = (): void => {
  const isDev = getEnvVar('NODE_ENV') === 'development' || !getEnvVar('NODE_ENV');
  
  if (!isDev) return;

  console.group('🔧 Environment Status');
  console.log('Google Maps API:', hasEnvVar('VITE_GOOGLE_MAPS_API_KEY') ? '✅ Configured' : '❌ Not configured');
  console.log('Stream Chat API:', hasEnvVar('VITE_STREAM_CHAT_API_KEY') ? '✅ Configured' : '❌ Not configured');
  console.log('Environment:', getEnvVar('NODE_ENV', 'development'));
  console.groupEnd();
};