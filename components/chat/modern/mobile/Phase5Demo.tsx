// Phase 5 Mobile & PWA Chat Demo
// Comprehensive example demonstrating all mobile optimization and PWA features

'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone,
  Wifi,
  Bell,
  Zap,
  Eye,
  Activity
} from 'lucide-react';

// Import Phase 5 components
import {
  TouchOptimizedMessageItem,
  TouchOptimizedInput,
  VirtualChatScroller,
  LazyImage,
  useMemoryOptimization,
  usePerformanceMonitor,
  useDeviceCapabilities,
  useHapticFeedback,
  useDeviceOrientation,
  useBackgroundState,
  MobileProvider,
  useMobile,
  HapticPattern,
  PWAStatus,
  NotificationSettingsPanel,
  useNotificationManager
} from './index';

// Mock data
const mockMessages = Array.from({ length: 1000 }, (_, i) => ({
  id: `msg-${i}`,
  sender_name: `User ${i % 10}`,
  content: `This is message ${i + 1}. It contains some sample content for testing.`,
  timestamp: new Date(Date.now() - i * 60000).toLocaleTimeString(),
  status: ['sent', 'delivered', 'read'][i % 3] as 'sent' | 'delivered' | 'read',
  unread_count: i % 5 === 0 ? Math.floor(Math.random() * 5) + 1 : 0,
  is_pinned: i % 20 === 0,
  is_muted: i % 15 === 0
}));

// Main Phase 5 Demo Component
const Phase5ChatDemo: React.FC = () => {
  const [message, setMessage] = useState('');
  const [demoMode, setDemoMode] = useState<'touch' | 'virtual' | 'pwa' | 'features'>('touch');
  
  // Mobile hooks
  const { capabilities, orientation, haptic } = useMobile();
  const backgroundState = useBackgroundState();
  const { metrics } = usePerformanceMonitor();
  const { cacheSize } = useMemoryOptimization();
  const { showNotification } = useNotificationManager();

  const handleSendMessage = useCallback(() => {
    if (message.trim()) {
      haptic.triggerHaptic(HapticPattern.SUCCESS);
      
      // Show notification for demo
      showNotification({
        type: 'message' as any,
        title: 'Message Sent',
        body: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        icon: '/icons/icon-192x192.png'
      });
      
      setMessage('');
    }
  }, [message, haptic, showNotification]);

  const handleMessageTap = useCallback((msg: any) => {
    haptic.triggerHaptic(HapticPattern.SELECTION);
    console.log('Message tapped:', msg.id);
  }, [haptic]);

  const handleLongPress = useCallback((msg: any) => {
    haptic.triggerHaptic(HapticPattern.MEDIUM);
    console.log('Long press:', msg.id);
  }, [haptic]);

  const renderMessage = useCallback((item: any, index: number, style: React.CSSProperties) => (
    <div style={style} key={item.id}>
      <TouchOptimizedMessageItem
        message={item}
        onTap={() => handleMessageTap(item)}
        onLongPress={() => handleLongPress(item)}
        className="mx-2 mb-2"
        enableHapticFeedback={capabilities.hasVibration}
      />
    </div>
  ), [handleMessageTap, handleLongPress, capabilities.hasVibration]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Phase 5 Mobile & PWA Demo</h1>
            <Badge variant="default" className="bg-green-500">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          
          {/* Device Info */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Platform: {capabilities.platform}</div>
            <div>Screen: {capabilities.screenSize}</div>
            <div>Touch: {capabilities.isTouchDevice ? 'Yes' : 'No'}</div>
            <div>Orientation: {orientation.isPortrait ? 'Portrait' : 'Landscape'}</div>
          </div>

          {/* Background State */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full ${backgroundState.isVisible ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{backgroundState.isVisible ? 'Visible' : 'Background'}</span>
            <span className="text-gray-500">
              Last active: {Math.floor((Date.now() - backgroundState.lastActiveTime) / 1000)}s ago
            </span>
          </div>
        </Card>

        {/* Demo Mode Selector */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {(['touch', 'virtual', 'pwa', 'features'] as const).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={demoMode === mode ? 'default' : 'outline'}
                onClick={() => setDemoMode(mode)}
                className="capitalize"
              >
                {mode === 'touch' && <Smartphone className="h-3 w-3 mr-1" />}
                {mode === 'virtual' && <Zap className="h-3 w-3 mr-1" />}
                {mode === 'pwa' && <Wifi className="h-3 w-3 mr-1" />}
                {mode === 'features' && <Eye className="h-3 w-3 mr-1" />}
                {mode}
              </Button>
            ))}
          </div>
        </Card>

        {/* Demo Content */}
        {demoMode === 'touch' && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Touch Optimizations</h3>
            <p className="text-sm text-gray-600 mb-4">
              Swipe messages left/right to see actions. Long press for context menu.
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mockMessages.slice(0, 5).map((msg) => (
                <TouchOptimizedMessageItem
                  key={msg.id}
                  message={msg}
                  onTap={() => handleMessageTap(msg)}
                  onLongPress={() => handleLongPress(msg)}
                  enableHapticFeedback={capabilities.hasVibration}
                />
              ))}
            </div>
          </Card>
        )}

        {demoMode === 'virtual' && (
          <Card className="overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Virtual Scrolling</h3>
              <p className="text-sm text-gray-600">
                {mockMessages.length} messages with virtual scrolling
              </p>
              <div className="mt-2 text-xs text-gray-500">
                Render time: {metrics.renderTime.toFixed(2)}ms | 
                Cache size: {cacheSize} items
              </div>
            </div>
            
            <VirtualChatScroller
              items={mockMessages}
              itemHeight={80}
              containerHeight={400}
              renderItem={renderMessage}
              hasMore={true}
              loading={false}
              onLoadMore={() => console.log('Load more...')}
            />
          </Card>
        )}

        {demoMode === 'pwa' && (
          <div className="space-y-4">
            <PWAStatus />
            <NotificationSettingsPanel />
          </div>
        )}

        {demoMode === 'features' && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Mobile Features</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Vibration: {capabilities.hasVibration ? '✅' : '❌'}</div>
                <div>Camera: {capabilities.hasCamera ? '✅' : '❌'}</div>
                <div>Geolocation: {capabilities.hasGeolocation ? '✅' : '❌'}</div>
                <div>Notifications: {capabilities.hasNotifications ? '✅' : '❌'}</div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.values(HapticPattern).map((pattern, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => haptic.triggerHaptic(pattern)}
                    disabled={!capabilities.hasVibration}
                    className="text-xs"
                  >
                    {String(pattern)}
                  </Button>
                ))}
              </div>

              <div className="text-xs text-gray-500">
                <div>Orientation: {orientation.angle}° {orientation.type}</div>
                <div>Standalone: {capabilities.isStandalone ? 'Yes' : 'No'}</div>
                <div>Memory: {metrics.memoryUsage.toFixed(1)} MB</div>
              </div>
            </div>
          </Card>
        )}

        {/* Message Input */}
        <TouchOptimizedInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
          placeholder="Try the optimized input..."
          enableVoiceInput={capabilities.hasMicrophone}
          enableHapticFeedback={capabilities.hasVibration}
        />
      </div>
    </div>
  );
};

// Wrapped component with mobile provider
export const Phase5Demo: React.FC = () => {
  return (
    <MobileProvider>
      <Phase5ChatDemo />
    </MobileProvider>
  );
};

export default Phase5Demo;