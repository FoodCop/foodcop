/**
 * Client-side Rate Limiter
 * Prevents excessive API calls by enforcing request limits
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: number | null = null;

  constructor() {
    // Cleanup old entries every minute
    this.cleanupInterval = window.setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request is allowed and increment counter
   */
  public checkLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const entry = this.storage.get(fullKey);

    if (!entry || now > entry.resetTime) {
      // No entry or window expired - allow and create new entry
      this.storage.set(fullKey, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (entry.count >= config.maxRequests) {
      // Limit exceeded
      const waitTime = Math.ceil((entry.resetTime - now) / 1000);
      console.warn(
        `⚠️ Rate limit exceeded for ${fullKey}. Try again in ${waitTime}s`
      );
      return false;
    }

    // Increment counter and allow
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  public getRemaining(key: string, config: RateLimitConfig): number {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const entry = this.storage.get(fullKey);
    
    if (!entry || Date.now() > entry.resetTime) {
      return config.maxRequests;
    }
    
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets (in ms)
   */
  public getResetTime(key: string, config: RateLimitConfig): number {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const entry = this.storage.get(fullKey);
    
    if (!entry) return 0;
    
    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Reset rate limit for a specific key
   */
  public reset(key: string, keyPrefix?: string): void {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    this.storage.delete(fullKey);
  }

  /**
   * Clear all rate limit entries
   */
  public clearAll(): void {
    this.storage.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.storage.forEach((entry, key) => {
      if (now > entry.resetTime) {
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this.storage.delete(key));

    if (toDelete.length > 0) {
      console.log(`🧹 Rate limiter cleaned up ${toDelete.length} expired entries`);
    }
  }

  /**
   * Cleanup on destroy
   */
  public destroy(): void {
    if (this.cleanupInterval !== null) {
      window.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAll();
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalRateLimiter.destroy();
  });
}

/**
 * Rate limiting decorator for async functions
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: RateLimitConfig
): T {
  return (async (...args: unknown[]) => {
    const key = `${fn.name}:${JSON.stringify(args).substring(0, 100)}`;
    
    if (!globalRateLimiter.checkLimit(key, config)) {
      const waitTime = Math.ceil(globalRateLimiter.getResetTime(key, config) / 1000);
      throw new Error(
        `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`
      );
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Hook-friendly rate limiter
 */
export function useRateLimit(key: string, config: RateLimitConfig) {
  const check = (): boolean => {
    return globalRateLimiter.checkLimit(key, config);
  };

  const getRemaining = (): number => {
    return globalRateLimiter.getRemaining(key, config);
  };

  const getResetTime = (): number => {
    return globalRateLimiter.getResetTime(key, config);
  };

  const reset = (): void => {
    return globalRateLimiter.reset(key, config.keyPrefix);
  };

  return { check, getRemaining, getResetTime, reset };
}

// Export singleton instance
export { globalRateLimiter };

// Pre-configured rate limiters for common use cases
export const RateLimitPresets = {
  // Google APIs - 1000 requests per day (conservative client limit)
  googleMaps: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'google-maps',
  },
  
  // Spoonacular - 150 points per day (free tier)
  spoonacular: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'spoonacular',
  },
  
  // OpenAI - Conservative client-side limit
  openai: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'openai',
  },
  
  // YouTube - 10,000 quota units per day
  youtube: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'youtube',
  },
  
  // Supabase - No strict limit but good practice
  supabase: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'supabase',
  },
  
  // General API calls
  default: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api',
  },
} as const;

export default globalRateLimiter;
