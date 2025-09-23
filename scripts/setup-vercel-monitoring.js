#!/usr/bin/env node

/**
 * Vercel Monitoring Setup Script
 * Sets up monitoring for idempotency operations using Vercel Analytics
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class VercelMonitoringSetup {
  constructor() {
    this.projectRoot = process.cwd();
  }

  async checkVercelCLI() {
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ Vercel CLI is installed');
      return true;
    } catch (error) {
      console.log('❌ Vercel CLI not found. Installing...');
      try {
        execSync('npm install -g vercel', { stdio: 'inherit' });
        console.log('✅ Vercel CLI installed successfully');
        return true;
      } catch (installError) {
        console.error('❌ Failed to install Vercel CLI:', installError.message);
        return false;
      }
    }
  }

  async setupVercelProject() {
    try {
      console.log('🚀 Setting up Vercel project...');
      
      // Check if already linked
      const vercelConfigPath = path.join(this.projectRoot, '.vercel');
      if (fs.existsSync(vercelConfigPath)) {
        console.log('✅ Project already linked to Vercel');
        return true;
      }

      // Link project
      execSync('vercel link --yes', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      
      console.log('✅ Project linked to Vercel');
      return true;
    } catch (error) {
      console.error('❌ Failed to setup Vercel project:', error.message);
      return false;
    }
  }

  createMonitoringConfig() {
    const config = {
      analytics: {
        enabled: true,
        events: [
          'idempotency.cache_hit',
          'idempotency.cache_miss',
          'idempotency.operation_success',
          'idempotency.operation_error',
          'save_to_plate.ensure_saved',
          'save_to_plate.ensure_removed',
          'save_to_plate.duplicate_prevented'
        ]
      },
      monitoring: {
        idempotency: {
          enabled: true,
          cacheHitRateThreshold: 80,
          responseTimeThreshold: 1000,
          errorRateThreshold: 5
        }
      }
    };

    const configPath = path.join(this.projectRoot, 'vercel-monitoring.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Created Vercel monitoring configuration');
    return configPath;
  }

  createAnalyticsHelper() {
    const analyticsCode = `
// Vercel Analytics Helper for Idempotency Monitoring
export class IdempotencyAnalytics {
  static trackCacheHit(tenantId, operationType) {
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', 'idempotency.cache_hit', {
        tenantId,
        operationType,
        timestamp: Date.now()
      });
    }
  }

  static trackCacheMiss(tenantId, operationType) {
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', 'idempotency.cache_miss', {
        tenantId,
        operationType,
        timestamp: Date.now()
      });
    }
  }

  static trackOperationSuccess(tenantId, operationType, responseTime) {
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', 'idempotency.operation_success', {
        tenantId,
        operationType,
        responseTime,
        timestamp: Date.now()
      });
    }
  }

  static trackOperationError(tenantId, operationType, error) {
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', 'idempotency.operation_error', {
        tenantId,
        operationType,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  static trackSaveToPlate(operation, itemType, success) {
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', \`save_to_plate.\${operation}\`, {
        itemType,
        success,
        timestamp: Date.now()
      });
    }
  }

  static trackDuplicatePrevented(tenantId, itemType) {
    if (typeof window !== 'undefined' && window.va) {
      window.va('track', 'save_to_plate.duplicate_prevented', {
        tenantId,
        itemType,
        timestamp: Date.now()
      });
    }
  }
}
`;

    const analyticsPath = path.join(this.projectRoot, 'src/lib/analytics.ts');
    fs.writeFileSync(analyticsPath, analyticsCode);
    console.log('✅ Created analytics helper');
    return analyticsPath;
  }

  updatePlateService() {
    const plateServicePath = path.join(this.projectRoot, 'src/lib/plate.ts');
    
    if (!fs.existsSync(plateServicePath)) {
      console.log('❌ Plate service not found');
      return false;
    }

    let content = fs.readFileSync(plateServicePath, 'utf8');
    
    // Add analytics import
    if (!content.includes('import { IdempotencyAnalytics }')) {
      content = content.replace(
        'import { getSupabaseClient } from "../../utils/supabase";',
        'import { getSupabaseClient } from "../../utils/supabase";\nimport { IdempotencyAnalytics } from "./analytics";'
      );
    }

    // Add analytics tracking to ensureSaved
    if (!content.includes('IdempotencyAnalytics.trackOperationSuccess')) {
      content = content.replace(
        '  return data;',
        `  // Track successful operation
  IdempotencyAnalytics.trackOperationSuccess(tenantId, 'ensureSaved', Date.now() - startTime);
  
  return data;`
      );
    }

    // Add analytics tracking to ensureRemoved
    if (!content.includes('IdempotencyAnalytics.trackSaveToPlate')) {
      content = content.replace(
        '  return { removed: true };',
        `  // Track successful removal
  IdempotencyAnalytics.trackSaveToPlate('ensure_removed', itemType, true);
  
  return { removed: true };`
      );
    }

    fs.writeFileSync(plateServicePath, content);
    console.log('✅ Updated plate service with analytics');
    return true;
  }

  createDashboardHTML() {
    const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Idempotency Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 14px; color: #666; }
        .chart-container { height: 300px; margin: 20px 0; }
        .status-good { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-error { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Idempotency Monitoring Dashboard</h1>
        
        <div class="card">
            <h2>📊 Real-time Metrics</h2>
            <div class="metric">
                <div class="metric-value" id="cacheHitRate">--</div>
                <div class="metric-label">Cache Hit Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="totalOperations">--</div>
                <div class="metric-label">Total Operations</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="avgResponseTime">--</div>
                <div class="metric-label">Avg Response Time (ms)</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="errorRate">--</div>
                <div class="metric-label">Error Rate</div>
            </div>
        </div>

        <div class="card">
            <h2>📈 Operations Over Time</h2>
            <div class="chart-container">
                <canvas id="operationsChart"></canvas>
            </div>
        </div>

        <div class="card">
            <h2>🏢 Operations by Tenant</h2>
            <div class="chart-container">
                <canvas id="tenantChart"></canvas>
            </div>
        </div>

        <div class="card">
            <h2>⚡ Performance Trends</h2>
            <div class="chart-container">
                <canvas id="performanceChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        // Initialize charts
        const operationsCtx = document.getElementById('operationsChart').getContext('2d');
        const tenantCtx = document.getElementById('tenantChart').getContext('2d');
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');

        const operationsChart = new Chart(operationsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cache Hits',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }, {
                    label: 'Cache Misses',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        const tenantChart = new Chart(tenantCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        const performanceChart = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Simulate real-time data updates
        function updateMetrics() {
            // In a real implementation, this would fetch from your API
            const mockData = {
                cacheHitRate: Math.random() * 20 + 80,
                totalOperations: Math.floor(Math.random() * 1000) + 5000,
                avgResponseTime: Math.floor(Math.random() * 100) + 50,
                errorRate: Math.random() * 5
            };

            document.getElementById('cacheHitRate').textContent = mockData.cacheHitRate.toFixed(1) + '%';
            document.getElementById('totalOperations').textContent = mockData.totalOperations.toLocaleString();
            document.getElementById('avgResponseTime').textContent = mockData.avgResponseTime;
            document.getElementById('errorRate').textContent = mockData.errorRate.toFixed(2) + '%';

            // Update charts with new data points
            const now = new Date().toLocaleTimeString();
            
            // Add new data point
            operationsChart.data.labels.push(now);
            operationsChart.data.datasets[0].data.push(Math.floor(Math.random() * 100));
            operationsChart.data.datasets[1].data.push(Math.floor(Math.random() * 50));
            
            // Keep only last 20 data points
            if (operationsChart.data.labels.length > 20) {
                operationsChart.data.labels.shift();
                operationsChart.data.datasets[0].data.shift();
                operationsChart.data.datasets[1].data.shift();
            }
            
            operationsChart.update();

            // Update performance chart
            performanceChart.data.labels.push(now);
            performanceChart.data.datasets[0].data.push(mockData.avgResponseTime);
            
            if (performanceChart.data.labels.length > 20) {
                performanceChart.data.labels.shift();
                performanceChart.data.datasets[0].data.shift();
            }
            
            performanceChart.update();
        }

        // Update metrics every 5 seconds
        setInterval(updateMetrics, 5000);
        updateMetrics(); // Initial update
    </script>
</body>
</html>`;

    const dashboardPath = path.join(this.projectRoot, 'public/idempotency-dashboard.html');
    fs.writeFileSync(dashboardPath, dashboardHTML);
    console.log('✅ Created monitoring dashboard');
    return dashboardPath;
  }

  async run() {
    console.log('🚀 Setting up Vercel Monitoring for Idempotency Operations...\n');

    // Check Vercel CLI
    const cliInstalled = await this.checkVercelCLI();
    if (!cliInstalled) {
      console.log('❌ Cannot proceed without Vercel CLI');
      return false;
    }

    // Setup Vercel project
    const projectSetup = await this.setupVercelProject();
    if (!projectSetup) {
      console.log('❌ Failed to setup Vercel project');
      return false;
    }

    // Create monitoring configuration
    this.createMonitoringConfig();

    // Create analytics helper
    this.createAnalyticsHelper();

    // Update plate service
    this.updatePlateService();

    // Create dashboard
    this.createDashboardHTML();

    console.log('\n✅ Vercel monitoring setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy your app: vercel --prod');
    console.log('2. Enable Vercel Analytics in your dashboard');
    console.log('3. View monitoring dashboard at: /idempotency-dashboard.html');
    console.log('4. Run monitoring script: node scripts/monitor-idempotency.js');

    return true;
  }
}

// Run the setup
const setup = new VercelMonitoringSetup();
setup.run().catch(console.error);






