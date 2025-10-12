// Push Notification System
// Handle push notifications and background message sync

'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  createContext, 
  useContext 
} from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Bell,
  BellOff,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  Users,
  Heart,
  Camera,
  Settings
} from 'lucide-react';

// Simple Switch Component
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, className }) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-orange-500" : "bg-gray-200",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
};

// Notification types
export enum NotificationType {
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friend_request',
  GROUP_INVITE = 'group_invite',
  MENTION = 'mention',
  LIKE = 'like',
  COMMENT = 'comment',
  SYSTEM = 'system'
}

// Notification data interfaces
interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  timestamp: number;
  actions?: NotificationAction[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationSettings {
  enabled: boolean;
  messages: boolean;
  friendRequests: boolean;
  groupInvites: boolean;
  mentions: boolean;
  likes: boolean;
  comments: boolean;
  system: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  sound: boolean;
  vibration: boolean;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Push Notification Hook
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        checkExistingSubscription();
      }
    };

    checkSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for existing subscription
  const checkExistingSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setIsSubscribed(true);
        setSubscription({
          endpoint: existingSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
          }
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key (this should be from your backend)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa40HI80NNQEyoiLNXUjc-g8P-kUmVXZDk3P2wzkKF3qc0vdR5BPnv5F-F1DNo';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
      });

      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      setIsSubscribed(true);
      setSubscription(subscriptionData);

      // Send subscription to backend
      await sendSubscriptionToBackend(subscriptionData);
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }, [isSupported, permission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isSubscribed) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscriptionFromBackend();
        
        setIsSubscribed(false);
        setSubscription(null);
        return true;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
    
    return false;
  }, [isSupported, isSubscribed]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('FUZO Chat Test', {
        body: 'Push notifications are working correctly!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'test-notification',
        data: { type: 'test' }
        // Note: actions are not supported in all browsers
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    isSubscribed,
    subscription,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

// Notification Settings Hook
export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    messages: true,
    friendRequests: true,
    groupInvites: true,
    mentions: true,
    likes: true,
    comments: true,
    system: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    sound: true,
    vibration: true
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('notification-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check if notifications should be shown based on settings
  const shouldShowNotification = useCallback((type: NotificationType): boolean => {
    if (!settings.enabled) return false;
    
    // Check quiet hours
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= settings.quietHours.start || currentTime <= settings.quietHours.end) {
        return false;
      }
    }
    
    // Check type-specific settings
    switch (type) {
      case NotificationType.MESSAGE:
        return settings.messages;
      case NotificationType.FRIEND_REQUEST:
        return settings.friendRequests;
      case NotificationType.GROUP_INVITE:
        return settings.groupInvites;
      case NotificationType.MENTION:
        return settings.mentions;
      case NotificationType.LIKE:
        return settings.likes;
      case NotificationType.COMMENT:
        return settings.comments;
      case NotificationType.SYSTEM:
        return settings.system;
      default:
        return true;
    }
  }, [settings]);

  return {
    settings,
    updateSettings,
    shouldShowNotification
  };
};

// Notification Manager Hook
export const useNotificationManager = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const { isSupported, isSubscribed, sendTestNotification } = usePushNotifications();
  const { shouldShowNotification } = useNotificationSettings();

  // Show local notification
  const showNotification = useCallback(async (data: Omit<NotificationData, 'id' | 'timestamp'>) => {
    if (!isSupported || !shouldShowNotification(data.type)) return;

    const notificationData: NotificationData = {
      ...data,
      id: `notification-${Date.now()}`,
      timestamp: Date.now()
    };

    setNotifications(prev => [notificationData, ...prev.slice(0, 49)]); // Keep last 50

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/badge-72x72.png',
        tag: data.tag || data.type,
        data: data.data,
        // actions: data.actions, // Not supported in all browsers
        requireInteraction: data.type === NotificationType.MESSAGE,
        silent: false
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, shouldShowNotification]);

  // Clear notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    clearNotification,
    clearAllNotifications,
    sendTestNotification,
    isSubscribed
  };
};

// Notification Settings Panel Component
interface NotificationSettingsPanelProps {
  className?: string;
}

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  className
}) => {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    requestPermission, 
    subscribe, 
    unsubscribe,
    sendTestNotification 
  } = usePushNotifications();
  
  const { settings, updateSettings } = useNotificationSettings();

  const handleEnableNotifications = async () => {
    if (permission === 'default') {
      const granted = await requestPermission();
      if (granted) {
        await subscribe();
      }
    } else if (permission === 'granted' && !isSubscribed) {
      await subscribe();
    }
  };

  const handleDisableNotifications = async () => {
    await unsubscribe();
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <div className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <BellOff className="h-5 w-5" />
            <span>Push notifications are not supported on this device</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex items-center gap-2">
            {permission === 'granted' ? (
              <Badge variant="default">
                <Check className="h-3 w-3 mr-1" />
                Allowed
              </Badge>
            ) : permission === 'denied' ? (
              <Badge variant="destructive">
                <X className="h-3 w-3 mr-1" />
                Blocked
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Set
              </Badge>
            )}
          </div>
        </div>

        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Enable Push Notifications</span>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
          />
        </div>

        {isSubscribed && (
          <>
            {/* Test Notification */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm">Test notifications</span>
              <Button size="sm" onClick={sendTestNotification}>
                Send Test
              </Button>
            </div>

            {/* Notification Types */}
            <div className="space-y-3">
              <h4 className="font-medium">Notification Types</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Messages</span>
                  </div>
                  <Switch
                    checked={settings.messages}
                    onCheckedChange={(checked) => updateSettings({ messages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Friend Requests</span>
                  </div>
                  <Switch
                    checked={settings.friendRequests}
                    onCheckedChange={(checked) => updateSettings({ friendRequests: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Group Invites</span>
                  </div>
                  <Switch
                    checked={settings.groupInvites}
                    onCheckedChange={(checked) => updateSettings({ groupInvites: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">Likes & Comments</span>
                  </div>
                  <Switch
                    checked={settings.likes}
                    onCheckedChange={(checked) => updateSettings({ likes: checked, comments: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">System Updates</span>
                  </div>
                  <Switch
                    checked={settings.system}
                    onCheckedChange={(checked) => updateSettings({ system: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Sound and Vibration */}
            <div className="space-y-3">
              <h4 className="font-medium">Preferences</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Sound</span>
                <Switch
                  checked={settings.sound}
                  onCheckedChange={(checked) => updateSettings({ sound: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Vibration</span>
                <Switch
                  checked={settings.vibration}
                  onCheckedChange={(checked) => updateSettings({ vibration: checked })}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Mock backend functions (replace with actual API calls)
async function sendSubscriptionToBackend(subscription: PushSubscription) {
  console.log('Sending subscription to backend:', subscription);
  // TODO: Implement actual API call
}

async function removeSubscriptionFromBackend() {
  console.log('Removing subscription from backend');
  // TODO: Implement actual API call
}

// Export all notification components
export const NotificationSystem = {
  usePushNotifications,
  useNotificationSettings,
  useNotificationManager,
  NotificationSettingsPanel,
  NotificationType
};