import { useState, useEffect } from 'react';
import { Search, Send, Loop, Close, Check } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useAuthStore } from '../../stores/authStore';
import { useDMChatStore } from '../../stores/chatStore';
import { FriendService, FriendData } from '../../services/friendService';
import { SharedItem } from '../../services/dmChatService';
import { cn } from '../ui/utils';

interface ShareToChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SharedItem;
  onSuccess?: () => void;
}

export function ShareToChat({
  open,
  onOpenChange,
  item,
  onSuccess,
}: ShareToChatProps) {
  const { user } = useAuthStore();
  const { startConversation, shareItem } = useDMChatStore();

  const [friends, setFriends] = useState<FriendData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Load friends
  useEffect(() => {
    if (open && user?.id) {
      loadFriends();
    }
  }, [open, user?.id]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSelectedFriendId(null);
      setMessage('');
      setSent(false);
      setSearchQuery('');
    }
  }, [open]);

  const loadFriends = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const result = await FriendService.fetchAllFriendData(user.id);
    if (result.success && result.data) {
      setFriends(result.data.friends);
    }
    setIsLoading(false);
  };

  const filteredFriends = friends.filter((f) =>
    searchQuery
      ? f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleSend = async () => {
    if (!selectedFriendId || !user?.id) return;

    setIsSending(true);
    try {
      // Get or create conversation
      const conversationId = await startConversation(user.id, selectedFriendId);
      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }

      // Share the item
      const success = await shareItem(
        conversationId,
        user.id,
        item,
        message || undefined
      );

      if (success) {
        setSent(true);
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share to Friend</DialogTitle>
        </DialogHeader>

        {/* Item Preview */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase text-gray-500">{item.type}</p>
            <p className="font-medium text-gray-900 truncate">{item.title}</p>
            {item.subtitle && (
              <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="pl-9 bg-white text-[#6B7280] placeholder:text-[#9CA3AF] border-gray-200"
          />
        </div>

        {/* Friends List */}
        <div className="max-h-48 overflow-y-auto -mx-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {friends.length === 0
                ? 'No friends yet'
                : 'No friends match your search'}
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <button
                key={friend.userId}
                onClick={() => setSelectedFriendId(friend.userId)}
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-lg transition-colors',
                  selectedFriendId === friend.userId
                    ? 'bg-fuzo-orange-50 border border-fuzo-orange-200'
                    : 'hover:bg-gray-50'
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={friend.avatarUrl} />
                  <AvatarFallback className="bg-fuzo-orange-100 text-fuzo-orange-600">
                    {friend.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {friend.displayName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    @{friend.username}
                  </p>
                </div>
                {selectedFriendId === friend.userId && (
                  <div className="h-5 w-5 rounded-full bg-fuzo-orange-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Message Input */}
        {selectedFriendId && (
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message (optional)"
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedFriendId || isSending || sent}
            className="bg-fuzo-orange-500 hover:bg-fuzo-orange-600"
          >
            {sent ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sent!
              </>
            ) : isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareToChat;

