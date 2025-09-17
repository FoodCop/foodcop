// Universal environment variable utility that works across all environments
type AnyEnv = Record<string, string | undefined>;

function getAnyEnv(): AnyEnv {
  // 1) Process environment (Node/SSR)
  const procEnv = typeof process !== 'undefined' ? (process.env as AnyEnv) : undefined;

  // 2) Window-scoped environment (Figma Make / manual overrides)  
  const winEnv = (globalThis as any)?.FUZO_ENV as AnyEnv | undefined;

  // 3) Try to access Vite environment variables if available
  let viteEnv: AnyEnv | undefined;
  if (typeof window !== 'undefined') {
    // Check if Vite injected environment variables into window
    viteEnv = (window as any).__VITE_ENV__ || undefined;
  }

  // 4) Figma Make Supabase secrets (injected by Figma Make secret system)
  let figmaSecrets: AnyEnv | undefined;
  if (typeof window !== 'undefined') {
    // Check for Figma Make environment variables in various possible locations
    figmaSecrets = {
      // Try to access environment variables from various possible sources
      ...(typeof process !== 'undefined' && process.env ? process.env as AnyEnv : {}),
      ...(typeof window !== 'undefined' && (window as any).env ? (window as any).env : {}),
      ...(typeof globalThis !== 'undefined' && (globalThis as any).env ? (globalThis as any).env : {}),
    };
    
    // Also check for direct Figma Make injection patterns
    if (typeof window !== 'undefined') {
      const windowAny = window as any;
      // Check various patterns that Figma Make might use to inject secrets
      if (windowAny.VITE_GOOGLE_MAPS_API_KEY) figmaSecrets.VITE_GOOGLE_MAPS_API_KEY = windowAny.VITE_GOOGLE_MAPS_API_KEY;
      if (windowAny.VITE_OPENAI_API_KEY) figmaSecrets.VITE_OPENAI_API_KEY = windowAny.VITE_OPENAI_API_KEY;
      if (windowAny.VITE_STREAM_CHAT_API_KEY) figmaSecrets.VITE_STREAM_CHAT_API_KEY = windowAny.VITE_STREAM_CHAT_API_KEY;
    }
  }

  // Merge all sources with priority: figmaSecrets > window > vite > process
  return { ...(procEnv || {}), ...(viteEnv || {}), ...(winEnv || {}), ...(figmaSecrets || {}) };
}

const ENV = getAnyEnv();

export function getEnv(key: string, fallback?: string): string | undefined {
  const val = ENV?.[key];
  if (val == null || val === '' || /^YOUR_/.test(val)) {
    // If no fallback provided and we're in a browser environment, 
    // check if this is a common environment variable we can provide a default for
    if (!fallback && typeof window !== 'undefined') {
      switch (key) {
        case 'VITE_DEFAULT_LATITUDE':
          return '37.7749';
        case 'VITE_DEFAULT_LONGITUDE':
          return '-122.4194';
        case 'VITE_LOCATION_SEARCH_RADIUS':
          return '25000';
        case 'VITE_ENVIRONMENT':
          return 'development';
        case 'VITE_ENABLE_AI_ASSISTANT':
          return 'true';
      }
    }
    return fallback;
  }
  return val;
}

export function getEnvRequired(key: string, fallback?: string): string {
  const val = getEnv(key, fallback);
  if (!val) {
    console.warn(`Required environment variable ${key} is missing`);
    return fallback || '';
  }
  return val;
}

export function getEnvNumber(key: string, fallback: number = 0): number {
  const val = getEnv(key);
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

export function getEnvBoolean(key: string, fallback: boolean = false): boolean {
  const val = getEnv(key);
  if (!val) return fallback;
  return val.toLowerCase() === 'true' || val === '1';
}

// Main app environment configuration
export const APP_ENV = {
  // Google Services
  GOOGLE_MAPS_KEY: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
  GOOGLE_CLIENT_ID: getEnv('VITE_GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnv('VITE_GOOGLE_CLIENT_SECRET'),
  
  // Location defaults
  DEFAULT_LAT: getEnvNumber('VITE_DEFAULT_LATITUDE', 37.7749),
  DEFAULT_LNG: getEnvNumber('VITE_DEFAULT_LONGITUDE', -122.4194),
  RADIUS_M: getEnvNumber('VITE_LOCATION_SEARCH_RADIUS', 25000),
  
  // App configuration
  ENVIRONMENT: getEnv('VITE_ENVIRONMENT', 'development'),
  ENABLE_AI_ASSISTANT: getEnvBoolean('VITE_ENABLE_AI_ASSISTANT', true),
  
  // Optional services
  STREAM_CHAT_API_KEY: getEnv('VITE_STREAM_CHAT_API_KEY'),
  OPENAI_API_KEY: getEnv('VITE_OPENAI_API_KEY'),
  
  // Supabase (server-side)
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
};

// Feature flags based on available environment variables
export const FEATURES = {
  GOOGLE_MAPS: !!APP_ENV.GOOGLE_MAPS_KEY,
  GOOGLE_AUTH: !!(APP_ENV.GOOGLE_CLIENT_ID && APP_ENV.GOOGLE_CLIENT_SECRET),
  STREAM_CHAT: !!APP_ENV.STREAM_CHAT_API_KEY,
  AI_ASSISTANT: !!(APP_ENV.OPENAI_API_KEY && APP_ENV.ENABLE_AI_ASSISTANT),
  SUPABASE: !!(APP_ENV.SUPABASE_URL && APP_ENV.SUPABASE_ANON_KEY),
};

// Environment diagnostics
export function getEnvironmentInfo() {
  // Detect environment without using typeof import
  const hasWindow = typeof window !== 'undefined';
  const hasProcess = typeof process !== 'undefined';
  const isNode = hasProcess && !hasWindow;
  const isBrowser = hasWindow;
  const isVite = isBrowser && !!(window as any).__VITE_ENV__;
  const isFigmaMake = isBrowser && !isVite;
  
  return {
    runtime: {
      isVite,
      isFigmaMake,
      isNode,
      isBrowser,
      hasWindow,
      hasProcess,
      hasGlobal: typeof globalThis !== 'undefined',
    },
    environment: APP_ENV.ENVIRONMENT,
    features: FEATURES,
    variables: {
      total: Object.keys(ENV).length,
      viteVars: Object.keys(ENV).filter(k => k.startsWith('VITE_')).length,
      configured: Object.entries(APP_ENV).filter(([_, v]) => v != null).length,
    }
  };
}

// Initialize window environment for Figma Make (if needed)
export function initializeFigmaEnvironment() {
  if (typeof window !== 'undefined' && !(globalThis as any).FUZO_ENV) {
    (globalThis as any).FUZO_ENV = {
      // Add any manual overrides here if needed
      // VITE_GOOGLE_MAPS_API_KEY: 'your-key-here'
    };
  }
}

// Logging utilities
export function logEnvironmentStatus() {
  const info = getEnvironmentInfo();
  
  console.log('🌍 Environment Status:');
  console.log('- Runtime:', info.runtime);
  console.log('- Environment:', info.environment);
  console.log('- Variables:', info.variables);
  console.log('- Features Available:', Object.entries(info.features).filter(([_, enabled]) => enabled).map(([name]) => name));
  console.log('- Features Disabled:', Object.entries(info.features).filter(([_, enabled]) => !enabled).map(([name]) => name));
  
  // Debug environment sources
  console.log('\n🔍 Environment Sources Debug:');
  const allEnvVars = getAnyEnv();
  const viteVars = Object.keys(allEnvVars).filter(k => k.startsWith('VITE_'));
  console.log('- Total environment variables:', Object.keys(allEnvVars).length);
  console.log('- VITE_ prefixed variables:', viteVars.length);
  console.log('- VITE_ variables found:', viteVars);
  
  // Check specifically for API keys
  const apiKeys = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_OPENAI_API_KEY', 
    'VITE_STREAM_CHAT_API_KEY'
  ];
  
  console.log('\n🔑 API Key Detection:');
  apiKeys.forEach(key => {
    const value = allEnvVars[key];
    const status = value ? '✅' : '❌';
    const display = value && value.length > 10 ? `${value.substring(0, 8)}...` : value || 'not found';
    console.log(`${status} ${key}: ${display}`);
  });
  
  // Detailed variable status
  console.log('\n📊 App Configuration:');
  Object.entries(APP_ENV).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const display = value && typeof value === 'string' && value.length > 20 
      ? `${value.substring(0, 12)}...` 
      : value;
    console.log(`${status} ${key}:`, display);
  });
  
  // Special check for Figma Make environment
  if (info.runtime.isFigmaMake) {
    console.log('\n🎨 Figma Make Environment Check:');
    console.log('- Window environment variables:', typeof window !== 'undefined' ? Object.keys((window as any).env || {}) : 'none');
    console.log('- Global environment variables:', typeof globalThis !== 'undefined' ? Object.keys((globalThis as any).env || {}) : 'none');
    console.log('- Direct window API keys:', typeof window !== 'undefined' ? {
      googleMaps: !!(window as any).VITE_GOOGLE_MAPS_API_KEY,
      openai: !!(window as any).VITE_OPENAI_API_KEY
    } : 'none');
  }
}