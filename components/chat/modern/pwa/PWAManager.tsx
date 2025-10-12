// PWA Service Worker Manager
// Handles offline capabilities, caching, and background sync

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi,
  WifiOff,
  Download,
  Check,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// Service Worker Types
interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isWaitingUpdate: boolean;
  isOnline: boolean;
  isInstallable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface CacheStatus {
  messages: number;
  media: number;
  totalSize: string;
  lastUpdated: string;
}

interface OfflineQueue {
  messages: QueuedMessage[];
  media: QueuedMedia[];
  totalItems: number;
}

interface QueuedMessage {
  id: string;
  content: string;
  conversationId: string;
  timestamp: string;
  type: 'text' | 'voice' | 'media';
  retryCount: number;
}

interface QueuedMedia {
  id: string;
  file: File;
  messageId: string;
  uploadProgress: number;
  retryCount: number;
}

// Service Worker Manager Hook
export const useServiceWorker = () => {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isWaitingUpdate: false,
    isOnline: navigator.onLine,
    isInstallable: false,
    registration: null
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      setSwState(prev => ({ 
        ...prev, 
        isRegistered: true,
        registration 
      }));

      // Check for waiting service worker
      if (registration.waiting) {
        setUpdateAvailable(true);
        setSwState(prev => ({ ...prev, isWaitingUpdate: true }));
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              setSwState(prev => ({ ...prev, isWaitingUpdate: true }));
            }
          });
        }
      });

    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }, []);

  // Check service worker support
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setSwState(prev => ({ ...prev, isSupported: true }));
      registerServiceWorker();
    }
  }, [registerServiceWorker]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setSwState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSwState(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setSwState(prev => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Update service worker
  const updateServiceWorker = useCallback(() => {
    if (swState.registration?.waiting) {
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [swState.registration]);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      setInstallPrompt(null);
      setSwState(prev => ({ ...prev, isInstallable: false }));
      
      return result.outcome === 'accepted';
    }
    return false;
  }, [installPrompt]);

  return {
    swState,
    updateAvailable,
    updateServiceWorker,
    installPWA
  };
};

// Offline Queue Manager Hook
export const useOfflineQueue = () => {
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueue>({
    messages: [],
    media: [],
    totalItems: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Add message to offline queue
  const queueMessage = useCallback((message: Omit<QueuedMessage, 'retryCount'>) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      retryCount: 0
    };

    setOfflineQueue(prev => ({
      ...prev,
      messages: [...prev.messages, queuedMessage],
      totalItems: prev.totalItems + 1
    }));
  }, []);

  // Add media to offline queue
  const queueMedia = useCallback((media: Omit<QueuedMedia, 'retryCount' | 'uploadProgress'>) => {
    const queuedMedia: QueuedMedia = {
      ...media,
      retryCount: 0,
      uploadProgress: 0
    };

    setOfflineQueue(prev => ({
      ...prev,
      media: [...prev.media, queuedMedia],
      totalItems: prev.totalItems + 1
    }));
  }, []);

  // Process offline queue when back online
  const processQueue = useCallback(async () => {
    if (!navigator.onLine || isProcessing) return;
    
    setIsProcessing(true);

    try {
      // Process messages
      for (const message of offlineQueue.messages) {
        try {
          await sendMessage(message);
          setOfflineQueue(prev => ({
            ...prev,
            messages: prev.messages.filter(m => m.id !== message.id),
            totalItems: prev.totalItems - 1
          }));
        } catch (error) {
          // Increment retry count
          setOfflineQueue(prev => ({
            ...prev,
            messages: prev.messages.map(m => 
              m.id === message.id 
                ? { ...m, retryCount: m.retryCount + 1 }
                : m
            )
          }));
        }
      }

      // Process media
      for (const media of offlineQueue.media) {
        try {
          await uploadMedia(media);
          setOfflineQueue(prev => ({
            ...prev,
            media: prev.media.filter(m => m.id !== media.id),
            totalItems: prev.totalItems - 1
          }));
        } catch (error) {
          // Increment retry count
          setOfflineQueue(prev => ({
            ...prev,
            media: prev.media.map(m => 
              m.id === media.id 
                ? { ...m, retryCount: m.retryCount + 1 }
                : m
            )
          }));
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [offlineQueue, isProcessing]);

  // Auto-process queue when coming back online
  useEffect(() => {
    if (navigator.onLine && offlineQueue.totalItems > 0) {
      processQueue();
    }
  }, [processQueue, offlineQueue.totalItems]);

  // Mock API functions (replace with actual implementations)
  const sendMessage = async (message: QueuedMessage) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Sent message:', message);
  };

  const uploadMedia = async (media: QueuedMedia) => {
    // Simulate upload with progress
    for (let progress = 0; progress <= 100; progress += 10) {
      setOfflineQueue(prev => ({
        ...prev,
        media: prev.media.map(m => 
          m.id === media.id 
            ? { ...m, uploadProgress: progress }
            : m
        )
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Uploaded media:', media);
  };

  return {
    offlineQueue,
    queueMessage,
    queueMedia,
    processQueue,
    isProcessing
  };
};

// Cache Manager Hook
export const useCacheManager = () => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    messages: 0,
    media: 0,
    totalSize: '0 MB',
    lastUpdated: new Date().toISOString()
  });

  // Get cache status
  const updateCacheStatus = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        let messageCount = 0;
        let mediaCount = 0;

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
              
              if (request.url.includes('/api/messages')) {
                messageCount++;
              } else if (request.url.includes('/api/media')) {
                mediaCount++;
              }
            }
          }
        }

        setCacheStatus({
          messages: messageCount,
          media: mediaCount,
          totalSize: `${(totalSize / (1024 * 1024)).toFixed(1)} MB`,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to update cache status:', error);
      }
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        await updateCacheStatus();
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  }, [updateCacheStatus]);

  useEffect(() => {
    updateCacheStatus();
  }, [updateCacheStatus]);

  return {
    cacheStatus,
    updateCacheStatus,
    clearCache
  };
};

// PWA Status Component
interface PWAStatusProps {
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ className }) => {
  const { swState, updateAvailable, updateServiceWorker, installPWA } = useServiceWorker();
  const { offlineQueue, isProcessing } = useOfflineQueue();
  const { cacheStatus, clearCache } = useCacheManager();

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">PWA Status</h3>
          <div className="flex items-center gap-2">
            {swState.isOnline ? (
              <Badge variant="default" className="bg-green-500">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="space-y-2">
          <h4 className="font-medium">Service Worker</h4>
          <div className="flex items-center gap-2">
            {swState.isSupported ? (
              <Badge variant="default">
                <Check className="h-3 w-3 mr-1" />
                Supported
              </Badge>
            ) : (
              <Badge variant="destructive">
                <X className="h-3 w-3 mr-1" />
                Not Supported
              </Badge>
            )}
            {swState.isRegistered && (
              <Badge variant="secondary">Registered</Badge>
            )}
          </div>
        </div>

        {/* Update Available */}
        {updateAvailable && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Update Available</span>
            </div>
            <Button size="sm" onClick={updateServiceWorker}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Update
            </Button>
          </div>
        )}

        {/* Install PWA */}
        {swState.isInstallable && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Install App</span>
            </div>
            <Button size="sm" onClick={installPWA}>
              Install
            </Button>
          </div>
        )}

        {/* Offline Queue */}
        {offlineQueue.totalItems > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Offline Queue</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {offlineQueue.totalItems} items pending
              </span>
              {isProcessing && (
                <Badge variant="secondary">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Cache Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Cache</h4>
            <Button size="sm" variant="outline" onClick={clearCache}>
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>Messages: {cacheStatus.messages}</div>
            <div>Media: {cacheStatus.media}</div>
            <div>Size: {cacheStatus.totalSize}</div>
            <div>Updated: {new Date(cacheStatus.lastUpdated).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Export all PWA components
export const PWAManager = {
  useServiceWorker,
  useOfflineQueue,
  useCacheManager,
  PWAStatus
};