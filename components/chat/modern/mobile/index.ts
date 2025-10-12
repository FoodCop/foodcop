// Mobile and PWA Components Index
// Phase 5: Mobile Optimization & PWA Features

// Mobile Touch Optimizations (Phase 5.1)
export { 
  TouchOptimizedMessageItem,
  TouchOptimizedInput,
  TouchOptimizations 
} from './TouchOptimizations';

// Performance Optimizations (Phase 5.1)
export { 
  VirtualChatScroller,
  LazyImage,
  useMemoryOptimization,
  usePerformanceMonitor,
  PerformanceOptimizations 
} from './PerformanceOptimizations';

// Mobile-Specific Features (Phase 5.2)
export { 
  useDeviceCapabilities,
  useHapticFeedback,
  useDeviceOrientation,
  useBackgroundState,
  useWakeLock,
  MobileProvider,
  useMobile,
  ResponsiveImage,
  HapticPattern,
  MobileFeatures 
} from './MobileFeatures';

// PWA Infrastructure (Phase 5.2)
export { 
  useServiceWorker,
  useOfflineQueue,
  useCacheManager,
  PWAStatus,
  PWAManager 
} from '../pwa/PWAManager';

// Push Notification System (Phase 5.2)
export { 
  usePushNotifications,
  useNotificationSettings,
  useNotificationManager,
  NotificationSettingsPanel,
  NotificationType,
  NotificationSystem 
} from '../pwa/NotificationSystem';