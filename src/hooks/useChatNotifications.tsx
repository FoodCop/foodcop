import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useDMChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { DMMessage, DMConversation } from '../services/dmChatService';
import { MessageCircle } from 'lucide-react';

/**
 * Hook to handle chat notifications via toast
 * Shows toast notifications for new messages when chat is closed or different conversation is active
 */
export function useChatNotifications() {
  const { user } = useAuthStore();
  const { subscribeToUnreadCount, setNotificationCallback } = useDMChatStore();
  const notificationRefs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to all messages for this user
    const unsubscribe = subscribeToUnreadCount(user.id);

    return unsubscribe;
  }, [user?.id, subscribeToUnreadCount]);

  // Set up notification callback
  useEffect(() => {
    if (!user?.id) {
      setNotificationCallback(() => {});
      return;
    }

    const currentUserId = user.id;

    const handleNewMessage = (message: DMMessage, conversation: DMConversation | undefined) => {
      // Don't notify for messages from current user
      if (message.sender_id === currentUserId) {
        return;
      }

      // Don't notify for messages we've already notified about
      if (notificationRefs.current.has(message.id)) {
        return;
      }

      notificationRefs.current.add(message.id);

      const senderName = conversation?.other_user?.display_name || 'Someone';

      // Get message preview
      const preview = message.shared_item
        ? `Shared a ${message.shared_item.type}`
        : message.content || 'Sent a message';

      // Show toast notification
      toast(
        <div className="flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">{senderName}</p>
            <p className="text-xs text-gray-600 truncate">{preview}</p>
          </div>
        </div>,
        {
          duration: 5000,
          action: {
            label: 'Open',
            onClick: () => {
              // Open chat and navigate to conversation
              const { openChat, setActiveConversation } = useDMChatStore.getState();
              openChat();
              setActiveConversation(message.conversation_id);
            },
          },
        }
      );

      // Clean up old notification refs (keep last 100)
      if (notificationRefs.current.size > 100) {
        const entries = Array.from(notificationRefs.current);
        entries.slice(0, entries.length - 100).forEach((id) => {
          notificationRefs.current.delete(id);
        });
      }
    };

    setNotificationCallback(handleNewMessage);

    return () => {
      setNotificationCallback(() => {});
    };
  }, [user?.id, setNotificationCallback]);

  // Clean up notification refs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (notificationRefs.current.size > 100) {
        const entries = Array.from(notificationRefs.current);
        entries.slice(0, entries.length - 50).forEach((id) => {
          notificationRefs.current.delete(id);
        });
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);
}

