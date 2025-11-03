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
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
      {/* Header - FUZO Orange Theme */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-500 text-white p-4 safe-area-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
              <span className="text-sm font-semibold">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-base">Chats</span>
              <p className="text-xs text-white/80">FUZO</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={createNewChat}
              className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95 touch-target"
              title="New Chat"
            >
              <MessageCircle size={20} />
            </button>
            {onSignOut && (
              <button 
                onClick={onSignOut}
                className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95 touch-target"
                title="More Options"
              >
                <MoreVertical size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={18} />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/15 border border-white/20 rounded-full text-white placeholder-white/70 focus:outline-none focus:bg-white/25 focus:ring-2 focus:ring-white/30 transition-all"
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-200 border-t-orange-600"></div>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle size={56} className="mx-auto mb-4 text-orange-200" />
            <h3 className="font-semibold text-gray-800 mb-2">No chats yet</h3>
            <p className="text-sm text-gray-600">Start a conversation to see it here</p>
            <button
              onClick={createNewChat}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md active:scale-95 font-medium"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const isActive = activeChannel?.id === channel.id;
            const hasUnread = false; // TODO: Implement unread count
            
            return (
              <div
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`flex items-center p-4 hover:bg-orange-50/50 cursor-pointer border-b border-gray-100 transition-all active:bg-orange-100/50 ${
                  isActive ? 'bg-orange-50 border-l-4 border-l-orange-600 shadow-sm' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 shrink-0 ring-2 transition-all ${
                  isActive 
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white ring-orange-300' 
                    : 'bg-orange-100 text-orange-600 ring-orange-200'
                }`}>
                  <span className="font-semibold text-base">
                    {formatChannelName(channel).charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-semibold truncate ${
                      isActive ? 'text-orange-900' : 'text-gray-900'
                    }`}>
                      {formatChannelName(channel)}
                    </h3>
                    <span className={`text-xs shrink-0 ml-2 ${
                      isActive ? 'text-orange-600 font-medium' : 'text-gray-500'
                    }`}>
                      {formatTime(channel)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${
                      hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                    }`}>
                      {formatLastMessage(channel)}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 shrink-0 w-5 h-5 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        3
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}