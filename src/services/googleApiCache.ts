/**
 * Google API Caching & Rate Limiting Service
 * 
 * Optimizes Google API calls to reduce costs and improve performance:
 * - Request caching with TTL
 * - Request deduplication (prevents duplicate concurrent requests)
 * - Rate limiting to prevent API quota exhaustion
 * - Cost tracking and monitoring
 */

import { feedCache } from './feedCache';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

interface ApiCallStats {
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimited: number;
  deduplicated: number;
  errors: number;
}

// Rate limiting configuration per API endpoint
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  places: {
    maxRequestsPerMinute: 60,  // Google Places: 60 requests/min
    maxRequestsPerHour: 1000,   // Conservative limit
    maxRequestsPerDay: 10000
  },
  directions: {
    maxRequestsPerMinute: 30,   // Google Directions: 30 requests/min
    maxRequestsPerHour: 500,
    maxRequestsPerDay: 5000
  },
  geocoding: {
    maxRequestsPerMinute: 50,
    maxRequestsPerHour: 1000,
    maxRequestsPerDay: 10000
  }
};

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  places: 20 * 60 * 1000,        // 20 minutes - places don't change often
  placeDetails: 30 * 60 * 1000,  // 30 minutes - details are stable
  directions: 5 * 60 * 1000,     // 5 minutes - directions can change with traffic
  geocoding: 24 * 60 * 60 * 1000 // 24 hours - addresses don't change
};

class GoogleApiCache {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private requestCounts = new Map<string, number[]>(); // Track request timestamps
  private stats: Record<string, ApiCallStats> = {};

  constructor() {
    // Initialize stats for each API type
    Object.keys(RATE_LIMITS).forEach(apiType => {
      this.stats[apiType] = {
        totalCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        rateLimited: 0,
        deduplicated: 0,
        errors: 0
      };
    });

    // Clean up old pending requests every minute
    setInterval(() => {
      this.cleanupPendingRequests();
    }, 60 * 1000);

    // Reset request counts every hour
    setInterval(() => {
      this.resetRequestCounts();
    }, 60 * 60 * 1000);
  }

  /**
   * Execute API call with caching, deduplication, and rate limiting
   */
  async execute<T>(
    apiType: 'places' | 'directions' | 'geocoding',
    cacheKey: string,
    apiCall: () => Promise<T>,
    options?: {
      useCache?: boolean;
      cacheDuration?: number;
      skipRateLimit?: boolean;
    }
  ): Promise<T> {
    const useCache = options?.useCache !== false;
    const cacheDuration = options?.cacheDuration || CACHE_DURATIONS[apiType] || 20 * 60 * 1000;
    const skipRateLimit = options?.skipRateLimit || false;

    // 1. Check cache first
    if (useCache) {
      const cached = feedCache.get<T>('places', [cacheKey]);
      if (cached !== null) {
        this.stats[apiType].cacheHits++;
        console.log(`✅ Google API cache hit: ${apiType} - ${cacheKey.substring(0, 50)}`);
        return cached;
      }
      this.stats[apiType].cacheMisses++;
    }

    // 2. Check for duplicate pending request
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      const age = Date.now() - pending.timestamp;
      if (age < 30000) { // 30 seconds max wait for duplicate
        this.stats[apiType].deduplicated++;
      console.log(`🔄 Deduplicating request: ${apiType} - ${cacheKey.substring(0, 50)}`);
        return pending.promise;
      } else {
        // Remove stale pending request
        this.pendingRequests.delete(cacheKey);
      }
    }

    // 3. Check rate limits
    if (!skipRateLimit && !this.checkRateLimit(apiType)) {
      this.stats[apiType].rateLimited++;
      throw new Error(`Rate limit exceeded for ${apiType} API. Please try again later.`);
    }

    // 4. Execute API call
    this.stats[apiType].totalCalls++;
    const promise = apiCall()
      .then(result => {
        // Cache successful result
        if (useCache) {
          feedCache.set('places', [cacheKey], result);
        }
        this.pendingRequests.delete(cacheKey);
        return result;
      })
      .catch(error => {
        this.stats[apiType].errors++;
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now()
    });

    // Track request timestamp for rate limiting
    this.trackRequest(apiType);

    return promise;
  }

  /**
   * Check if rate limit is exceeded
   */
  private checkRateLimit(apiType: string): boolean {
    const limits = RATE_LIMITS[apiType];
    if (!limits) return true; // No limits configured

    const now = Date.now();
    const timestamps = this.requestCounts.get(apiType) || [];
    
    // Filter to relevant time windows
    const lastMinute = timestamps.filter(ts => now - ts < 60 * 1000);
    const lastHour = timestamps.filter(ts => now - ts < 60 * 60 * 1000);
    const lastDay = timestamps.filter(ts => now - ts < 24 * 60 * 60 * 1000);

    // Check limits
    if (lastMinute.length >= limits.maxRequestsPerMinute) {
      console.warn(`⚠️ Rate limit: ${apiType} exceeded ${limits.maxRequestsPerMinute} requests/minute`);
      return false;
    }
    if (lastHour.length >= limits.maxRequestsPerHour) {
      console.warn(`⚠️ Rate limit: ${apiType} exceeded ${limits.maxRequestsPerHour} requests/hour`);
      return false;
    }
    if (lastDay.length >= limits.maxRequestsPerDay) {
      console.warn(`⚠️ Rate limit: ${apiType} exceeded ${limits.maxRequestsPerDay} requests/day`);
      return false;
    }

    return true;
  }

  /**
   * Track request timestamp for rate limiting
   */
  private trackRequest(apiType: string): void {
    const timestamps = this.requestCounts.get(apiType) || [];
    timestamps.push(Date.now());
    
    // Keep only last 24 hours of timestamps
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = timestamps.filter(ts => ts > oneDayAgo);
    
    this.requestCounts.set(apiType, filtered);
  }

  /**
   * Clean up old pending requests
   */
  private cleanupPendingRequests(): void {
    const now = Date.now();
    const maxAge = 60 * 1000; // 1 minute

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > maxAge) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Reset request counts (called periodically)
   */
  private resetRequestCounts(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const [apiType, timestamps] of this.requestCounts.entries()) {
      const filtered = timestamps.filter(ts => ts > oneDayAgo);
      this.requestCounts.set(apiType, filtered);
    }
  }

  /**
   * Get statistics for an API type
   */
  getStats(apiType?: string): Record<string, ApiCallStats> | ApiCallStats | null {
    if (apiType) {
      return this.stats[apiType] || null;
    }
    return { ...this.stats };
  }

  /**
   * Clear cache for specific API type
   */
  clearCache(apiType: 'places' | 'directions' | 'geocoding'): void {
    feedCache.clearContentType('places');
    console.log(`🗑️ Cleared cache for ${apiType}`);
  }

  /**
   * Generate cache key from parameters
   */
  static generateCacheKey(apiType: string, params: Record<string, unknown>): string {
    const sortedKeys = Object.keys(params).sort();
    const keyParts = sortedKeys.map(key => `${key}:${JSON.stringify(params[key])}`);
    return `${apiType}:${keyParts.join('|')}`;
  }
}

// Singleton instance
export const googleApiCache = new GoogleApiCache();

// Export utility function
export function withGoogleApiCache<T>(
  apiType: 'places' | 'directions' | 'geocoding',
  params: Record<string, unknown>,
  apiCall: () => Promise<T>,
  options?: {
    useCache?: boolean;
    cacheDuration?: number;
    skipRateLimit?: boolean;
  }
): Promise<T> {
  const cacheKey = GoogleApiCache.generateCacheKey(apiType, params);
  return googleApiCache.execute(apiType, cacheKey, apiCall, options);
}

