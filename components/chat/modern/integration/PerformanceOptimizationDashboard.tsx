'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Gauge, 
  Zap, 
  HardDrive, 
  Timer, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Settings,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Eye,
  Layers,
  Cpu,
  HardDrive as MemoryIcon,
  Network,
  Image as ImageIcon
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  category: 'rendering' | 'memory' | 'network' | 'interaction';
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface OptimizationSetting {
  id: string;
  name: string;
  description: string;
  category: 'virtual-scrolling' | 'caching' | 'lazy-loading' | 'compression';
  enabled: boolean;
  value: number;
  min: number;
  max: number;
  unit: string;
  impact: 'high' | 'medium' | 'low';
}

interface VirtualScrollConfig {
  itemHeight: number;
  bufferSize: number;
  overscan: number;
  recycling: boolean;
  dynamicHeight: boolean;
}

interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'lfu' | 'fifo';
  preload: boolean;
}

const PerformanceOptimizationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      id: 'fps',
      name: 'Frame Rate',
      value: 58,
      target: 60,
      unit: 'FPS',
      category: 'rendering',
      status: 'warning',
      trend: 'down',
      history: [60, 59, 58, 57, 58, 59, 58]
    },
    {
      id: 'load-time',
      name: 'Initial Load Time',
      value: 1.2,
      target: 2.0,
      unit: 's',
      category: 'network',
      status: 'good',
      trend: 'stable',
      history: [1.3, 1.2, 1.1, 1.2, 1.2, 1.1, 1.2]
    },
    {
      id: 'memory-usage',
      name: 'Memory Usage',
      value: 45,
      target: 50,
      unit: 'MB',
      category: 'memory',
      status: 'good',
      trend: 'up',
      history: [42, 43, 44, 45, 44, 45, 45]
    },
    {
      id: 'scroll-performance',
      name: 'Scroll Performance',
      value: 95,
      target: 90,
      unit: '%',
      category: 'interaction',
      status: 'good',
      trend: 'stable',
      history: [93, 94, 95, 96, 95, 95, 95]
    },
    {
      id: 'bundle-size',
      name: 'Bundle Size',
      value: 2.1,
      target: 2.5,
      unit: 'MB',
      category: 'network',
      status: 'good',
      trend: 'down',
      history: [2.3, 2.2, 2.1, 2.0, 2.1, 2.1, 2.1]
    },
    {
      id: 'cache-hit-rate',
      name: 'Cache Hit Rate',
      value: 87,
      target: 85,
      unit: '%',
      category: 'memory',
      status: 'good',
      trend: 'up',
      history: [82, 84, 85, 86, 87, 88, 87]
    }
  ]);

  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSetting[]>([
    {
      id: 'virtual-scroll-buffer',
      name: 'Virtual Scroll Buffer',
      description: 'Number of items to render outside viewport',
      category: 'virtual-scrolling',
      enabled: true,
      value: 10,
      min: 5,
      max: 50,
      unit: 'items',
      impact: 'high'
    },
    {
      id: 'message-cache-size',
      name: 'Message Cache Size',
      description: 'Maximum number of messages to keep in memory',
      category: 'caching',
      enabled: true,
      value: 1000,
      min: 100,
      max: 5000,
      unit: 'messages',
      impact: 'high'
    },
    {
      id: 'image-lazy-threshold',
      name: 'Image Lazy Load Threshold',
      description: 'Distance from viewport to start loading images',
      category: 'lazy-loading',
      enabled: true,
      value: 200,
      min: 50,
      max: 500,
      unit: 'px',
      impact: 'medium'
    },
    {
      id: 'image-compression',
      name: 'Image Compression Quality',
      description: 'JPEG compression quality for uploaded images',
      category: 'compression',
      enabled: true,
      value: 80,
      min: 50,
      max: 100,
      unit: '%',
      impact: 'medium'
    },
    {
      id: 'preload-conversations',
      name: 'Preload Conversations',
      description: 'Number of recent conversations to preload',
      category: 'caching',
      enabled: true,
      value: 5,
      min: 0,
      max: 20,
      unit: 'conversations',
      impact: 'low'
    }
  ]);

  const [virtualScrollConfig, setVirtualScrollConfig] = useState<VirtualScrollConfig>({
    itemHeight: 80,
    bufferSize: 10,
    overscan: 5,
    recycling: true,
    dynamicHeight: false
  });

  const [cacheConfig, setCacheConfig] = useState<CacheConfig>({
    maxSize: 100,
    ttl: 300000, // 5 minutes
    strategy: 'lru',
    preload: true
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLog, setOptimizationLog] = useState<string[]>([]);
  const performanceRef = useRef<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rendering': return <Eye className="w-4 h-4" />;
      case 'memory': return <MemoryIcon className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      case 'interaction': return <Target className="w-4 h-4" />;
      case 'virtual-scrolling': return <Layers className="w-4 h-4" />;
      case 'caching': return <HardDrive className="w-4 h-4" />;
      case 'lazy-loading': return <Timer className="w-4 h-4" />;
      case 'compression': return <ImageIcon className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addOptimizationLog = (message: string) => {
    setOptimizationLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    addOptimizationLog('Starting performance optimization...');

    // Simulate optimization steps
    const steps = [
      'Clearing unused cache entries',
      'Optimizing virtual scroll buffer',
      'Compressing cached images',
      'Preloading priority conversations',
      'Adjusting lazy loading thresholds',
      'Updating render optimization flags'
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addOptimizationLog(step);
      
      // Update metrics to show improvement
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 2,
        history: [...metric.history.slice(1), metric.value + (Math.random() - 0.5) * 2]
      })));
    }

    addOptimizationLog('Optimization completed successfully');
    setIsOptimizing(false);
  };

  const updateOptimizationSetting = (settingId: string, newValue: number) => {
    setOptimizationSettings(prev => prev.map(setting =>
      setting.id === settingId ? { ...setting, value: newValue } : setting
    ));
    addOptimizationLog(`Updated ${optimizationSettings.find(s => s.id === settingId)?.name} to ${newValue}`);
  };

  const toggleOptimizationSetting = (settingId: string) => {
    setOptimizationSettings(prev => prev.map(setting =>
      setting.id === settingId ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const resetToDefaults = () => {
    setVirtualScrollConfig({
      itemHeight: 80,
      bufferSize: 10,
      overscan: 5,
      recycling: true,
      dynamicHeight: false
    });
    
    setCacheConfig({
      maxSize: 100,
      ttl: 300000,
      strategy: 'lru',
      preload: true
    });

    addOptimizationLog('Reset all settings to defaults');
  };

  // Simulate real-time performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const newValue = metric.value + (Math.random() - 0.5) * 1;
        const newStatus = newValue < metric.target * 0.7 ? 'critical' :
                         newValue < metric.target * 0.9 ? 'warning' : 'good';
        
        return {
          ...metric,
          value: Math.max(0, newValue),
          status: newStatus,
          history: [...metric.history.slice(1), newValue]
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Performance Optimization Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset Defaults
          </Button>
          <Button onClick={runOptimization} disabled={isOptimizing} className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </Button>
        </div>
      </div>

      {/* Performance Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(metric.category)}
                  <p className="font-medium text-sm">{metric.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  {getStatusIcon(metric.status)}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-2xl font-bold">{metric.value.toFixed(1)}</p>
                <p className="text-sm text-gray-600">{metric.unit}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Target: {metric.target.toFixed(1)}{metric.unit}</span>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
              <Progress 
                value={(metric.value / metric.target) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Optimization Settings</TabsTrigger>
          <TabsTrigger value="virtual-scroll">Virtual Scrolling</TabsTrigger>
          <TabsTrigger value="caching">Cache Management</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Performance Optimization Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {optimizationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getCategoryIcon(setting.category)}
                        <div>
                          <p className="font-medium">{setting.name}</p>
                          <p className="text-sm text-gray-600">{setting.description}</p>
                        </div>
                        <Badge className={getImpactColor(setting.impact)}>
                          {setting.impact} impact
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Input
                            type="range"
                            value={setting.value}
                            onChange={(e) => updateOptimizationSetting(setting.id, parseInt(e.target.value))}
                            min={setting.min}
                            max={setting.max}
                            step={1}
                            disabled={!setting.enabled}
                            className="w-full"
                          />
                        </div>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <span className="font-mono text-sm">
                            {setting.value} {setting.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={setting.enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleOptimizationSetting(setting.id)}
                    >
                      {setting.enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="virtual-scroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Virtual Scrolling Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Item Height</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="range"
                        value={virtualScrollConfig.itemHeight}
                        onChange={(e) => setVirtualScrollConfig(prev => ({ ...prev, itemHeight: parseInt(e.target.value) }))}
                        min={50}
                        max={200}
                        step={10}
                        className="flex-1"
                      />
                      <span className="font-mono text-sm min-w-[60px]">{virtualScrollConfig.itemHeight}px</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Buffer Size</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="range"
                        value={virtualScrollConfig.bufferSize}
                        onChange={(e) => setVirtualScrollConfig(prev => ({ ...prev, bufferSize: parseInt(e.target.value) }))}
                        min={5}
                        max={50}
                        step={5}
                        className="flex-1"
                      />
                      <span className="font-mono text-sm min-w-[60px]">{virtualScrollConfig.bufferSize} items</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Overscan</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="range"
                        value={virtualScrollConfig.overscan}
                        onChange={(e) => setVirtualScrollConfig(prev => ({ ...prev, overscan: parseInt(e.target.value) }))}
                        min={0}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                      <span className="font-mono text-sm min-w-[60px]">{virtualScrollConfig.overscan} items</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Element Recycling</span>
                    <Button
                      variant={virtualScrollConfig.recycling ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVirtualScrollConfig(prev => ({ ...prev, recycling: !prev.recycling }))}
                    >
                      {virtualScrollConfig.recycling ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Dynamic Height</span>
                    <Button
                      variant={virtualScrollConfig.dynamicHeight ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVirtualScrollConfig(prev => ({ ...prev, dynamicHeight: !prev.dynamicHeight }))}
                    >
                      {virtualScrollConfig.dynamicHeight ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Cache Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Cache Size</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="range"
                        value={cacheConfig.maxSize}
                        onChange={(e) => setCacheConfig(prev => ({ ...prev, maxSize: parseInt(e.target.value) }))}
                        min={50}
                        max={500}
                        step={10}
                        className="flex-1"
                      />
                      <span className="font-mono text-sm min-w-[60px]">{cacheConfig.maxSize}MB</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time to Live</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="range"
                        value={cacheConfig.ttl / 60000}
                        onChange={(e) => setCacheConfig(prev => ({ ...prev, ttl: parseInt(e.target.value) * 60000 }))}
                        min={1}
                        max={60}
                        step={1}
                        className="flex-1"
                      />
                      <span className="font-mono text-sm min-w-[60px]">{cacheConfig.ttl / 60000}min</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Cache Strategy</span>
                    <select 
                      value={cacheConfig.strategy}
                      onChange={(e) => setCacheConfig(prev => ({ ...prev, strategy: e.target.value as any }))}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="lru">LRU (Least Recently Used)</option>
                      <option value="lfu">LFU (Least Frequently Used)</option>
                      <option value="fifo">FIFO (First In, First Out)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Preload Content</span>
                    <Button
                      variant={cacheConfig.preload ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCacheConfig(prev => ({ ...prev, preload: !prev.preload }))}
                    >
                      {cacheConfig.preload ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(metric.category)}
                        <span className="text-sm">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{metric.value.toFixed(1)}{metric.unit}</span>
                        {getTrendIcon(metric.trend)}
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Optimization Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {optimizationLog.map((log, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded font-mono">
                      {log}
                    </div>
                  ))}
                  {optimizationLog.length === 0 && (
                    <p className="text-gray-600 text-sm">No optimization activities yet...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceOptimizationDashboard;