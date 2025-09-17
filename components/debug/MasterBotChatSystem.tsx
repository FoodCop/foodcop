import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Heart, Star, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar } from './ui/avatar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { getMasterBotById } from './constants/masterBotsData';
import { getBotPersonality } from './constants/masterBotPersonalities';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  reactions?: {
    likes: number;
    loved: number;
    starred: number;
  };
  context?: {
    topic?: string;
    foodMention?: string;
    location?: string;
  };
}

interface MasterBotChatSystemProps {
  botId: string;
  onClose?: () => void;
  initialMessage?: string;
}

export function MasterBotChatSystem({ botId, onClose, initialMessage }: MasterBotChatSystemProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  const bot = getMasterBotById(botId);
  const personality = getBotPersonality(botId);

  useEffect(() => {
    // Simulate connection and initial greeting
    setTimeout(() => {
      setConnectionStatus('connected');
      if (bot && personality) {
        addBotMessage(generateGreeting());
      }
    }, 1500);

    // Handle initial message if provided
    if (initialMessage) {
      setTimeout(() => {
        setInputMessage(initialMessage);
      }, 2000);
    }
  }, [botId]);

  const generateGreeting = (): string => {
    if (!bot || !personality) return "Hello!";
    
    const greetings = {
      'aurelia-voss': "Hey there! 🌍 I just got back from this incredible night market in Bangkok - the aroma of lemongrass and chili is still in my hair! What food adventure can I help you plan?",
      'sebastian-leclair': "Bonjour! I'm currently enjoying a remarkable 2018 Chablis that pairs beautifully with this autumn weather. How may I assist you with your culinary journey today?",
      'lila-cheng': "Hi there! 🌱 I'm so excited to connect! I just discovered this amazing cashew-based 'cheese' that's completely revolutionizing my kitchen. What plant-based adventures are you curious about?",
      'rafael-mendez': "Yo! 🏄‍♂️ Just grabbed some epic fish tacos after a dawn surf session - still sandy but so worth it! What kind of food adventure are you craving?",
      'anika-kapoor': "Namaste! 🌶️ I've been grinding fresh garam masala this morning - the cardamom and cinnamon are singing together beautifully. How can I share some spice wisdom with you today?",
      'omar-darzi': "Peace and good morning. ☕ I'm savoring a single-origin Ethiopian brew while watching the sunrise. There's something meditative about this moment. What brings you here today?",
      'jun-tanaka': "Good day. 🍣 I've just finished preparing the morning rice - each grain perfectly tender. There's beauty in these simple rituals. How may I assist you?"
    };

    return greetings[botId as keyof typeof greetings] || "Hello! How can I help you today?";
  };

  const addBotMessage = (content: string, context?: ChatMessage['context']) => {
    const newMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      reactions: { likes: 0, loved: 0, starred: 0 },
      context
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const generateBotResponse = (userMessage: string): string => {
    if (!bot || !personality) return "I'm having trouble connecting right now. Try again in a moment!";

    const lowerMessage = userMessage.toLowerCase();
    
    // Context-aware responses based on bot personality
    if (lowerMessage.includes('recipe') || lowerMessage.includes('cook')) {
      return generateRecipeResponse(userMessage);
    }
    
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('where to eat')) {
      return generateRestaurantResponse(userMessage);
    }
    
    if (lowerMessage.includes('spice') || lowerMessage.includes('ingredient')) {
      return generateIngredientResponse(userMessage);
    }
    
    if (lowerMessage.includes('travel') || lowerMessage.includes('country')) {
      return generateTravelResponse(userMessage);
    }

    // Default personality-driven response
    return generateDefaultResponse(userMessage);
  };

  const generateRecipeResponse = (userMessage: string): string => {
    const responses = {
      'aurelia-voss': "Oh, I love that you're asking about recipes! You know, I learned this incredible technique from a street vendor in Mexico City. Let me tell you about this spice blend that'll change your life...",
      'sebastian-leclair': "Ah, cuisine! The foundation of any great recipe is understanding the ingredient's terroir. What type of dish were you considering? I can suggest some technique refinements...",
      'lila-cheng': "YES! 🌱 Recipe sharing is my favorite! I have this amazing plant-based version that'll blow your mind - all the flavor, none of the compromise. Want me to walk you through it?",
      'rafael-mendez': "Dude, cooking after a good adventure makes everything taste better! What kind of vibe are you going for? Quick and energizing or something hearty for post-workout?",
      'anika-kapoor': "Recipes are family stories passed down through generations. Each spice has its purpose and timing. What type of cuisine speaks to your heart? I can share the traditional way...",
      'omar-darzi': "There's something meditative about following a recipe mindfully. The process matters as much as the result. What flavors are you drawn to today?",
      'jun-tanaka': "True recipes require patience and respect for ingredients. Quality over complexity. What seasonal ingredients are calling to you?"
    };

    return responses[botId as keyof typeof responses] || "I'd love to help with recipes!";
  };

  const generateRestaurantResponse = (userMessage: string): string => {
    const responses = {
      'aurelia-voss': "Restaurant hunting is my specialty! 🗺️ Where are you located? I have some incredible hidden gems that locals swear by. No tourist traps on my watch!",
      'sebastian-leclair': "Ah, restaurant selection - one of life's great pleasures. What's the occasion? I can recommend something perfectly suited to your needs, from intimate bistros to Michelin experiences.",
      'lila-cheng': "Finding great plant-based spots can be challenging, but I've got you covered! 🌱 Are you looking for fully vegan or vegan-friendly places? I know some amazing spots!",
      'rafael-mendez': "Awesome! I'm always down for restaurant adventures! 🏄‍♂️ What's your vibe - beachside casual, mountain town cozy, or urban food truck action?",
      'anika-kapoor': "Finding authentic restaurants that honor traditional techniques is an art. What type of cuisine? I can guide you to places that respect the heritage.",
      'omar-darzi': "The atmosphere matters as much as the food. Are you seeking a contemplative space or energetic environment? I know some special places...",
      'jun-tanaka': "The best restaurants honor their ingredients and traditions. What style of cuisine speaks to you? I prefer places where quality is evident in simplicity."
    };

    return responses[botId as keyof typeof responses] || "I'd love to help you find great restaurants!";
  };

  const generateIngredientResponse = (userMessage: string): string => {
    const responses = {
      'aurelia-voss': "Ingredients tell the story of a place! 🌶️ I've sourced spices from markets across five continents. What ingredient has you curious? I probably have a story about it!",
      'sebastian-leclair': "Ah, ingredients - the foundation of exceptional cuisine. Sourcing matters tremendously. What specific ingredient interests you? I can share some procurement insights.",
      'lila-cheng': "Plant ingredients are SO diverse and amazing! 🌿 There are so many incredible alternatives and substitutions. What are you working with? I love ingredient innovation!",
      'rafael-mendez': "Keep it simple and fresh, that's my motto! 🥑 Local, seasonal stuff always tastes better. What ingredients are you thinking about?",
      'anika-kapoor': "Each spice and ingredient has its own personality and purpose. Understanding them is key to great cooking. Which ingredients are speaking to you today?",
      'omar-darzi': "Quality ingredients deserve mindful preparation. Like coffee beans, each has its own character. What ingredients are you curious about?",
      'jun-tanaka': "Respect the ingredient's true nature. Seasonal, fresh, and prepared with intention. What ingredients are you working with?"
    };

    return responses[botId as keyof typeof responses] || "I'd love to discuss ingredients with you!";
  };

  const generateTravelResponse = (userMessage: string): string => {
    const responses = {
      'aurelia-voss': "Travel and food go hand in hand! ✈️ I've eaten my way through 40+ countries. Where are you headed? I can give you the inside scoop on local food scenes!",
      'sebastian-leclair': "Travel dining requires strategy. Each region has its specialties worth seeking. Where might your travels take you? I can suggest some remarkable experiences.",
      'lila-cheng': "Traveling plant-based has gotten SO much easier! 🌍 I have tips for finding great vegan food anywhere. Where are you planning to go?",
      'rafael-mendez': "Travel adventures and food discoveries - my favorite combo! 🌊 Where's the next adventure? I can hook you up with some epic local spots!",
      'anika-kapoor': "Travel opens doors to culinary traditions. Each region has wisdom to share. Where are you curious to explore? I can share cultural insights.",
      'omar-darzi': "Travel coffee culture fascinates me. Every country has its own relationship with coffee. Where might your journey take you?",
      'jun-tanaka': "Travel teaches appreciation for different culinary traditions. Each place has lessons to offer. Where does your curiosity lead you?"
    };

    return responses[botId as keyof typeof responses] || "I'd love to help with travel food advice!";
  };

  const generateDefaultResponse = (userMessage: string): string => {
    if (!personality) return "I'm here to help!";
    
    const phrases = personality.conversationStyle.typical_phrases;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    return `${randomPhrase} That's a great question! I'd love to share my perspective on this. Based on my experiences, I think there's a lot we can explore together. What specific aspect interests you most?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addUserMessage(userMessage);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay based on personality
    const typingDelay = personality?.socialBehavior.response_speed === 'immediate' ? 1000 : 
                      personality?.socialBehavior.response_speed === 'thoughtful' ? 2500 : 4000;

    setTimeout(() => {
      setIsTyping(false);
      const response = generateBotResponse(userMessage);
      addBotMessage(response);
    }, typingDelay);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!bot || !personality) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Bot not found or unavailable.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-[#0B1F3A]">{bot.name}</h3>
            <p className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? 'Online' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {bot.specialty[0]}
          </Badge>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className="flex-shrink-0">
                  {message.type === 'bot' ? (
                    <Avatar className="w-8 h-8">
                      <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-[#F14C35] text-white' 
                    : 'bg-gray-100 text-[#0B1F3A]'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2">
                <Avatar className="w-8 h-8">
                  <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${bot.name}...`}
            className="flex-1"
            disabled={connectionStatus !== 'connected'}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || connectionStatus !== 'connected'}
            className="bg-[#F14C35] hover:bg-[#E03A28] text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {bot.name} specializes in {bot.specialty.join(', ').toLowerCase()}
        </p>
      </div>
    </div>
  );
}
