'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Loader2, ArrowRight, Star } from 'lucide-react';

interface MasterBot {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string;
}

interface MasterBotListProps {
  onSelectBot: (bot: MasterBot) => void;
}

export default function MasterBotList({ onSelectBot }: MasterBotListProps) {
  const [bots, setBots] = useState<MasterBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMasterBots();
  }, []);

  const loadMasterBots = async () => {
    try {
      setIsLoading(true);
      
      // Get master bots from our predefined list
      const masterBotUsernames = [
        'spice_scholar_anika',
        'sommelier_seb', 
        'coffee_pilgrim_omar',
        'zen_minimalist_jun',
        'nomad_aurelia',
        'adventure_rafa',
        'plant_pioneer_lila'
      ];

      // In a real app, this could be an API call to get all master bots
      // For now, we'll create the bot objects from the usernames
      const masterBots: MasterBot[] = [
        {
          id: 'f2e517b0-7dd2-4534-a678-5b64d4795b3a',
          username: 'spice_scholar_anika',
          display_name: 'Anika Kapoor',
          email: 'anika@fuzo.ai',
        },
        {
          id: '78de3261-040d-492e-b511-50f71c0d9986',
          username: 'sommelier_seb',
          display_name: 'Sebastian LeClair',
          email: 'sebastian@fuzo.ai',
        },
        {
          id: '0a1092da-dea6-4d32-ac2b-fe50a31beae3',
          username: 'coffee_pilgrim_omar',
          display_name: 'Omar Darzi',
          email: 'omar@fuzo.ai',
        },
        {
          id: '7cb0c0d0-996e-4afc-9c7a-95ed0152f63e',
          username: 'zen_minimalist_jun',
          display_name: 'Jun Tanaka',
          email: 'jun@fuzo.ai',
        },
        {
          id: '1b0f0628-295d-4a4a-85ca-48594eee15b3',
          username: 'nomad_aurelia',
          display_name: 'Aurelia Voss',
          email: 'aurelia@fuzo.ai',
        },
        {
          id: '86efa684-37ae-49bb-8e7c-2c0829aa6474',
          username: 'adventure_rafa',
          display_name: 'Rafael Mendez',
          email: 'rafael@fuzo.ai',
        },
        {
          id: '2400b343-0e89-43f7-b3dc-6883fa486da3',
          username: 'plant_pioneer_lila',
          display_name: 'Lila Cheng',
          email: 'lila@fuzo.ai',
        }
      ];

      setBots(masterBots);
    } catch (error) {
      console.error('Error loading master bots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBotSpecialty = (username: string) => {
    const specialties = {
      'spice_scholar_anika': 'Spice Expert & Indian Cuisine',
      'sommelier_seb': 'Wine & Fine Dining',
      'coffee_pilgrim_omar': 'Coffee Culture & Brewing',
      'zen_minimalist_jun': 'Minimalist & Healthy Eating',
      'nomad_aurelia': 'Global Street Food',
      'adventure_rafa': 'Adventure Dining & Travel Food',
      'plant_pioneer_lila': 'Plant-Based & Sustainable Food'
    };
    return specialties[username as keyof typeof specialties] || 'Food Expert';
  };

  const getBotEmoji = (username: string) => {
    const emojis = {
      'spice_scholar_anika': '🌶️',
      'sommelier_seb': '🍷',
      'coffee_pilgrim_omar': '☕',
      'zen_minimalist_jun': '🧘',
      'nomad_aurelia': '🌍',
      'adventure_rafa': '🏔️',
      'plant_pioneer_lila': '🌱'
    };
    return emojis[username as keyof typeof emojis] || '🤖';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-4">
        <Bot className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-semibold text-gray-900">AI Master Bots</h3>
          <p className="text-sm text-gray-600">Chat with food experts powered by AI</p>
        </div>
      </div>

      {bots.map((bot) => (
        <div
          key={bot.id}
          onClick={() => onSelectBot(bot)}
          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg">
              {getBotEmoji(bot.username)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900 truncate">{bot.display_name}</h4>
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
            <p className="text-sm text-gray-600 truncate">{getBotSpecialty(bot.username)}</p>
            <p className="text-xs text-gray-400">@{bot.username}</p>
          </div>
          
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      ))}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">About Master Bots</h4>
        <p className="text-sm text-blue-700">
          Our AI Master Bots are culinary experts with unique personalities and specialties. 
          They can help you with recipes, restaurant recommendations, food pairing, and more!
        </p>
      </div>
    </div>
  );
}