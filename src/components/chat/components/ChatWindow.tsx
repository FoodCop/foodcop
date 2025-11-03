import { useState, useEffect, useRef } from 'react';
import { Channel } from 'stream-chat';
import { Send, Paperclip, Smile } from 'lucide-react';

interface ChatWindowProps {
  channel: Channel;
  currentUser: any;
}

export default function ChatWindow({ channel, currentUser }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channel) return;

    // Load messages
    const loadMessages = async () => {
      try {
        const result = await channel.query({
          messages: { limit: 50 }
        });
        setMessages(result.messages || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event: any) => {
      setMessages(prev => [...prev, event.message]);
    };

    // Listen for typing events
    const handleTypingStart = () => setIsTyping(true);
    const handleTypingStop = () => setIsTyping(false);

    channel.on('message.new', handleNewMessage);
    channel.on('typing.start', handleTypingStart);
    channel.on('typing.stop', handleTypingStop);

    return () => {
      channel.off('message.new', handleNewMessage);
      channel.off('typing.start', handleTypingStart);
      channel.off('typing.stop', handleTypingStop);
    };
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await channel.sendMessage({ text: message });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getChannelName = () => {
    if ((channel.data as any)?.name) {
      return (channel.data as any).name;
    }
    
    const otherMember = Object.values(channel.state.members).find(
      member => member.user?.id !== currentUser?.id
    );
    return otherMember?.user?.name || otherMember?.user?.id || 'Unknown';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header - FUZO Orange Theme */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-4 flex items-center border-b shadow-sm safe-area-top">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 ring-2 ring-white/30">
          <span className="text-sm font-semibold">
            {getChannelName().charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-base">{getChannelName()}</h2>
          <p className="text-xs text-white/90 flex items-center">
            {isTyping ? (
              <>
                <span className="inline-flex space-x-1 mr-1">
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                typing...
              </>
            ) : (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                online
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages - Enhanced WhatsApp Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-orange-50/30 to-white mobile-chat-messages">
        {messages.map((msg, index) => {
          const isOwnMessage = msg.user?.id === currentUser?.id;
          const showAvatar = index === 0 || messages[index - 1]?.user?.id !== msg.user?.id;
          
          return (
            <div
              key={msg.id || index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
            >
              {!isOwnMessage && showAvatar && (
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-orange-600 font-medium text-xs ring-2 ring-orange-200">
                  {msg.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {!isOwnMessage && !showAvatar && <div className="w-8 mr-2"></div>}
              
              <div
                className={`max-w-[75%] md:max-w-md px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
                  isOwnMessage
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm group-hover:shadow-md'
                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100 group-hover:shadow-md'
                }`}
              >
                {!isOwnMessage && showAvatar && (
                  <p className="text-xs font-semibold mb-1 text-orange-600">
                    {msg.user?.name || 'User'}
                  </p>
                )}
                <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                  isOwnMessage ? 'text-white/80' : 'text-gray-500'
                }`}>
                  <span>{formatTime(msg.created_at)}</span>
                  {isOwnMessage && (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Enhanced Mobile-Friendly */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4 safe-area-bottom shadow-sm">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <button
            type="button"
            className="p-2.5 text-gray-500 hover:text-orange-600 transition-colors rounded-full hover:bg-orange-50 touch-target flex-shrink-0"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all text-sm md:text-base"
              style={{ fontSize: '16px' }} // Prevent zoom on iOS
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-600 transition-colors p-1 rounded-full hover:bg-orange-50"
              title="Emoji"
            >
              <Smile size={20} />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95 touch-target flex-shrink-0"
            title="Send message"
          >
            <Send size={20} className="translate-x-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}