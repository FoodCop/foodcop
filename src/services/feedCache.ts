/**
 * Phase 3: Intelligent Caching System
 * 
 * Implements content-type specific caching with automatic expiration,
 * memory management, and performance optimization for feed generation.
 */

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  expiredEntries: number;
}

export interface CacheConfig {
  maxMemoryMB?: number;
  cleanupIntervalMs?: number;
  enableStats?: boolean;
}

/**
 * Phase 3: Content-specific cache durations
 * Based on content freshness requirements and user engagement patterns
 */
const CACHE_DURATION = {
  restaurant: 30 * 60 * 1000,   // 30 minutes (location-sensitive, hours change)
  recipe: 24 * 60 * 60 * 1000,  // 24 hours (static content, rarely changes)
  video: 60 * 60 * 1000,        // 1 hour (trending changes frequently)
  masterbot: 60 * 60 * 1000,    // 1 hour (new posts appear regularly)
  ad: 15 * 60 * 1000,           // 15 minutes (fresh impressions important)
  places: 20 * 60 * 1000,       // 20 minutes (Google Places API responses)
  youtube: 45 * 60 * 1000,      // 45 minutes (YouTube search results)
  spoonacular: 2 * 60 * 60 * 1000, // 2 hours (recipe search results)
  default: 30 * 60 * 1000       // 30 minutes fallback
} as const;

export type CacheContentType = keyof typeof CACHE_DURATION;

class IntelligentCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    entries: 0,
    cleanups: 0
  };
  private cleanupInterval: NodeJS.Timeout | number | null = null;
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxMemoryMB: config.maxMemoryMB ?? 50,
      cleanupIntervalMs: config.cleanupIntervalMs ?? 5 * 60 * 1000, // 5 minutes
      enableStats: config.enableStats ?? true
    };

    this.startCleanupInterval();
    console.log('🧠 IntelligentCache initialized:', {
      maxMemory: `${this.config.maxMemoryMB}MB`,
      cleanupInterval: `${this.config.cleanupIntervalMs / 1000}s`
    });
  }

  /**
   * Generate cache key from components
   */
  private generateKey(contentType: CacheContentType, keyComponents: (string | number)[]): string {
    return `${contentType}:${keyComponents.join(':')}`;
  }

  /**
   * Get cache duration for content type
   */
  private getCacheDuration(contentType: CacheContentType): number {
    return CACHE_DURATION[contentType] || CACHE_DURATION.default;
  }

  /**
   * Estimate memory usage of an entry (rough approximation)
   */
  private estimateMemoryUsage(data: unknown): number {
    try {
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1000; // Fallback estimate
    }
  }

  /**
   * Get current memory usage in bytes
   */
  private getMemoryUsage(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += this.estimateMemoryUsage(entry.data);
    }
    return total;
  }

  /**
   * Set cache entry with automatic expiration
   */
  set<T>(
    contentType: CacheContentType, 
    keyComponents: (string | number)[], 
    data: T
  ): void {
    const key = this.generateKey(contentType, keyComponents);
    const now = Date.now();
    const expiresAt = now + this.getCacheDuration(contentType);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.stats.entries++;

    // Check memory limits
    if (this.getMemoryUsage() > this.config.maxMemoryMB * 1024 * 1024) {
      this.evictLeastUsed();
    }

    if (this.config.enableStats) {
      console.log(`💾 Cached ${contentType}:`, {
        key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
        expiresIn: `${Math.round((expiresAt - now) / 1000)}s`,
        memoryUsage: `${Math.round(this.getMemoryUsage() / 1024)}KB`
      });
    }
  }

  /**
   * Get cache entry if valid and not expired
   */
  get<T>(contentType: CacheContentType, keyComponents: (string | number)[]): T | null {
    const key = this.generateKey(contentType, keyComponents);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      
      if (this.config.enableStats) {
        console.log(`⏰ Cache expired for ${contentType}:`, key.substring(0, 50));
      }
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    if (this.config.enableStats) {
      const age = Math.round((Date.now() - entry.timestamp) / 1000);
      console.log(`✅ Cache hit for ${contentType}:`, {
        key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
        age: `${age}s`,
        accessCount: entry.accessCount
      });
    }

    return entry.data;
  }

  /**
   * Check if content is cached and valid
   */
  has(contentType: CacheContentType, keyComponents: (string | number)[]): boolean {
    const key = this.generateKey(contentType, keyComponents);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(contentType: CacheContentType, keyComponents: (string | number)[]): void {
    const key = this.generateKey(contentType, keyComponents);
    const deleted = this.cache.delete(key);
    
    if (deleted && this.config.enableStats) {
      console.log(`🗑️ Cache invalidated for ${contentType}:`, key.substring(0, 50));
    }
  }

  /**
   * Clear all entries for a specific content type
   */
  clearContentType(contentType: CacheContentType): number {
    let cleared = 0;
    const prefix = `${contentType}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    if (this.config.enableStats && cleared > 0) {
      console.log(`🧹 Cleared ${cleared} entries for ${contentType}`);
    }
    
    return cleared;
  }

  /**
   * Evict least recently used entries to free memory
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    const toEvict = Math.ceil(entries.length * 0.2); // Evict 20% of entries
    
    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.cache.delete(entries[i].key);
    }
    
    if (this.config.enableStats) {
      console.log(`🧹 Evicted ${toEvict} LRU cache entries for memory management`);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    this.stats.cleanups++;
    
    if (this.config.enableStats && expiredCount > 0) {
      console.log(`🧽 Cleanup removed ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
    
    let expiredEntries = 0;
    const now = Date.now();
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) expiredEntries++;
    }

    return {
      totalEntries: this.cache.size,
      memoryUsage: Math.round(this.getMemoryUsage() / 1024), // KB
      hitRate: Math.round(hitRate * 10) / 10, // 1 decimal place
      missRate: Math.round(missRate * 10) / 10,
      expiredEntries
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, entries: 0, cleanups: 0 };
    
    if (this.config.enableStats) {
      console.log(`🗑️ Cache cleared: ${count} entries removed`);
    }
  }

  /**
   * Shutdown cache and cleanup resources
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
    console.log('🛑 IntelligentCache shutdown complete');
  }
}

// Global cache instance
export const feedCache = new IntelligentCache({
  maxMemoryMB: 50,
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
  enableStats: true
});

/**
 * Phase 3: Utility functions for common caching patterns
 */

/**
 * Cache wrapper for async functions with automatic caching
 */
export async function withCache<T>(
  contentType: CacheContentType,
  keyComponents: (string | number)[],
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = feedCache.get<T>(contentType, keyComponents);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  try {
    const data = await fetchFn();
    feedCache.set(contentType, keyComponents, data);
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch data for cache ${contentType}:`, error);
    throw error;
  }
}

/**
 * Generate location-based cache key
 */
export function generateLocationKey(lat: number, lng: number, radius: number): string {
  // Round to reduce cache fragmentation
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  return `${roundedLat},${roundedLng},${radius}`;
}

/**
 * Generate preferences-based cache key
 */
export function generatePreferencesKey(preferences: Record<string, unknown>): string {
  // Create deterministic key from preferences
  const keys = Object.keys(preferences).sort();
  const pairs = keys.map(key => `${key}:${JSON.stringify(preferences[key])}`);
  return pairs.join('|');
}

export default feedCache;