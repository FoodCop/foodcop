import { useState, useEffect } from 'react';
import { Channel } from 'stream-chat';
import { ChatService } from '../services/chatService';
import { Search, MoreVertical, MessageCircle } from 'lucide-react';

interface SidebarProps {
  activeChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  currentUser: any;
  onSignOut?: () => void;
}

export default function Sidebar({ activeChannel, onChannelSelect, currentUser, onSignOut }: SidebarProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const chatService = ChatService.getInstance();

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setIsLoading(true);
      const channelList = await chatService.getChannels();
      setChannels(channelList);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChannels = channels.filter(channel => {
    const channelName = (channel.data as any)?.name || 
      Object.values(channel.state.members).find((member: any) => member.user?.id !== currentUser?.id)?.user?.name || 
      'Unknown';
    return channelName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatChannelName = (channel: Channel) => {
    if ((channel.data as any)?.name) {
      return (channel.data as any).name;
    }
    
    // For direct messages, show the other user's name
    const otherMember = Object.values(channel.state.members).find((member: any) => member.user?.id !== currentUser?.id);
    return otherMember?.user?.name || otherMember?.user?.id || 'Unknown';
  };

  const formatLastMessage = (channel: Channel) => {
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    
    if (lastMessage.text) {
      return lastMessage.text.length > 50 
        ? `${lastMessage.text.substring(0, 50)}...` 
        : lastMessage.text;
    }
    
    if (lastMessage.attachments?.length) {
      return '📎 File';
    }
    
    return 'Message';
  };

  const formatTime = (channel: Channel) => {
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    if (!lastMessage) return '';
    
    const date = new Date(lastMessage.created_at!);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const createNewChat = async () => {
    try {
      // For demo purposes, create a test channel
      const channel = await chatService.createDirectMessage('demo-user-123');
      setChannels(prev => [channel, ...prev]);
      onChannelSelect(channel);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="font-medium">Chats</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={createNewChat}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="New Chat"
            >
              <MessageCircle size={20} />
            </button>
            {onSignOut && (
              <button 
                onClick={onSignOut}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="More Options"
              >
                <MoreVertical size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/70 focus:outline-none focus:bg-white/20"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-medium mb-2">No chats yet</h3>
            <p className="text-sm">Start a conversation to see it here</p>
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const isActive = activeChannel?.id === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                  isActive ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                }`}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-green-600 font-semibold">
                    {formatChannelName(channel).charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {formatChannelName(channel)}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(channel)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {formatLastMessage(channel)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}