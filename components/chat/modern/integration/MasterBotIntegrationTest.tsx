'use client';

import React, { useState } from 'react';
import { Bot, MessageCircle, ArrowLeft } from 'lucide-react';
import MasterBotList from './MasterBotList';
import MasterBotChat from './MasterBotChat';

interface MasterBot {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
}

export default function MasterBotIntegrationTest() {
  const [selectedBot, setSelectedBot] = useState<MasterBot | null>(null);
  const [showBotList, setShowBotList] = useState(false);

  const handleSelectBot = (bot: MasterBot) => {
    setSelectedBot(bot);
    setShowBotList(false);
  };

  const handleBackToList = () => {
    setSelectedBot(null);
    setShowBotList(true);
  };

  const handleShowBots = () => {
    setShowBotList(true);
  };

  if (selectedBot) {
    return (
      <div className="h-screen bg-gray-100">
        <MasterBotChat 
          masterbot={selectedBot} 
          onBack={handleBackToList}
        />
      </div>
    );
  }

  if (showBotList) {
    return (
      <div className="h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg h-full">
          <div className="flex items-center gap-3 p-4 border-b">
            <button
              onClick={() => setShowBotList(false)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Master Bots</h2>
          </div>
          <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
            <MasterBotList onSelectBot={handleSelectBot} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8 text-center">
        <Bot className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Master Bot Integration Test
        </h1>
        <p className="text-gray-600 mb-8">
          Test the AI Master Bot chat functionality. Chat with food experts powered by AI!
        </p>
        <div className="space-y-4">
          <button
            onClick={handleShowBots}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Bot className="w-5 h-5" />
            Chat with Master Bots
          </button>
          <button
            onClick={() => window.location.href = '/chat'}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Full Chat Interface
          </button>
        </div>
        
        <div className="mt-8 text-left bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Available Master Bots:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>🌶️ Anika Kapoor - Spice Expert & Indian Cuisine</li>
            <li>🍷 Sebastian LeClair - Wine & Fine Dining</li>
            <li>☕ Omar Darzi - Coffee Culture & Brewing</li>
            <li>🧘 Jun Tanaka - Minimalist & Healthy Eating</li>
            <li>🌍 Aurelia Voss - Global Street Food</li>
            <li>🏔️ Rafael Mendez - Adventure Dining</li>
            <li>🌱 Lila Cheng - Plant-Based Food</li>
          </ul>
        </div>
      </div>
    </div>
  );
}