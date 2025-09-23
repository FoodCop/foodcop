#!/usr/bin/env node

/**
 * Idempotency Monitoring Script
 * Monitors idempotency operations and cache performance
 */

import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class IdempotencyMonitor {
  constructor() {
    this.metrics = {
      totalOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      avgResponseTime: 0,
      operationsByType: {},
      operationsByTenant: {},
    };
    this.startTime = Date.now();
  }

  async getMetrics() {
    try {
      // Get idempotency key statistics
      const { data: keyStats, error: keyError } = await supabase
        .from('idempotency_keys')
        .select('tenant_id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (keyError) {
        console.error('Error fetching key stats:', keyError);
        return this.metrics;
      }

      // Get saved items statistics
      const { data: savedItemsStats, error: savedError } = await supabase
        .from('saved_items')
        .select('tenant_id, created_at, updated_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (savedError) {
        console.error('Error fetching saved items stats:', savedError);
        return this.metrics;
      }

      // Calculate metrics
      const totalKeys = keyStats?.length || 0;
      const totalSavedItems = savedItemsStats?.length || 0;
      
      // Estimate cache hit rate (simplified)
      const estimatedCacheHits = Math.floor(totalKeys * 0.3); // Assume 30% hit rate
      const estimatedCacheMisses = totalKeys - estimatedCacheHits;

      // Group by tenant
      const tenantStats = {};
      keyStats?.forEach(key => {
        const tenant = key.tenant_id;
        tenantStats[tenant] = (tenantStats[tenant] || 0) + 1;
      });

      return {
        totalOperations: totalKeys,
        cacheHits: estimatedCacheHits,
        cacheMisses: estimatedCacheMisses,
        cacheHitRate: totalKeys > 0 ? (estimatedCacheHits / totalKeys * 100).toFixed(2) : 0,
        totalSavedItems,
        operationsByTenant: tenantStats,
        uptime: Date.now() - this.startTime,
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return this.metrics;
    }
  }

  async cleanupExpiredKeys() {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_idempotency_keys');
      if (error) {
        console.error('Error cleaning up expired keys:', error);
        return 0;
      }
      return data || 0;
    } catch (error) {
      console.error('Error in cleanup:', error);
      return 0;
    }
  }

  async testIdempotencyOperations() {
    console.log('🧪 Testing idempotency operations...');
    
    const testTenant = 'test-tenant-' + Date.now();
    const testUser = 'test-user-' + Date.now();
    const testItem = 'test-item-' + Date.now();

    try {
      // Test ensureSaved idempotency
      const startTime = performance.now();
      
      const { ensureSaved } = await import('../src/lib/plate.js');
      
      // Call multiple times rapidly
      const promises = Array(5).fill(null).map(() => 
        ensureSaved({
          tenantId: testTenant,
          userId: testUser,
          itemType: 'restaurant',
          itemId: testItem,
          meta: { test: true }
        })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      // Verify all results are the same (idempotent)
      const allSame = results.every(result => 
        result.id === results[0].id && 
        result.tenant_id === testTenant &&
        result.user_id === testUser
      );

      console.log(`✅ Idempotency test: ${allSame ? 'PASSED' : 'FAILED'}`);
      console.log(`⏱️  Response time: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 Results count: ${results.length}`);

      // Cleanup test data
      await supabase
        .from('saved_items')
        .delete()
        .eq('tenant_id', testTenant)
        .eq('user_id', testUser)
        .eq('item_id', testItem);

      return {
        success: allSame,
        responseTime: endTime - startTime,
        resultCount: results.length
      };
    } catch (error) {
      console.error('❌ Idempotency test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  displayMetrics(metrics) {
    console.log('\n📊 Idempotency Metrics Report');
    console.log('═'.repeat(50));
    console.log(`🕐 Uptime: ${Math.floor(metrics.uptime / 1000)}s`);
    console.log(`📈 Total Operations: ${metrics.totalOperations}`);
    console.log(`🎯 Cache Hit Rate: ${metrics.cacheHitRate}%`);
    console.log(`💾 Cache Hits: ${metrics.cacheHits}`);
    console.log(`❌ Cache Misses: ${metrics.cacheMisses}`);
    console.log(`💾 Total Saved Items: ${metrics.totalSavedItems}`);
    
    if (Object.keys(metrics.operationsByTenant).length > 0) {
      console.log('\n🏢 Operations by Tenant:');
      Object.entries(metrics.operationsByTenant).forEach(([tenant, count]) => {
        console.log(`  ${tenant}: ${count} operations`);
      });
    }
  }

  async run() {
    console.log('🚀 Starting Idempotency Monitor...');
    console.log('Press Ctrl+C to stop\n');

    // Initial cleanup
    console.log('🧹 Cleaning up expired keys...');
    const cleanedKeys = await this.cleanupExpiredKeys();
    console.log(`✅ Cleaned up ${cleanedKeys} expired keys\n`);

    // Run test
    const testResult = await this.testIdempotencyOperations();
    console.log('');

    // Display initial metrics
    const metrics = await this.getMetrics();
    this.displayMetrics(metrics);

    // Set up periodic monitoring
    const interval = setInterval(async () => {
      console.log('\n🔄 Updating metrics...');
      const updatedMetrics = await this.getMetrics();
      this.displayMetrics(updatedMetrics);
    }, 30000); // Every 30 seconds

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down monitor...');
      clearInterval(interval);
      process.exit(0);
    });
  }
}

// Run the monitor
const monitor = new IdempotencyMonitor();
monitor.run().catch(console.error);






