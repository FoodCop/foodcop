import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MessageCircle, MapPin, Star, Heart, Clock, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TakoIntroHint } from './TakoIntroHint';
import { projectId, publicAnonKey } from '../utils/supabase/info';
// import (figma asset) - DISABLED:9566fb321ba47b7b112f8b4d7803d27b9ea2dbaf.png';

export interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  cards?: MessageCard[];
}

export interface MessageCard {
  id: string;
  type: 'restaurant' | 'recipe' | 'help' | 'map' | 'action';
  data: any;
}

interface FuzoAIAssistantProps {
  onNavigateToMap?: (location?: { lat: number; lng: number }) => void;
  onNavigateToRecipe?: (recipeId: string) => void;
  onSaveRestaurant?: (restaurantId: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToScout?: () => void;
  onNavigateToBites?: () => void;
  isVisible?: boolean;
}

export function FuzoAIAssistant({ 
  onNavigateToMap, 
  onNavigateToRecipe, 
  onSaveRestaurant,
  onNavigateToFeed,
  onNavigateToScout,
  onNavigateToBites,
  isVisible = true 
}: FuzoAIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi there! I'm Tako, your intelligent FUZO food assistant! 🐙 I'm powered by AI and ready to help you discover amazing restaurants, find delicious recipes, navigate the app, or answer any food-related questions. What culinary adventure can I help you with today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showIntroHint, setShowIntroHint] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickSuggestions = [
    'Nearby Food',
    'Recipes',
    'How FUZO works',
    'Test AI Connection'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleExpand = () => {
    setIsExpanded(true);
    setShowIntroHint(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      console.log('🐙 Tako AI: Sending request to backend...', {
        projectId,
        message: text,
        conversationLength: messages.length
      });

      // Call the real OpenAI backend
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5976446e/tako-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          message: text,
          conversation: messages.map(msg => ({
            type: msg.type,
            content: msg.content
          }))
        })
      });

      console.log('🐙 Tako AI: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🐙 Tako AI: API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🐙 Tako AI: Success! Got response from OpenAI:', {
        hasMessage: !!data.message,
        messageLength: data.message?.length,
        cardsCount: data.cards?.length || 0
      });
      
      const aiResponse: AIMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.message,
        timestamp: new Date(),
        cards: data.cards || []
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);

    } catch (error) {
      console.error('🐙 Tako AI: Error occurred, falling back to mock response:', error);
      setIsTyping(false);
      
      // Add a system message to let user know about the issue
      const errorMessage: AIMessage = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: "🐙 Oops! I'm having trouble connecting to my AI brain right now. Let me give you a helpful response while I try to reconnect...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Small delay before showing fallback
      setTimeout(() => {
        const fallbackResponse = generateFallbackResponse(text);
        setMessages(prev => [...prev, fallbackResponse]);
      }, 1000);
    }
  };

  const generateFallbackResponse = (userInput: string): AIMessage => {
    const input = userInput.toLowerCase();
    
    if (input.includes('nearby') || input.includes('restaurant') || input.includes('food')) {
      return {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: "I found some great restaurants near you! Check out these top picks:",
        timestamp: new Date(),
        cards: [
          {
            id: 'rest_1',
            type: 'restaurant',
            data: {
              id: 'r1',
              name: 'Sakura Sushi Bar',
              image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
              rating: 4.8,
              cuisine: 'Japanese',
              distance: '0.2 mi',
              priceLevel: 3
            }
          },
          {
            id: 'rest_2',
            type: 'restaurant',
            data: {
              id: 'r2',
              name: 'Verde Pizza',
              image: 'https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400',
              rating: 4.6,
              cuisine: 'Italian',
              distance: '0.5 mi',
              priceLevel: 2
            }
          }
        ]
      };
    }

    if (input.includes('recipe') || input.includes('cook')) {
      return {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: "Here are some delicious recipes you might enjoy:",
        timestamp: new Date(),
        cards: [
          {
            id: 'recipe_1',
            type: 'recipe',
            data: {
              id: 'rec1',
              title: 'Creamy Tuscan Pasta',
              image: 'https://images.unsplash.com/photo-1693820206848-6ad84857832a?w=400',
              cookingTime: 25,
              difficulty: 'Easy'
            }
          },
          {
            id: 'recipe_2',
            type: 'recipe',
            data: {
              id: 'rec2',
              title: 'Spicy Ramen Bowl',
              image: 'https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?w=400',
              cookingTime: 35,
              difficulty: 'Medium'
            }
          }
        ]
      };
    }

    if (input.includes('how') || input.includes('help') || input.includes('work')) {
      return {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: "FUZO is your social food discovery platform! Here's how it works:",
        timestamp: new Date(),
        cards: [
          {
            id: 'help_1',
            type: 'help',
            data: {
              title: 'Discover Food',
              description: 'Swipe through nearby restaurants and save your favorites to your Plate',
              icon: 'heart'
            }
          },
          {
            id: 'help_2',
            type: 'help',
            data: {
              title: 'Find Recipes',
              description: 'Browse and create amazing recipes in our Bites section',
              icon: 'chef'
            }
          },
          {
            id: 'help_3',
            type: 'help',
            data: {
              title: 'Scout Locations',
              description: 'Use our map to find restaurants by location and cuisine',
              icon: 'map'
            }
          }
        ]
      };
    }

    if (input.includes('map') || input.includes('direction') || input.includes('route')) {
      return {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: "I can help you navigate to any restaurant! Would you like me to show you directions?",
        timestamp: new Date(),
        cards: [
          {
            id: 'map_1',
            type: 'map',
            data: {
              restaurant: 'Sakura Sushi Bar',
              address: '123 Main St, Downtown',
              distance: '0.2 mi',
              coordinates: { lat: 37.7749, lng: -122.4194 }
            }
          }
        ]
      };
    }

    // Default fallback response when AI is unavailable
    return {
      id: Date.now().toString() + '_ai',
      content: "🐙 I'm currently using my backup responses while my AI brain reconnects. For full AI assistance, please try the 'Test AI Connection' button to help diagnose any issues. In the meantime, I can still help with basic questions!",
      timestamp: new Date(),
      type: 'ai'
    };
  };

  const handleQuickSuggestion = async (suggestion: string) => {
    if (suggestion === 'Test AI Connection') {
      // Test backend health and AI connection
      setIsTyping(true);
      try {
        console.log('🔍 Testing backend health...');
        const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5976446e/health`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        const healthData = await healthResponse.json();
        console.log('🔍 Backend health check:', healthData);
        
        const testMessage: AIMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: `🔧 **Backend Health Check Results:**\n\n` +
                  `• Server Status: ${healthData.status || 'Unknown'}\n` +
                  `• OpenAI Configured: ${healthData.services?.openai_configured ? '✅ Yes' : '❌ No'}\n` +
                  `• Google Maps Configured: ${healthData.services?.google_maps_configured ? '✅ Yes' : '❌ No'}\n` +
                  `• Timestamp: ${healthData.timestamp || 'Unknown'}\n\n` +
                  `Now testing actual AI chat...`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, testMessage]);
        setIsTyping(false);
        
        // Now test the actual AI chat
        setTimeout(() => {
          handleSendMessage('Hello Tako! This is a test message.');
        }, 1000);
        
      } catch (error) {
        console.error('🔍 Backend health check failed:', error);
        const errorMessage: AIMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: `🚨 **Backend Health Check Failed:**\n\nError: ${error.message}\n\nThis suggests there's a connection issue with the backend server.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }
      return;
    }
    
    handleSendMessage(suggestion);
  };

  const handleCardAction = (card: MessageCard, action: string) => {
    switch (action) {
      case 'save':
        if (card.type === 'restaurant') {
          onSaveRestaurant?.(card.data.id);
          // Add confirmation message
          const confirmMessage: AIMessage = {
            id: Date.now().toString(),
            type: 'ai',
            content: `Great! I've saved ${card.data.name} to your Plate. You can find it in your saved restaurants! 🍽️`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmMessage]);
        }
        break;
      case 'map':
        if (card.type === 'restaurant' || card.type === 'map') {
          onNavigateToMap?.(card.data.coordinates);
          handleCollapse();
        }
        break;
      case 'view':
        if (card.type === 'recipe') {
          onNavigateToRecipe?.(card.data.id);
          handleCollapse();
        }
        break;
      case 'route':
        if (card.type === 'map') {
          onNavigateToMap?.(card.data.coordinates);
          handleCollapse();
        }
        break;
      case 'navigate_scout':
        onNavigateToScout?.();
        handleCollapse();
        break;
      case 'navigate_recipes':
        onNavigateToBites?.();
        handleCollapse();
        break;
      case 'navigate_feed':
        onNavigateToFeed?.();
        handleCollapse();
        break;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExpand}
            className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-gradient-to-br from-[#F14C35] to-[#A6471E] rounded-full shadow-lg flex items-center justify-center overflow-hidden group"
          >
            <div className="relative w-10 h-10">
              <ImageWithFallback
                src={takoAI}
                alt="Tako AI Assistant"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            
            {/* Pulsing indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD74A] rounded-full animate-pulse border-2 border-white" />
            
            {/* Floating help text */}
            <div className="absolute -top-12 -left-8 bg-white px-3 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <p className="text-sm text-[#0B1F3A] font-medium">Ask Tako!</p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                    <ImageWithFallback
                      src={takoAI}
                      alt="Tako AI Assistant"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-white font-bold">FUZO Assistant</h2>
                    <p className="text-white/80 text-sm">Tako is here to help</p>
                  </div>
                </div>
                <button
                  onClick={handleCollapse}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onCardAction={handleCardAction}
                />
              ))}
              
              {/* Typing Indicator */}
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2 mb-4 overflow-x-auto">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="flex-shrink-0 px-4 py-2 bg-[#F14C35]/10 text-[#F14C35] rounded-full text-sm font-medium hover:bg-[#F14C35]/20 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder="Ask Tako anything about food..."
                    className="w-full px-4 py-3 pr-12 bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20 focus:bg-white transition-all"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#F14C35] transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-[#F14C35] rounded-xl flex items-center justify-center hover:bg-[#E63E26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro Hint */}
      {showIntroHint && !isExpanded && (
        <TakoIntroHint
          onDismiss={() => setShowIntroHint(false)}
          onTryNow={handleExpand}
        />
      )}
    </>
  );
}

// Chat Message Component
function ChatMessage({ 
  message, 
  onCardAction 
}: { 
  message: AIMessage; 
  onCardAction: (card: MessageCard, action: string) => void;
}) {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <ImageWithFallback
                src={takoAI}
                alt="Tako"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-gray-500">Tako</span>
          </div>
        )}
        
        <div
          className={`p-3 rounded-2xl ${
            isUser
              ? 'bg-[#F14C35] text-white rounded-br-md'
              : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Message Cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.cards.map((card) => (
              <MessageCard key={card.id} card={card} onAction={onCardAction} />
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// Message Card Component
function MessageCard({ 
  card, 
  onAction 
}: { 
  card: MessageCard; 
  onAction: (card: MessageCard, action: string) => void;
}) {
  if (card.type === 'restaurant') {
    const { name, image, rating, cuisine, distance, priceLevel } = card.data;
    const priceSymbols = '$'.repeat(priceLevel);

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex">
          <div className="w-20 h-20 flex-shrink-0">
            <ImageWithFallback
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-3">
            <h4 className="font-semibold text-sm text-[#0B1F3A] mb-1">{name}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{rating}</span>
              </div>
              <span>•</span>
              <span>{cuisine}</span>
              <span>•</span>
              <span>{priceSymbols}</span>
              <span>•</span>
              <span>{distance}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onAction(card, 'save')}
                className="flex-1 px-3 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-lg text-xs font-medium hover:bg-[#F14C35]/20 transition-colors"
              >
                Save to Plate
              </button>
              <button
                onClick={() => onAction(card, 'map')}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                View Map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'recipe') {
    const { title, image, cookingTime, difficulty } = card.data;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex">
          <div className="w-20 h-20 flex-shrink-0">
            <ImageWithFallback
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-3">
            <h4 className="font-semibold text-sm text-[#0B1F3A] mb-1">{title}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{cookingTime} min</span>
              </div>
              <span>•</span>
              <span>{difficulty}</span>
            </div>
            <button
              onClick={() => onAction(card, 'view')}
              className="w-full px-3 py-1 bg-[#F14C35] text-white rounded-lg text-xs font-medium hover:bg-[#E63E26] transition-colors"
            >
              View Recipe
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'help') {
    const { title, description, icon } = card.data;
    const IconComponent = icon === 'heart' ? Heart : icon === 'chef' ? ChefHat : MapPin;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-[#F14C35]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-4 h-4 text-[#F14C35]" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#0B1F3A] mb-1">{title}</h4>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'map') {
    const { restaurant, address, distance } = card.data;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm text-[#0B1F3A] mb-1">{restaurant}</h4>
            <p className="text-xs text-gray-600 mb-1">{address}</p>
            <p className="text-xs text-gray-500">{distance} away</p>
          </div>
          <button
            onClick={() => onAction(card, 'route')}
            className="px-4 py-2 bg-[#F14C35] text-white rounded-lg text-sm font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-1"
          >
            <MapPin className="w-4 h-4" />
            <span>Show Route</span>
          </button>
        </div>
      </div>
    );
  }

  if (card.type === 'action') {
    const { title, description, action, icon } = card.data;
    const IconComponent = icon === 'heart' ? Heart : icon === 'chef' ? ChefHat : MapPin;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-[#F14C35]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-4 h-4 text-[#F14C35]" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[#0B1F3A] mb-1">{title}</h4>
              <p className="text-xs text-gray-600">{description}</p>
            </div>
          </div>
          <button
            onClick={() => onAction(card, action)}
            className="px-4 py-2 bg-[#F14C35] text-white rounded-lg text-sm font-medium hover:bg-[#E63E26] transition-colors"
          >
            Go
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full overflow-hidden">
          <ImageWithFallback
            src={takoAI}
            alt="Tako"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
