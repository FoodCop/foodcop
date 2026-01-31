import { useEffect } from 'react';
import { Message, Loop } from '@mui/icons-material';
import { useDMChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { DMConversation } from '../../services/dmChatService';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn } from '../ui/utils';

interface RecentChatsProps {
  limit?: number;
  onSelectConversation?: (conversation: DMConversation) => void;
}

export function RecentChats({ limit = 5, onSelectConversation }: RecentChatsProps) {
  const { user } = useAuthStore();
  const { conversations, loadConversations, isLoadingConversations, openChat, setActiveConversation } =
    useDMChatStore();

  useEffect(() => {
    if (user?.id) {
      loadConversations(user.id);
    }
  }, [user?.id, loadConversations]);

  const handleConversationClick = (conversation: DMConversation) => {
    setActiveConversation(conversation.id);
    openChat();
    if (onSelectConversation) {
      onSelectConversation(conversation);
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-32">
          <Loop className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const recentConversations = conversations.slice(0, limit);

  if (recentConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 px-4">
        <Message className="h-8 w-8 mb-2 stroke-1" />
        <p className="text-sm text-center">No recent chats</p>
        <p className="text-xs text-center text-gray-400">
          Start a conversation by sharing something!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentConversations.map((conv) => (
        <RecentChatItem
          key={conv.id}
          conversation={conv}
          onClick={() => handleConversationClick(conv)}
        />
      ))}
    </div>
  );
}

interface RecentChatItemProps {
  conversation: DMConversation;
  onClick: () => void;
}

function RecentChatItem({ conversation, onClick }: RecentChatItemProps) {
  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  const getPreviewText = () => {
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.shared_item) {
      const itemType = lastMessage.shared_item.type?.toLowerCase() || 'item';
      return `Shared a ${itemType}`;
    }
    return lastMessage.content || '';
  };

  const getTimeAgo = () => {
    if (!lastMessage) return '';
    const date = new Date(lastMessage.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
            {otherUser?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p
            className={cn(
              'text-sm font-medium truncate',
              unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
            )}
          >
            {otherUser?.display_name || 'Unknown'}
          </p>
          <span className="text-xs text-gray-400 shrink-0">{getTimeAgo()}</span>
        </div>
        <p
          className={cn(
            'text-xs truncate',
            unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
          )}
        >
          {getPreviewText()}
        </p>
      </div>
    </button>
  );
}

export default RecentChats;

