'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Wifi, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Bell,
  Globe,
  Zap
} from 'lucide-react';

interface ApiEndpoint {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'healthy' | 'warning' | 'error' | 'testing';
  lastTested: Date;
  responseTime: number;
  description: string;
}

interface RealtimeConnection {
  channel: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastActivity: Date;
  messageCount: number;
  description: string;
}

interface DatabaseTable {
  name: string;
  status: 'healthy' | 'error';
  recordCount: number;
  lastSync: Date;
  operations: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

const ApiIntegrationManager: React.FC = () => {
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([
    {
      name: 'Messages',
      path: '/api/messages',
      method: 'GET',
      status: 'healthy',
      lastTested: new Date(),
      responseTime: 120,
      description: 'Fetch conversation messages'
    },
    {
      name: 'Send Message',
      path: '/api/messages',
      method: 'POST',
      status: 'healthy',
      lastTested: new Date(),
      responseTime: 95,
      description: 'Send new message'
    },
    {
      name: 'Conversations',
      path: '/api/conversations',
      method: 'GET',
      status: 'healthy',
      lastTested: new Date(),
      responseTime: 150,
      description: 'User conversations list'
    },
    {
      name: 'User Presence',
      path: '/api/users/presence',
      method: 'PUT',
      status: 'warning',
      lastTested: new Date(Date.now() - 120000),
      responseTime: 250,
      description: 'Update user online status'
    },
    {
      name: 'Media Upload',
      path: '/api/media/upload',
      method: 'POST',
      status: 'healthy',
      lastTested: new Date(),
      responseTime: 320,
      description: 'Upload media files'
    },
    {
      name: 'Contact Search',
      path: '/api/contacts/search',
      method: 'POST',
      status: 'healthy',
      lastTested: new Date(),
      responseTime: 180,
      description: 'Search for contacts'
    },
    {
      name: 'Group Management',
      path: '/api/groups',
      method: 'POST',
      status: 'testing',
      lastTested: new Date(),
      responseTime: 0,
      description: 'Create and manage groups'
    }
  ]);

  const [realtimeConnections, setRealtimeConnections] = useState<RealtimeConnection[]>([
    {
      channel: 'conversations',
      status: 'connected',
      lastActivity: new Date(),
      messageCount: 245,
      description: 'Real-time message delivery'
    },
    {
      channel: 'presence',
      status: 'connected',
      lastActivity: new Date(Date.now() - 30000),
      messageCount: 45,
      description: 'User online status updates'
    },
    {
      channel: 'typing',
      status: 'connected',
      lastActivity: new Date(Date.now() - 5000),
      messageCount: 12,
      description: 'Typing indicators'
    },
    {
      channel: 'notifications',
      status: 'connecting',
      lastActivity: new Date(Date.now() - 60000),
      messageCount: 0,
      description: 'Push notification delivery'
    }
  ]);

  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([
    {
      name: 'users',
      status: 'healthy',
      recordCount: 1247,
      lastSync: new Date(),
      operations: { create: true, read: true, update: true, delete: true }
    },
    {
      name: 'conversations',
      status: 'healthy',
      recordCount: 523,
      lastSync: new Date(),
      operations: { create: true, read: true, update: true, delete: false }
    },
    {
      name: 'messages',
      status: 'healthy',
      recordCount: 15623,
      lastSync: new Date(Date.now() - 2000),
      operations: { create: true, read: true, update: false, delete: false }
    },
    {
      name: 'friends',
      status: 'healthy',
      recordCount: 3456,
      lastSync: new Date(),
      operations: { create: true, read: true, update: true, delete: true }
    },
    {
      name: 'media_files',
      status: 'healthy',
      recordCount: 892,
      lastSync: new Date(),
      operations: { create: true, read: true, update: false, delete: true }
    },
    {
      name: 'user_presence',
      status: 'healthy',
      recordCount: 1247,
      lastSync: new Date(Date.now() - 1000),
      operations: { create: true, read: true, update: true, delete: false }
    }
  ]);

  const [isRunningTests, setIsRunningTests] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    totalApiCalls: 15624,
    averageResponseTime: 165,
    errorRate: 0.2,
    uptime: 99.8
  });

  const testApiEndpoint = async (endpoint: ApiEndpoint) => {
    setApiEndpoints(prev => prev.map(ep => 
      ep.name === endpoint.name 
        ? { ...ep, status: 'testing', lastTested: new Date() }
        : ep
    ));

    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    const success = Math.random() > 0.1; // 90% success rate
    const responseTime = Math.random() * 200 + 50;

    setApiEndpoints(prev => prev.map(ep => 
      ep.name === endpoint.name 
        ? { 
            ...ep, 
            status: success ? 'healthy' : 'error', 
            responseTime: Math.round(responseTime),
            lastTested: new Date()
          }
        : ep
    ));
  };

  const testAllEndpoints = async () => {
    setIsRunningTests(true);
    
    for (const endpoint of apiEndpoints) {
      await testApiEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsRunningTests(false);
  };

  const reconnectRealtimeChannel = (channel: string) => {
    setRealtimeConnections(prev => prev.map(conn => 
      conn.channel === channel 
        ? { ...conn, status: 'connecting', lastActivity: new Date() }
        : conn
    ));

    // Simulate reconnection
    setTimeout(() => {
      setRealtimeConnections(prev => prev.map(conn => 
        conn.channel === channel 
          ? { ...conn, status: 'connected', lastActivity: new Date() }
          : conn
      ));
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'connecting':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      case 'testing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
      case 'connecting':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
      case 'disconnected':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics
      setSystemMetrics(prev => ({
        ...prev,
        totalApiCalls: prev.totalApiCalls + Math.floor(Math.random() * 10 + 1),
        averageResponseTime: Math.round(prev.averageResponseTime + (Math.random() - 0.5) * 10),
        errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.1),
        uptime: Math.min(100, prev.uptime + (Math.random() - 0.5) * 0.01)
      }));

      // Update realtime connections
      setRealtimeConnections(prev => prev.map(conn => ({
        ...conn,
        messageCount: conn.status === 'connected' ? conn.messageCount + Math.floor(Math.random() * 3) : conn.messageCount,
        lastActivity: conn.status === 'connected' && Math.random() > 0.7 ? new Date() : conn.lastActivity
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Integration Manager</h1>
        <Button onClick={testAllEndpoints} disabled={isRunningTests} className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          {isRunningTests ? 'Testing...' : 'Test All APIs'}
        </Button>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{systemMetrics.totalApiCalls.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total API Calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{systemMetrics.averageResponseTime}ms</p>
            <p className="text-sm text-gray-600">Avg Response Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{systemMetrics.errorRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Error Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{systemMetrics.uptime.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Uptime</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">API Endpoints</TabsTrigger>
          <TabsTrigger value="realtime">Realtime Channels</TabsTrigger>
          <TabsTrigger value="database">Database Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                API Endpoints Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiEndpoints.map((endpoint) => (
                  <div key={endpoint.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{endpoint.name}</p>
                          <Badge className={`text-xs ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{endpoint.path}</p>
                        <p className="text-xs text-gray-500">{endpoint.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`mb-1 ${getStatusColor(endpoint.status)}`}>
                        {endpoint.status}
                      </Badge>
                      <p className="text-sm text-gray-600">{endpoint.responseTime}ms</p>
                      <p className="text-xs text-gray-500">
                        {endpoint.lastTested.toLocaleTimeString()}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => testApiEndpoint(endpoint)}
                        disabled={endpoint.status === 'testing'}
                        className="mt-1"
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Realtime Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realtimeConnections.map((connection) => (
                  <div key={connection.channel} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <p className="font-medium capitalize">{connection.channel}</p>
                        <p className="text-sm text-gray-600">{connection.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`mb-1 ${getStatusColor(connection.status)}`}>
                        {connection.status}
                      </Badge>
                      <p className="text-sm text-gray-600">{connection.messageCount} messages</p>
                      <p className="text-xs text-gray-500">
                        Last: {connection.lastActivity.toLocaleTimeString()}
                      </p>
                      {connection.status !== 'connected' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => reconnectRealtimeChannel(connection.channel)}
                          className="mt-1"
                        >
                          Reconnect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {databaseTables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(table.status)}
                      <div>
                        <p className="font-medium">{table.name}</p>
                        <p className="text-sm text-gray-600">{table.recordCount.toLocaleString()} records</p>
                        <div className="flex gap-1 mt-1">
                          {Object.entries(table.operations).map(([op, enabled]) => (
                            <Badge 
                              key={op} 
                              variant={enabled ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {op.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`mb-1 ${getStatusColor(table.status)}`}>
                        {table.status}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        Synced: {table.lastSync.toLocaleTimeString()}
                      </p>
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

export default ApiIntegrationManager;