import { useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useDMChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { DMConversation } from '../../services/dmChatService';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn } from '../ui/utils';

interface ConversationListProps {
  onSelectConversation: (conversation: DMConversation) => void;
}

export function ConversationList({
  onSelectConversation,
}: ConversationListProps) {
  const { user } = useAuthStore();
  const { conversations, loadConversations, isLoadingConversations } =
    useDMChatStore();

  useEffect(() => {
    if (user?.id) {
      loadConversations(user.id);
    }
  }, [user?.id]);

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4">
        <MessageCircle className="h-12 w-12 mb-2 stroke-1" />
        <p className="text-center">No conversations yet</p>
        <p className="text-sm text-center">
          Start a chat by sharing something with a friend!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          onClick={() => onSelectConversation(conv)}
        />
      ))}
    </div>
  );
}

interface ConversationItemProps {
  conversation: DMConversation;
  onClick: () => void;
}

function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const otherUser = conversation.other_user;
  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  const getPreviewText = () => {
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.shared_item) {
      return `Shared a ${lastMessage.shared_item.type}`;
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
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback className="bg-orange-100 text-orange-600">
            {otherUser?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'font-medium truncate',
              unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
            )}
          >
            {otherUser?.display_name || 'Unknown'}
          </p>
          <span className="text-xs text-gray-400 shrink-0">{getTimeAgo()}</span>
        </div>
        <p
          className={cn(
            'text-sm truncate',
            unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
          )}
        >
          {getPreviewText()}
        </p>
      </div>
    </button>
  );
}

export default ConversationList;

