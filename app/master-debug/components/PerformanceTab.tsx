"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Database, Globe, Clock } from "lucide-react";
import { DebugService } from "../lib/debug-service";
import type { SystemHealth } from "../lib/types";

interface PerformanceTabProps {
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
}

export function PerformanceTab({ systemHealth, onRefresh }: PerformanceTabProps) {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    pageLoadTime: 0,
    apiResponseTimes: {},
    memoryUsage: 0,
    networkLatency: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (systemHealth) {
      measurePerformance();
    }
  }, [systemHealth]);

  const measurePerformance = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();
      
      // Measure API response times
      const apiTests = [
        { name: 'supabase', url: '/api/debug/supabase' },
        { name: 'googleMaps', url: '/api/debug/google-maps' },
        { name: 'spoonacular', url: '/api/debug/spoonacular' },
        { name: 'openai', url: '/api/debug/openai' }
      ];

      const apiTimes: { [key: string]: number } = {};
      
      for (const test of apiTests) {
        try {
          const apiStart = performance.now();
          await fetch(test.url);
          const apiEnd = performance.now();
          apiTimes[test.name] = Math.round(apiEnd - apiStart);
        } catch (error) {
          apiTimes[test.name] = -1; // Error
        }
      }

      const endTime = performance.now();
      
      setPerformanceMetrics({
        pageLoadTime: Math.round(endTime - startTime),
        apiResponseTimes: apiTimes,
        memoryUsage: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0,
        networkLatency: Math.round((endTime - startTime) / apiTests.length)
      });
    } catch (error) {
      console.error("Performance measurement failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    DebugService.clearCache();
    // Also clear browser cache if possible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    onRefresh();
  };

  const getPerformanceStatus = (time: number) => {
    if (time < 0) return { status: 'error', color: 'red', text: 'Error' };
    if (time < 200) return { status: 'excellent', color: 'green', text: 'Excellent' };
    if (time < 500) return { status: 'good', color: 'yellow', text: 'Good' };
    if (time < 1000) return { status: 'fair', color: 'orange', text: 'Fair' };
    return { status: 'poor', color: 'red', text: 'Poor' };
  };

  const getCacheHitRate = () => {
    return systemHealth?.performance.cacheHitRate || 0;
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                System performance metrics and optimization status
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={measurePerformance} disabled={loading} size="sm" variant="outline">
                <Clock className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Measure
              </Button>
              <Button onClick={onRefresh} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {systemHealth.performance.cacheHitRate}%
              </div>
              <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {systemHealth.performance.averageResponseTime}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {systemHealth.performance.apiCallsLast5Min}
              </div>
              <div className="text-sm text-muted-foreground">API Calls (5m)</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {performanceMetrics.memoryUsage}MB
              </div>
              <div className="text-sm text-muted-foreground">Memory Usage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Response Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ API Response Times
          </CardTitle>
          <CardDescription>
            Real-time performance metrics for all API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(performanceMetrics.apiResponseTimes).map(([api, timeValue]) => {
              const time = typeof timeValue === 'number' ? timeValue : -1;
              const status = getPerformanceStatus(time);
              return (
                <div key={api} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium capitalize">
                        {api.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        API endpoint response time
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={time < 0 ? "destructive" : time < 500 ? "default" : "secondary"}
                      className="min-w-20 justify-center"
                    >
                      {time < 0 ? 'Error' : `${time}ms`}
                    </Badge>
                    <div className="w-24">
                      <Progress 
                        value={time < 0 ? 0 : Math.min((1000 - time) / 10, 100)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Caching Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💾 Caching Performance
          </CardTitle>
          <CardDescription>
            Cache efficiency and optimization metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Cache Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hit Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress value={getCacheHitRate()} className="w-24 h-2" />
                      <span className="text-sm font-medium">{getCacheHitRate()}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency</span>
                    <Badge variant={getCacheHitRate() > 80 ? "default" : getCacheHitRate() > 50 ? "secondary" : "destructive"}>
                      {getCacheHitRate() > 80 ? "Excellent" : getCacheHitRate() > 50 ? "Good" : "Poor"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cached Endpoints</span>
                    <span className="text-sm font-medium">{systemHealth.performance.apiCallsLast5Min}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Cache Actions</h4>
                <div className="space-y-2">
                  <Button onClick={clearCache} variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Clear All Caches
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                    }}
                    variant="outline" 
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Browser Storage
                  </Button>
                  
                  <Button onClick={measurePerformance} variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Remeasure Performance
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌐 Network Performance
          </CardTitle>
          <CardDescription>
            Network latency and connection quality metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold mb-2">
                {performanceMetrics.networkLatency}ms
              </div>
              <div className="text-sm text-muted-foreground">Average Latency</div>
              <Progress 
                value={Math.max(0, 100 - (performanceMetrics.networkLatency / 10))} 
                className="mt-2 h-2"
              />
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold mb-2">
                {Object.values(systemHealth.apis).filter((api: any) => api.connected).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Connections</div>
              <Progress 
                value={(Object.values(systemHealth.apis).filter((api: any) => api.connected).length / Object.keys(systemHealth.apis).length) * 100} 
                className="mt-2 h-2"
              />
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold mb-2">
                {performanceMetrics.pageLoadTime}ms
              </div>
              <div className="text-sm text-muted-foreground">Page Load Time</div>
              <Progress 
                value={Math.max(0, 100 - (performanceMetrics.pageLoadTime / 50))} 
                className="mt-2 h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Performance Recommendations
          </CardTitle>
          <CardDescription>
            Optimization suggestions based on current metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getCacheHitRate() < 70 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Low Cache Hit Rate</h4>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider implementing better caching strategies to improve performance.
                </p>
              </div>
            )}
            
            {performanceMetrics.networkLatency > 1000 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium text-red-800">High Network Latency</h4>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Network latency is high. Consider using a CDN or optimizing API calls.
                </p>
              </div>
            )}
            
            {Object.values(performanceMetrics.apiResponseTimes).some(timeValue => {
              const time = typeof timeValue === 'number' ? timeValue : 0;
              return time > 2000;
            }) && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Slow API Responses</h4>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Some APIs are responding slowly. Consider optimizing queries or implementing timeouts.
                </p>
              </div>
            )}
            
            {getCacheHitRate() > 90 && performanceMetrics.networkLatency < 200 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-green-800">Excellent Performance</h4>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your system is performing well with good cache efficiency and low latency.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}