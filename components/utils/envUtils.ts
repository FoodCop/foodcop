/**
 * Environment Variable Utilities
 * 
 * Safe access to environment variables that works across different environments
 * including server-side rendering, build tools, and various bundlers.
 */

/**
 * Safely access environment variables with fallback support
 * @param key - Environment variable key (should start with VITE_ for client-side access)
 * @param fallback - Fallback value if environment variable is not available
 * @returns The environment variable value or fallback
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    // Try to access Vite environment variables
    try {
      // This will work in Vite environments
      if (import.meta?.env && key in import.meta.env) {
        return import.meta.env[key] || fallback;
      }
    } catch {
      // import.meta not available, continue to other methods
    }
    
    // Fallback for Node.js environments
    if (typeof process !== 'undefined' && process.env && key in process.env) {
      return process.env[key] || fallback;
    }
    
    // Final fallback
    return fallback;
  } catch (error) {
    console.warn(`Failed to access environment variable ${key}:`, error);
    return fallback;
  }
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
 * Validate that required environment variables are present
 * @param requiredVars - Array of required environment variable keys
 * @throws Error if any required variables are missing
 */
export const validateRequiredEnvVars = (requiredVars: string[]): void => {
  const missing = requiredVars.filter(key => !hasEnvVar(key));
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }
};

/**
 * Get all environment variables with a specific prefix
 * @param prefix - Prefix to filter by (e.g., 'VITE_')
 * @returns Object with filtered environment variables
 */
export const getEnvVarsWithPrefix = (prefix: string): Record<string, string> => {
  const result: Record<string, string> = {};
  
  try {
    let envSource: Record<string, any> = {};
    
    // Try Vite environment first
    try {
      if (import.meta?.env) {
        envSource = import.meta.env;
      }
    } catch {
      // import.meta not available, try process.env
      if (typeof process !== 'undefined' && process.env) {
        envSource = process.env;
      }
    }
    
    Object.keys(envSource).forEach(key => {
      if (key.startsWith(prefix)) {
        result[key] = envSource[key] || '';
      }
    });
  } catch (error) {
    console.warn(`Failed to get environment variables with prefix ${prefix}:`, error);
  }
  
  return result;
};

/**
 * Development helper to log environment variables (only in development)
 * @param prefix - Optional prefix to filter variables
 */
export const logEnvVars = (prefix?: string): void => {
  if (getEnvVar('NODE_ENV') !== 'development') {
    return;
  }
  
  console.group('🔧 Environment Variables');
  
  const vars = prefix ? getEnvVarsWithPrefix(prefix) : getEnvVarsWithPrefix('VITE_');
  
  Object.entries(vars).forEach(([key, value]) => {
    // Mask sensitive values
    const maskedValue = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')
      ? value ? `${value.substring(0, 4)}****${value.substring(value.length - 4)}` : '(not set)'
      : value || '(not set)';
    
    console.log(`${key}: ${maskedValue}`);
  });
  
  console.groupEnd();
};