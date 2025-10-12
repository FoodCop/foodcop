'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Wifi,
  Battery,
  Signal,
  Camera,
  Mic,
  Settings,
  Zap,
  Activity,
  Target,
  Shield,
  Gauge
} from 'lucide-react';

interface TestDevice {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  version: string;
  status: 'online' | 'offline' | 'testing';
  lastTest: Date;
  testsCompleted: number;
  testsTotal: number;
  issues: number;
}

interface TestSuite {
  id: string;
  name: string;
  category: 'ui' | 'performance' | 'pwa' | 'features' | 'accessibility';
  tests: TestCase[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  platform?: string;
}

interface PerformanceMetric {
  device: string;
  metric: 'load_time' | 'render_time' | 'interaction_time' | 'memory_usage';
  value: number;
  target: number;
  status: 'good' | 'needs_improvement' | 'poor';
}

const CrossDeviceTestRunner: React.FC = () => {
  const [testDevices, setTestDevices] = useState<TestDevice[]>([
    {
      id: 'iphone-15',
      name: 'iPhone 15 Pro',
      type: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      version: '17.1',
      status: 'online',
      lastTest: new Date(),
      testsCompleted: 45,
      testsTotal: 50,
      issues: 2
    },
    {
      id: 'samsung-s24',
      name: 'Samsung Galaxy S24',
      type: 'mobile',
      browser: 'Chrome',
      os: 'Android',
      version: '14',
      status: 'online',
      lastTest: new Date(),
      testsCompleted: 48,
      testsTotal: 50,
      issues: 1
    },
    {
      id: 'ipad-pro',
      name: 'iPad Pro 12.9"',
      type: 'tablet',
      browser: 'Safari',
      os: 'iPadOS',
      version: '17.1',
      status: 'testing',
      lastTest: new Date(),
      testsCompleted: 30,
      testsTotal: 50,
      issues: 0
    },
    {
      id: 'macbook-pro',
      name: 'MacBook Pro M3',
      type: 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      version: '14.1',
      status: 'online',
      lastTest: new Date(),
      testsCompleted: 50,
      testsTotal: 50,
      issues: 0
    },
    {
      id: 'windows-laptop',
      name: 'Surface Laptop',
      type: 'desktop',
      browser: 'Edge',
      os: 'Windows',
      version: '11',
      status: 'online',
      lastTest: new Date(),
      testsCompleted: 47,
      testsTotal: 50,
      issues: 3
    }
  ]);

  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'ui-components',
      name: 'UI Component Tests',
      category: 'ui',
      status: 'completed',
      progress: 100,
      tests: [
        { id: 'chat-interface', name: 'Chat Interface', description: 'Main chat UI rendering', status: 'passed', duration: 2.3 },
        { id: 'message-bubbles', name: 'Message Bubbles', description: 'Message display components', status: 'passed', duration: 1.8 },
        { id: 'media-viewer', name: 'Media Viewer', description: 'Full-screen media viewing', status: 'passed', duration: 3.1 },
        { id: 'group-interface', name: 'Group Interface', description: 'Group chat components', status: 'passed', duration: 2.7 }
      ]
    },
    {
      id: 'performance',
      name: 'Performance Tests',
      category: 'performance',
      status: 'running',
      progress: 75,
      tests: [
        { id: 'load-time', name: 'Initial Load Time', description: 'App startup performance', status: 'passed', duration: 1.2 },
        { id: 'scroll-performance', name: 'Scroll Performance', description: 'Virtual scrolling with 1000+ messages', status: 'passed', duration: 4.5 },
        { id: 'memory-usage', name: 'Memory Usage', description: 'Memory consumption patterns', status: 'running', duration: 0 },
        { id: 'touch-response', name: 'Touch Responsiveness', description: '60fps touch interactions', status: 'pending', duration: 0 }
      ]
    },
    {
      id: 'pwa-features',
      name: 'PWA Functionality',
      category: 'pwa',
      status: 'pending',
      progress: 0,
      tests: [
        { id: 'offline-mode', name: 'Offline Mode', description: 'App functionality without internet', status: 'pending', duration: 0 },
        { id: 'push-notifications', name: 'Push Notifications', description: 'Background message notifications', status: 'pending', duration: 0 },
        { id: 'installation', name: 'App Installation', description: 'PWA install prompt and functionality', status: 'pending', duration: 0 },
        { id: 'background-sync', name: 'Background Sync', description: 'Message sync when app is backgrounded', status: 'pending', duration: 0 }
      ]
    },
    {
      id: 'chat-features',
      name: 'Chat Features',
      category: 'features',
      status: 'completed',
      progress: 100,
      tests: [
        { id: 'send-message', name: 'Send Message', description: 'Text message sending', status: 'passed', duration: 0.8 },
        { id: 'media-upload', name: 'Media Upload', description: 'Image and video sharing', status: 'passed', duration: 3.2 },
        { id: 'voice-recording', name: 'Voice Recording', description: 'Voice message recording', status: 'passed', duration: 2.1 },
        { id: 'group-management', name: 'Group Management', description: 'Create and manage groups', status: 'passed', duration: 1.9 },
        { id: 'contact-search', name: 'Contact Search', description: 'Find and add contacts', status: 'passed', duration: 1.4 }
      ]
    },
    {
      id: 'accessibility',
      name: 'Accessibility Tests',
      category: 'accessibility',
      status: 'failed',
      progress: 60,
      tests: [
        { id: 'screen-reader', name: 'Screen Reader', description: 'ARIA labels and navigation', status: 'passed', duration: 5.2 },
        { id: 'keyboard-nav', name: 'Keyboard Navigation', description: 'Tab navigation and shortcuts', status: 'failed', duration: 2.8, error: 'Missing focus indicators on media buttons' },
        { id: 'color-contrast', name: 'Color Contrast', description: 'WCAG AA compliance', status: 'passed', duration: 1.1 },
        { id: 'font-scaling', name: 'Font Scaling', description: 'Support for large text sizes', status: 'skipped', duration: 0 }
      ]
    }
  ]);

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    { device: 'iPhone 15 Pro', metric: 'load_time', value: 1.2, target: 2.0, status: 'good' },
    { device: 'iPhone 15 Pro', metric: 'render_time', value: 16.8, target: 16.0, status: 'needs_improvement' },
    { device: 'Samsung Galaxy S24', metric: 'load_time', value: 1.1, target: 2.0, status: 'good' },
    { device: 'Samsung Galaxy S24', metric: 'memory_usage', value: 45, target: 50, status: 'good' },
    { device: 'iPad Pro 12.9"', metric: 'interaction_time', value: 85, target: 100, status: 'good' },
    { device: 'MacBook Pro M3', metric: 'load_time', value: 0.8, target: 2.0, status: 'good' },
    { device: 'Surface Laptop', metric: 'render_time', value: 18.2, target: 16.0, status: 'needs_improvement' }
  ]);

  const [isRunningFullSuite, setIsRunningFullSuite] = useState(false);
  const [testResults, setTestResults] = useState({
    totalTests: 250,
    passed: 235,
    failed: 8,
    skipped: 7,
    coverage: 94.2
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'desktop': return <Monitor className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Activity className="w-4 h-4 text-gray-600" />;
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
      case 'online':
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'offline':
      case 'poor':
        return 'bg-red-100 text-red-800';
      case 'running':
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'needs_improvement':
        return 'bg-gray-100 text-gray-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ui': return <Monitor className="w-4 h-4" />;
      case 'performance': return <Gauge className="w-4 h-4" />;
      case 'pwa': return <Smartphone className="w-4 h-4" />;
      case 'features': return <Zap className="w-4 h-4" />;
      case 'accessibility': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const runTestSuite = async (suiteId: string) => {
    setTestSuites(prev => prev.map(suite =>
      suite.id === suiteId ? { ...suite, status: 'running', progress: 0 } : suite
    ));

    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    for (let i = 0; i < suite.tests.length; i++) {
      // Update test status to running
      setTestSuites(prev => prev.map(s =>
        s.id === suiteId
          ? {
              ...s,
              tests: s.tests.map((test, index) =>
                index === i ? { ...test, status: 'running' } : test
              ),
              progress: (i / s.tests.length) * 100
            }
          : s
      ));

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

      // Update test result
      const success = Math.random() > 0.15; // 85% pass rate
      setTestSuites(prev => prev.map(s =>
        s.id === suiteId
          ? {
              ...s,
              tests: s.tests.map((test, index) =>
                index === i
                  ? {
                      ...test,
                      status: success ? 'passed' : 'failed',
                      duration: Math.random() * 3 + 0.5,
                      error: !success ? 'Simulated test failure' : undefined
                    }
                  : test
              ),
              progress: ((i + 1) / s.tests.length) * 100
            }
          : s
      ));
    }

    // Mark suite as completed
    setTestSuites(prev => prev.map(suite =>
      suite.id === suiteId
        ? {
            ...suite,
            status: suite.tests.every(t => t.status === 'passed') ? 'completed' : 'failed',
            progress: 100
          }
        : suite
    ));
  };

  const runFullTestSuite = async () => {
    setIsRunningFullSuite(true);
    
    for (const suite of testSuites) {
      if (suite.status === 'pending') {
        await runTestSuite(suite.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsRunningFullSuite(false);
  };

  const retryFailedTests = () => {
    const failedSuites = testSuites.filter(suite => suite.status === 'failed');
    failedSuites.forEach(suite => {
      runTestSuite(suite.id);
    });
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update device statuses randomly
      setTestDevices(prev => prev.map(device => ({
        ...device,
        testsCompleted: Math.min(device.testsTotal, device.testsCompleted + (Math.random() > 0.8 ? 1 : 0)),
        lastTest: Math.random() > 0.9 ? new Date() : device.lastTest
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cross-Device Test Runner</h1>
        <div className="flex gap-2">
          <Button onClick={retryFailedTests} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry Failed
          </Button>
          <Button onClick={runFullTestSuite} disabled={isRunningFullSuite} className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {isRunningFullSuite ? 'Running...' : 'Run Full Suite'}
          </Button>
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{testResults.totalTests}</p>
            <p className="text-sm text-gray-600">Total Tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{testResults.passed}</p>
            <p className="text-sm text-gray-600">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{testResults.failed}</p>
            <p className="text-sm text-gray-600">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{testResults.skipped}</p>
            <p className="text-sm text-gray-600">Skipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{testResults.coverage}%</p>
            <p className="text-sm text-gray-600">Coverage</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices">Test Devices</TabsTrigger>
          <TabsTrigger value="suites">Test Suites</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="results">Detailed Results</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Connected Test Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testDevices.map((device) => (
                  <Card key={device.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(device.type)}
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-gray-600">{device.browser} on {device.os} {device.version}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Test Progress</span>
                        <span>{device.testsCompleted}/{device.testsTotal}</span>
                      </div>
                      <Progress value={(device.testsCompleted / device.testsTotal) * 100} className="mb-2" />
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{device.issues} issues found</span>
                        <span>Last: {device.lastTest.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suites" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {testSuites.map((suite) => (
              <Card key={suite.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(suite.category)}
                      {suite.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(suite.status)}>
                        {suite.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => runTestSuite(suite.id)}
                        disabled={suite.status === 'running'}
                      >
                        {suite.status === 'running' ? 'Running...' : 'Run'}
                      </Button>
                    </div>
                  </div>
                  <Progress value={suite.progress} className="mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <p className="font-medium text-sm">{test.name}</p>
                            <p className="text-xs text-gray-600">{test.description}</p>
                            {test.error && (
                              <p className="text-xs text-red-600">{test.error}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                            {test.status}
                          </Badge>
                          {test.duration > 0 && (
                            <p className="text-xs text-gray-600">{test.duration.toFixed(1)}s</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{metric.device}</p>
                      <p className="text-sm text-gray-600 capitalize">{metric.metric.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {metric.metric.includes('time') 
                            ? `${metric.value.toFixed(1)}s` 
                            : metric.metric === 'memory_usage'
                            ? `${metric.value}MB`
                            : `${metric.value}ms`
                          }
                        </span>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Target: {metric.metric.includes('time') 
                          ? `${metric.target.toFixed(1)}s` 
                          : metric.metric === 'memory_usage'
                          ? `${metric.target}MB`
                          : `${metric.target}ms`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testSuites.map((suite) => (
                  <div key={suite.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{suite.name}</h3>
                      <Badge className={getStatusColor(suite.status)}>
                        {suite.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {suite.tests.map((test) => (
                        <div key={test.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                          {test.duration > 0 && (
                            <span className="text-xs text-gray-600 ml-auto">
                              {test.duration.toFixed(1)}s
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrossDeviceTestRunner;