import { describe, it, expect, beforeEach } from 'vitest';
import { globalRateLimiter, RateLimitPresets } from '../utils/rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    globalRateLimiter.clearAll();
  });

  it('should allow requests within limit', () => {
    const config = { maxRequests: 3, windowMs: 1000 };
    
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    const config = { maxRequests: 2, windowMs: 1000 };
    
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(false);
  });

  it('should return correct remaining count', () => {
    const config = { maxRequests: 5, windowMs: 1000 };
    
    expect(globalRateLimiter.getRemaining('test-key', config)).toBe(5);
    globalRateLimiter.checkLimit('test-key', config);
    expect(globalRateLimiter.getRemaining('test-key', config)).toBe(4);
    globalRateLimiter.checkLimit('test-key', config);
    expect(globalRateLimiter.getRemaining('test-key', config)).toBe(3);
  });

  it('should reset limits after time window', async () => {
    const config = { maxRequests: 2, windowMs: 100 }; // 100ms window
    
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should allow new requests
    expect(globalRateLimiter.checkLimit('test-key', config)).toBe(true);
  });

  it('should use key prefix correctly', () => {
    const config = { maxRequests: 2, windowMs: 1000, keyPrefix: 'api' };
    
    expect(globalRateLimiter.checkLimit('test', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test', config)).toBe(true);
    expect(globalRateLimiter.checkLimit('test', config)).toBe(false);
    
    // Different prefix should have separate limit
    const config2 = { maxRequests: 2, windowMs: 1000, keyPrefix: 'other' };
    expect(globalRateLimiter.checkLimit('test', config2)).toBe(true);
  });

  it('should have correct preset configurations', () => {
    expect(RateLimitPresets.googleMaps.maxRequests).toBe(100);
    expect(RateLimitPresets.spoonacular.maxRequests).toBe(10);
    expect(RateLimitPresets.openai.maxRequests).toBe(20);
  });
});
