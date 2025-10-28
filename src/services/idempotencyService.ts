import { supabase } from './supabase';
import type { IdempotencyKey, ServiceResponse } from '../types/common';
import { AuthService } from './authService';

/**
 * Idempotency service for handling duplicate operations
 * Provides caching and deduplication for critical operations
 */
export class IdempotencyService {
  private static readonly APP_TENANT_ID = '00000000-0000-4000-8000-000000000001';
  private static readonly DEFAULT_TTL_HOURS = 24;

  /**
   * Execute operation with idempotency key
   * If key exists and hasn't expired, return cached result
   * Otherwise execute operation and cache result
   */
  static async executeWithIdempotency<T>(
    key: string,
    operation: () => Promise<T>,
    ttlHours: number = this.DEFAULT_TTL_HOURS
  ): Promise<T> {
    try {
      console.log('🔄 Checking idempotency key:', key);

      // Check if key exists and is not expired
      const cachedResult = await this.getCachedResult<T>(key);
      if (cachedResult !== null) {
        console.log('✅ Returning cached result for key:', key);
        return cachedResult;
      }

      console.log('⚡ Executing operation for key:', key);

      // Execute the operation
      const result = await operation();

      // Store the result with expiration
      await this.storeResult(key, result, ttlHours);

      console.log('💾 Operation result cached for key:', key);
      return result;
    } catch (error) {
      console.error('Error in executeWithIdempotency:', error);
      throw error;
    }
  }

  /**
   * Generate idempotency key from operation and parameters
   */
  static generateKey(operation: string, params: Record<string, unknown>): string {
    try {
      // Sort parameters to ensure consistent key generation
      const sortedParams = Object.keys(params)
        .sort()
        .reduce((result, key) => {
          result[key] = params[key];
          return result;
        }, {} as Record<string, unknown>);

      // Create a hash-like string from operation and params
      const dataString = JSON.stringify({ operation, params: sortedParams });
      
      // Simple hash function (for production, consider using crypto.subtle.digest)
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      const hashString = Math.abs(hash).toString(36);
      return `${operation}_${hashString}`;
    } catch (error) {
      console.error('Error generating idempotency key:', error);
      // Fallback to timestamp-based key
      return `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Generate user-specific idempotency key
   */
  static async generateUserKey(
    operation: string, 
    params: Record<string, unknown>
  ): Promise<string> {
    try {
      const user = await AuthService.getCurrentUser();
      const userSpecificParams = {
        ...params,
        user_id: user?.id || 'anonymous'
      };
      return this.generateKey(operation, userSpecificParams);
    } catch (error) {
      console.error('Error generating user-specific key:', error);
      return this.generateKey(operation, params);
    }
  }

  /**
   * Get cached result if it exists and hasn't expired
   */
  private static async getCachedResult<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('idempotency_keys')
        .select('result')
        .eq('key', key)
        .eq('tenant_id', this.APP_TENANT_ID)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        console.error('Error getting cached result:', error);
        return null;
      }

      return data?.result as T || null;
    } catch (error) {
      console.error('Error in getCachedResult:', error);
      return null;
    }
  }

  /**
   * Store operation result with expiration
   */
  private static async storeResult<T>(
    key: string, 
    result: T, 
    ttlHours: number
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      const { error } = await supabase
        .from('idempotency_keys')
        .upsert({
          key,
          tenant_id: this.APP_TENANT_ID,
          result: result as Record<string, unknown>,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Error storing idempotency result:', error);
        // Don't throw error here as the operation succeeded
        // This is just a caching optimization
      }
    } catch (error) {
      console.error('Error in storeResult:', error);
      // Don't throw error here as the operation succeeded
    }
  }

  /**
   * Manually invalidate an idempotency key
   */
  static async invalidateKey(key: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('idempotency_keys')
        .delete()
        .eq('key', key)
        .eq('tenant_id', this.APP_TENANT_ID);

      if (error) {
        console.error('Error invalidating key:', error);
        throw new Error(error.message);
      }

      console.log('🗑️ Idempotency key invalidated:', key);
      return {
        success: true,
        message: 'Key invalidated successfully'
      };
    } catch (error) {
      console.error('Error in invalidateKey:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to invalidate key'
      };
    }
  }

  /**
   * Clean up expired keys
   */
  static async cleanupExpiredKeys(): Promise<ServiceResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('idempotency_keys')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('key');

      if (error) {
        console.error('Error cleaning up expired keys:', error);
        throw new Error(error.message);
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Cleaned up ${deletedCount} expired idempotency keys`);

      return {
        success: true,
        data: deletedCount,
        message: `Cleaned up ${deletedCount} expired keys`
      };
    } catch (error) {
      console.error('Error in cleanupExpiredKeys:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to cleanup expired keys'
      };
    }
  }

  /**
   * Get all active keys for current tenant (for debugging)
   */
  static async getActiveKeys(): Promise<ServiceResponse<IdempotencyKey[]>> {
    try {
      const { data, error } = await supabase
        .from('idempotency_keys')
        .select('*')
        .eq('tenant_id', this.APP_TENANT_ID)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting active keys:', error);
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${data?.length || 0} active keys`
      };
    } catch (error) {
      console.error('Error in getActiveKeys:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        message: 'Failed to get active keys'
      };
    }
  }

  /**
   * Check if a key exists and is active
   */
  static async keyExists(key: string): Promise<boolean> {
    try {
      const result = await this.getCachedResult(key);
      return result !== null;
    } catch (error) {
      console.error('Error checking key existence:', error);
      return false;
    }
  }

  /**
   * Wrapper for common save operations with automatic key generation
   */
  static async executeSaveOperation<T>(
    operation: string,
    itemId: string,
    itemType: string,
    saveFunction: () => Promise<T>,
    ttlHours?: number
  ): Promise<T> {
    const key = this.generateKey(operation, { itemId, itemType });
    return this.executeWithIdempotency(key, saveFunction, ttlHours);
  }

  /**
   * Wrapper for user-specific operations with automatic key generation
   */
  static async executeUserOperation<T>(
    operation: string,
    params: Record<string, unknown>,
    userFunction: () => Promise<T>,
    ttlHours?: number
  ): Promise<T> {
    const key = await this.generateUserKey(operation, params);
    return this.executeWithIdempotency(key, userFunction, ttlHours);
  }

  /**
   * Get statistics about idempotency usage
   */
  static async getUsageStats(): Promise<ServiceResponse<{
    total: number;
    expired: number;
    active: number;
  }>> {
    try {
      const now = new Date().toISOString();

      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('idempotency_keys')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', this.APP_TENANT_ID);

      if (totalError) {
        throw new Error(totalError.message);
      }

      // Get expired count
      const { count: expiredCount, error: expiredError } = await supabase
        .from('idempotency_keys')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', this.APP_TENANT_ID)
        .lt('expires_at', now);

      if (expiredError) {
        throw new Error(expiredError.message);
      }

      const total = totalCount || 0;
      const expired = expiredCount || 0;
      const active = total - expired;

      return {
        success: true,
        data: { total, expired, active },
        message: `Stats: ${total} total, ${active} active, ${expired} expired`
      };
    } catch (error) {
      console.error('Error in getUsageStats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get usage stats'
      };
    }
  }

  /**
   * Get the Supabase client instance (for advanced usage)
   */
  static getSupabaseClient() {
    return supabase;
  }
}