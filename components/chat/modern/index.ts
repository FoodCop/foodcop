// Modern Chat Components Exports
// Main interface component
export { ChatInterface } from './ChatInterface';

// Header components
export { ChatHeader } from './headers/ChatHeader';

// List components
export { StoriesBar } from './lists/StoriesBar';
export { ContactsList } from './lists/ContactsList';
export { ChatFloatingActions } from './lists/ChatFloatingActions';

// Conversation components
export { ChatConversationView } from './conversations/ChatConversationView';
export { ChatConversationHeader } from './headers/ChatConversationHeader';

// Message components
export { MessageBubble } from './messages/MessageBubble';
export { MessageInput } from './messages/MessageInput';
export { MessagesList } from './messages/MessagesList';

// Dialog components (Phase 3)
export { NewContactDialog } from './dialogs/NewContactDialog';
export { ContactProfile } from './dialogs/ContactProfile';
export { NewGroupDialog } from './dialogs/NewGroupDialog';
export { GroupManagement } from './dialogs/GroupManagement';

// Group Chat Interface (Phase 3)
export { GroupChatInterface } from './GroupChatInterface';
export { TypingIndicator } from './messages/TypingIndicator';

// Phase 4: Advanced Features - Media Components
export { MediaPicker, VoiceRecorder, MediaViewer } from './media';

// Phase 4: Advanced Features - Status and Presence Components
export { 
  OnlineStatusManager, 
  ReadReceiptSystem, 
  ReadReceiptIndicator, 
  ReadReceiptDetails,
  useActivityTracker,
  useReadReceipts 
} from './status';

// Types and utilities
export * from './utils/ChatTypes';
export * from './utils/ChatUtils';

// Phase 4: Media utilities (avoiding conflicts)
export {
  validateFile,
  compressImage,
  getImageDimensions,
  getVideoMetadata,
  getAudioDuration,
  formatFileSize,
  getFileTypeCategory,
  createThumbnail,
  getUserMedia,
  createAudioRecorder,
  createAudioAnalyser,
  getPresenceColor,
  getPresenceText,
  createActivityTracker,
  calculateReceiptStatus,
  formatReceiptTime,
  generateMediaId,
  createBlobUrl,
  checkBrowserCapabilities,
  throttle
} from './utils/MediaUtils';

// Phase 5: Mobile Optimization & PWA Features
export {
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
  useWakeLock,
  MobileProvider,
  useMobile,
  ResponsiveImage,
  HapticPattern
} from './mobile';

// Phase 5: PWA Features
export {
  useServiceWorker,
  useOfflineQueue,
  useCacheManager,
  PWAStatus,
  usePushNotifications,
  useNotificationSettings,
  useNotificationManager,
  NotificationSettingsPanel,
  NotificationType
} from './pwa';