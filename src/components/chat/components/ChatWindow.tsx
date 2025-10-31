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
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center border-b">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
          <span className="text-sm font-semibold">
            {getChannelName().charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="font-semibold">{getChannelName()}</h2>
          <p className="text-sm text-white/80">
            {isTyping ? 'typing...' : 'online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, index) => {
          const isOwnMessage = msg.user?.id === currentUser?.id;
          return (
            <div
              key={msg.id || index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                  isOwnMessage
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none border'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Smile size={18} />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}