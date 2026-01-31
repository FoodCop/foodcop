import { useEffect, useState } from 'react';
import { Message, Check, Close, Loop } from '@mui/icons-material';
import { useDMChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { DMConversation, DMChatService } from '../../services/dmChatService';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { NoMessageRequestsEmptyState } from './EmptyState';
import { cn } from '../ui/utils';

interface MessageRequestListProps {
  onAccept?: (conversation: DMConversation) => void;
  onDecline?: (conversation: DMConversation) => void;
}

export function MessageRequestList({
  onAccept,
  onDecline,
}: MessageRequestListProps) {
  const { user } = useAuthStore();
  const { loadConversations } = useDMChatStore();
  const [requests, setRequests] = useState<DMConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      loadPendingRequests();
    }
  }, [user?.id]);

  const loadPendingRequests = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    const result = await DMChatService.fetchPendingRequests(user.id);
    
    if (result.success && result.data) {
      setRequests(result.data);
    }
    
    setIsLoading(false);
  };

  const handleAccept = async (conversation: DMConversation) => {
    if (processingIds.has(conversation.id)) return;
    
    setProcessingIds((prev) => new Set(prev).add(conversation.id));
    
    const result = await DMChatService.acceptMessageRequest(conversation.id);
    
    if (result.success) {
      // Remove from requests list
      setRequests((prev) => prev.filter((r) => r.id !== conversation.id));
      
      // Reload conversations to show the new active conversation
      if (user?.id) {
        await loadConversations(user.id);
      }
      
      if (onAccept) {
        onAccept(conversation);
      }
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(conversation.id);
      return next;
    });
  };

  const handleDecline = async (conversation: DMConversation) => {
    if (processingIds.has(conversation.id)) return;
    
    setProcessingIds((prev) => new Set(prev).add(conversation.id));
    
    const result = await DMChatService.declineMessageRequest(conversation.id);
    
    if (result.success) {
      // Remove from requests list
      setRequests((prev) => prev.filter((r) => r.id !== conversation.id));
      
      if (onDecline) {
        onDecline(conversation);
      }
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(conversation.id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (requests.length === 0) {
    return <NoMessageRequestsEmptyState />;
  }

  return (
    <div className="divide-y divide-gray-100">
      {requests.map((request) => (
        <MessageRequestItem
          key={request.id}
          request={request}
          onAccept={() => handleAccept(request)}
          onDecline={() => handleDecline(request)}
          isProcessing={processingIds.has(request.id)}
        />
      ))}
    </div>
  );
}

interface MessageRequestItemProps {
  request: DMConversation;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}

function MessageRequestItem({
  request,
  onAccept,
  onDecline,
  isProcessing,
}: MessageRequestItemProps) {
  const otherUser = request.other_user;
  const lastMessage = request.last_message;

  const getPreviewText = () => {
    if (!lastMessage) return 'Sent a message';
    if (lastMessage.shared_item) {
      return `Shared a ${lastMessage.shared_item.type}`;
    }
    return lastMessage.content || 'Sent a message';
  };

  const getTimeAgo = () => {
    if (!lastMessage) {
      const date = new Date(request.created_at);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    }
    
    const date = new Date(lastMessage.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback className="bg-fuzo-orange-100 text-fuzo-orange-600">
            {otherUser?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-medium text-gray-900 truncate">
              {otherUser?.display_name || 'Unknown'}
            </p>
            <span className="text-xs text-gray-400 shrink-0">{getTimeAgo()}</span>
          </div>
          <p className="text-sm text-gray-600 truncate mb-3">
            {getPreviewText()}
          </p>

          <div className="flex gap-2">
            <Button
              onClick={onAccept}
              disabled={isProcessing}
              size="sm"
              className="flex-1 bg-fuzo-orange-500 hover:bg-fuzo-orange-600 text-white"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
            <Button
              onClick={onDecline}
              disabled={isProcessing}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageRequestList;

