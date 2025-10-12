'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ModernChatInterface } from '../ModernChatInterface';
import { GroupChatInterface } from '../GroupChatInterface';
import Phase6IntegrationDashboard from '../Phase6IntegrationDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Activity, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Database,
  Wifi,
  ImageIcon,
  Globe,
  Bell
} from 'lucide-react';

interface ChatSystemState {
  currentView: 'chat' | 'group' | 'dashboard' | 'monitor';
  activeConversation: string | null;
  systemHealth: 'healthy' | 'warning' | 'error';
  performanceMetrics: {
    messageLoadTime: number;
    renderTime: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  integrationStatus: {
    database: boolean;
    realtime: boolean;
    media: boolean;
    pwa: boolean;
    notifications: boolean;
  };
}

interface SystemEvent {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
  component?: string;
}

// Mock data for group interface
const mockGroupData = {
  groupId: 'group-1',
  groupName: 'FUZO Team Chat',
  members: [
    {
      id: '1',
      display_name: 'John Doe',
      username: 'johndoe',
      avatar_url: '',
      email: 'john@fuzo.com',
      is_online: true,
      last_seen: new Date().toISOString(),
      privacy_settings: {
        show_online_status: true,
        show_last_seen: true,
        show_read_receipts: true,
      },
      role: 'admin' as const,
      joined_at: new Date().toISOString(),
    },
    {
      id: '2',
      display_name: 'Jane Smith',
      username: 'janesmith',
      avatar_url: '',
      email: 'jane@fuzo.com',
      is_online: false,
      last_seen: new Date(Date.now() - 300000).toISOString(),
      privacy_settings: {
        show_online_status: true,
        show_last_seen: true,
        show_read_receipts: true,
      },
      role: 'member' as const,
      joined_at: new Date().toISOString(),
    }
  ],
  messages: [],
  currentUserId: '1'
};

const ChatSystemOrchestrator: React.FC = () => {
  const [systemState, setSystemState] = useState<ChatSystemState>({
    currentView: 'chat',
    activeConversation: null,
    systemHealth: 'healthy',
    performanceMetrics: {
      messageLoadTime: 150,
      renderTime: 12,
      memoryUsage: 45,
      cacheHitRate: 85
    },
    integrationStatus: {
      database: true,
      realtime: true,
      media: true,
      pwa: true,
      notifications: true
    }
  });

  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [isIntegrationMode, setIsIntegrationMode] = useState(false);

  const addSystemEvent = useCallback((type: SystemEvent['type'], message: string, component?: string) => {
    const event: SystemEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date(),
      component
    };

    setSystemEvents(prev => [event, ...prev.slice(0, 99)]);
  }, []);

  const updatePerformanceMetrics = useCallback(() => {
    setSystemState(prev => ({
      ...prev,
      performanceMetrics: {
        messageLoadTime: Math.random() * 100 + 50,
        renderTime: Math.random() * 20 + 10,
        memoryUsage: Math.random() * 30 + 40,
        cacheHitRate: Math.random() * 20 + 80
      }
    }));
  }, []);

  const updateSystemHealth = useCallback(() => {
    setSystemState(prev => {
      const { integrationStatus, performanceMetrics } = prev;
      const allServicesUp = Object.values(integrationStatus).every(status => status);
      const performanceGood = performanceMetrics.messageLoadTime < 200 && 
                             performanceMetrics.memoryUsage < 80;

      let newHealth: 'healthy' | 'warning' | 'error';
      if (allServicesUp && performanceGood) {
        newHealth = 'healthy';
      } else if (allServicesUp) {
        newHealth = 'warning';
      } else {
        newHealth = 'error';
      }

      return { ...prev, systemHealth: newHealth };
    });
  }, []);

  const initializeServices = useCallback(async () => {
    addSystemEvent('info', 'Initializing FUZO Chat System...', 'SystemOrchestrator');
    
    // Simulate service initialization
    const services = ['database', 'realtime', 'media', 'pwa', 'notifications'];
    
    for (const service of services) {
      await new Promise(resolve => setTimeout(resolve, 300));
      addSystemEvent('success', `${service} service initialized`, service);
    }
    
    addSystemEvent('success', 'All systems initialized successfully', 'SystemOrchestrator');
    updateSystemHealth();
  }, [addSystemEvent, updateSystemHealth]);

  useEffect(() => {
    initializeServices();
    
    // Start performance monitoring
    const performanceInterval = setInterval(updatePerformanceMetrics, 3000);
    
    return () => {
      clearInterval(performanceInterval);
      addSystemEvent('info', 'System cleanup completed', 'SystemOrchestrator');
    };
  }, [initializeServices, updatePerformanceMetrics, addSystemEvent]);

  const handleViewChange = (view: ChatSystemState['currentView']) => {
    setSystemState(prev => ({ ...prev, currentView: view }));
    addSystemEvent('info', `Switched to ${view} view`, 'Navigation');
  };

  const getSystemHealthColor = () => {
    switch (systemState.systemHealth) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSystemHealthIcon = () => {
    switch (systemState.systemHealth) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database': return <Database className="w-4 h-4" />;
      case 'realtime': return <Wifi className="w-4 h-4" />;
      case 'media': return <ImageIcon className="w-4 h-4" />;
      case 'pwa': return <Globe className="w-4 h-4" />;
      case 'notifications': return <Bell className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const renderSystemDashboard = () => (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FUZO Chat System</h1>
        <div className="flex items-center gap-2">
          {getSystemHealthIcon()}
          <span className={`font-medium ${getSystemHealthColor()}`}>
            {systemState.systemHealth.toUpperCase()}
          </span>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(systemState.integrationStatus).map(([service, status]) => (
          <Card key={service}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {getServiceIcon(service)}
              </div>
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${status ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm font-medium capitalize">{service}</p>
              <Badge variant={status ? 'default' : 'destructive'} className="mt-1 text-xs">
                {status ? 'Online' : 'Offline'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Message Load Time</p>
              <p className="text-2xl font-bold">{systemState.performanceMetrics.messageLoadTime.toFixed(0)}ms</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (300 - systemState.performanceMetrics.messageLoadTime) / 3)}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Render Time</p>
              <p className="text-2xl font-bold">{systemState.performanceMetrics.renderTime.toFixed(0)}ms</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (50 - systemState.performanceMetrics.renderTime) * 2)}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold">{systemState.performanceMetrics.memoryUsage.toFixed(0)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${systemState.performanceMetrics.memoryUsage > 70 ? 'bg-red-600' : 'bg-yellow-600'}`}
                  style={{ width: `${systemState.performanceMetrics.memoryUsage}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold">{systemState.performanceMetrics.cacheHitRate.toFixed(0)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${systemState.performanceMetrics.cacheHitRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>System Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {systemEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-2 rounded bg-gray-50">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  event.type === 'success' ? 'bg-green-500' :
                  event.type === 'warning' ? 'bg-yellow-500' :
                  event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{event.message}</p>
                  <p className="text-xs text-gray-500">
                    {event.component && `${event.component} • `}
                    {event.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMainInterface = () => {
    switch (systemState.currentView) {
      case 'dashboard':
        return renderSystemDashboard();
      case 'monitor':
        return <Phase6IntegrationDashboard />;
      case 'group':
        return <GroupChatInterface {...mockGroupData} />;
      case 'chat':
      default:
        return <ModernChatInterface />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Integration Mode Toggle */}
      {isIntegrationMode && (
        <div className="bg-blue-600 text-white p-2 text-center text-sm">
          Integration Testing Mode - All system integrations active
        </div>
      )}

      {/* Main Navigation */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={systemState.currentView === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={systemState.currentView === 'group' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('group')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Groups
            </Button>
            <Button
              variant={systemState.currentView === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('dashboard')}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Dashboard
            </Button>
            <Button
              variant={systemState.currentView === 'monitor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('monitor')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Monitor
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIntegrationMode(!isIntegrationMode)}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {isIntegrationMode ? 'Exit' : 'Enter'} Integration Mode
            </Button>
            
            <div className="flex items-center gap-2">
              {getSystemHealthIcon()}
              <span className={`text-sm font-medium ${getSystemHealthColor()}`}>
                System {systemState.systemHealth}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderMainInterface()}
      </div>
    </div>
  );
};

export default ChatSystemOrchestrator;