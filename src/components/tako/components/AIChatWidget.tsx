/**
 * AIChatWidget Component
 * TakoAI chat interface with restaurant search and rich cards
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { ScrollArea } from '../../ui/scroll-area';
import { X, Send, Sparkles } from 'lucide-react';
import { TakoAIService, type RestaurantCardData } from '../../../services/takoAIService';
import { RestaurantCard } from './RestaurantCard';
import { useYesNoDialog } from '../../../hooks/useYesNoDialog';
import { useAuth } from '../../auth/AuthProvider';
import { DashboardService } from '../../../services/dashboardService';
import { useChatStore } from '../../../stores/chatStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  restaurants?: RestaurantCardData[];
}

interface AIChatWidgetProps {
  readonly position?: 'bottom-right' | 'top-right';
}

export function AIChatWidget({ position = 'bottom-right' }: Readonly<AIChatWidgetProps>) {
  const { user } = useAuth();
  const { showYesNo, YesNoDialog } = useYesNoDialog();
  const { isOpen, closeChat } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m TakoAI, your food expert assistant. I can help you find restaurants, suggest meals, and answer food-related questions. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRestaurants, setPendingRestaurants] = useState<RestaurantCardData[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user preferences (for future use)
  const getUserPreferences = async () => {
    if (!user?.id) return undefined;
    try {
      return await DashboardService.fetchUserPreferences(user.id);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return undefined;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Get user preferences for personalized responses
      const preferences = await getUserPreferences();

      // Get conversation history (text only for API)
      const conversationHistory = messages
        .filter(m => m.role !== 'assistant' || !m.restaurants) // Exclude restaurant card messages from history
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      // Call TakoAI service
      const response = await TakoAIService.chat(
        conversationHistory,
        currentInput,
        preferences
      );

      // Check if restaurants were found
      if (response.restaurants && response.restaurants.length > 0) {
        // Show confirmation dialog
        const confirmed = await showYesNo({
          title: 'Restaurants Found',
          description: response.message,
          yesText: 'Show Me',
          noText: 'Cancel',
        });

        if (confirmed) {
          // Add assistant message with restaurants
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Here are ${response.restaurants.length} restaurant${response.restaurants.length > 1 ? 's' : ''} I found:`,
            timestamp: new Date(),
            restaurants: response.restaurants,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          // User cancelled - just add the confirmation message
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        // Regular text response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('TakoAI error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setPendingRestaurants(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const positionClasses = position === 'top-right' 
    ? 'fixed top-20 right-6 md:right-6 right-4 left-4 md:left-auto z-50 p-[0px] m-[0px]'
    : 'fixed bottom-6 right-6 md:right-6 right-4 left-4 md:left-auto z-50 p-[0px] m-[0px]';

  return (
    <>
      <YesNoDialog />
      <div className={positionClasses}>
        {/* Chat Interface */}
        {isOpen && (
          <Card className="mb-4 w-full md:w-[380px] h-[600px] max-h-[calc(100vh-7rem)] flex flex-col shadow-2xl overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0 mx-[12px] my-[0px]">
              <div className="flex items-center gap-2 text-gray-900">
                <Sparkles className="w-5 h-5" />
                <h3>TakoAI</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeChat}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 min-h-0">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    {/* Text Message */}
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        <span
                          className={`text-xs mt-1 block ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Restaurant Cards */}
                    {message.restaurants && message.restaurants.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {message.restaurants.map((restaurant) => (
                          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-white flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Floating Button - fallback trigger */}
        {!isOpen && (
          <Button
            onClick={() => {
              console.log('🔵 TakoAI button clicked');
              useChatStore.getState().openChat();
            }}
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 ml-auto"
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        )}
      </div>
    </>
  );
}
