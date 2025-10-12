'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';

interface MasterBot {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface MasterBotChatProps {
  masterbot: MasterBot;
  onBack: () => void;
}

export default function MasterBotChat({ masterbot, onBack }: MasterBotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/chat/ai?masterbot=${masterbot.username}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        console.error('Failed to load chat history:', data.error);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [masterbot.username]);

  // Load chat history
  useEffect(() => {
    loadChatHistory();
  }, [masterbot.username, loadChatHistory]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          masterbot: masterbot.username,
          message: messageText,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add both user message and AI response to the chat
        setMessages(prev => [...prev, data.userMessage, data.aiMessage]);
      } else {
        console.error('Failed to send message:', data.error);
        // Add user message back to input on error
        setInputMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add user message back to input on error
      setInputMessage(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{masterbot.display_name}</h3>
            <p className="text-sm text-gray-500">AI Master Bot • @{masterbot.username}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start chatting with {masterbot.display_name}
            </h3>
            <p className="text-gray-500 max-w-sm">
              Ask about food, recipes, restaurants, or get personalized recommendations!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.is_ai_generated ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className={`flex-shrink-0 ${message.is_ai_generated ? 'order-1' : 'order-2'}`}>
                {message.is_ai_generated ? (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {message.user.display_name?.[0] || message.user.username?.[0] || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className={`flex flex-col max-w-xs lg:max-w-md ${message.is_ai_generated ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.is_ai_generated
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className={`text-xs text-gray-500 mt-1 ${message.is_ai_generated ? 'text-left' : 'text-right'}`}>
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${masterbot.display_name}...`}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}