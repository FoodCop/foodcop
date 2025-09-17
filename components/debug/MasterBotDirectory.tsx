import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Users, Star, MapPin, Filter, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getAllMasterBots } from './constants/masterBotsData';
import { getAllPersonalities } from './constants/masterBotPersonalities';
import { MasterBotProfileSystem } from './MasterBotProfileSystem';
import { MasterBotChatSystem } from './MasterBotChatSystem';

interface MasterBotDirectoryProps {
  onClose?: () => void;
}

export function MasterBotDirectory({ onClose }: MasterBotDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [chatBot, setChatBot] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const bots = getAllMasterBots();
  const personalities = getAllPersonalities();

  // Get all unique specialties for filter
  const allSpecialties = Array.from(
    new Set(bots.flatMap(bot => bot.specialty))
  ).sort();

  // Filter bots based on search and specialty
  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.specialty.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || 
                            bot.specialty.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  const handleChatWithBot = (botId: string) => {
    setChatBot(botId);
  };

  const handleViewProfile = (botId: string) => {
    setSelectedBot(botId);
  };

  if (chatBot) {
    return (
      <MasterBotChatSystem 
        botId={chatBot} 
        onClose={() => setChatBot(null)}
      />
    );
  }

  if (selectedBot) {
    return (
      <MasterBotProfileSystem 
        botId={selectedBot} 
        onClose={() => setSelectedBot(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Master Bot League</h1>
            <p className="text-white/90 mt-1">
              Meet our expert food discovery bots - each with their own personality and expertise
            </p>
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              ✕
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search bots by name, specialty, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white text-gray-900"
            />
          </div>
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="w-full sm:w-48 bg-white text-gray-900">
              <SelectValue placeholder="Filter by specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {allSpecialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredBots.length} bot{filteredBots.length !== 1 ? 's' : ''} found
            {selectedSpecialty !== 'all' && ` in ${selectedSpecialty}`}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Bot Cards */}
      <div className="p-6">
        {filteredBots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bots found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredBots.map((bot) => {
              const personality = personalities.find(p => p.id === bot.id);
              
              return (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}>
                    {/* Cover/Avatar */}
                    <div className={`relative ${
                      viewMode === 'list' 
                        ? 'w-48 flex-shrink-0' 
                        : 'h-32'
                    }`}>
                      <div className={`bg-gradient-to-r from-[#F14C35] to-[#A6471E] ${
                        viewMode === 'list' ? 'h-full' : 'h-full'
                      }`}>
                        {bot.coverImage && (
                          <img 
                            src={bot.coverImage} 
                            alt={`${bot.name} cover`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-20" />
                      </div>
                      <Avatar className={`absolute border-4 border-white ${
                        viewMode === 'list' 
                          ? 'w-16 h-16 bottom-4 left-4' 
                          : 'w-20 h-20 bottom-0 left-4 transform translate-y-1/2'
                      }`}>
                        <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
                      </Avatar>
                    </div>

                    {/* Content */}
                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : 'pt-12'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-[#0B1F3A] text-lg">{bot.name}</h3>
                          <p className="text-[#A6471E] text-sm font-medium">{bot.username}</p>
                          {bot.nickname && (
                            <p className="text-gray-600 text-xs">"{bot.nickname}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-[#FFD74A]">
                            <Star className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{bot.stats.points}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{bot.bio}</p>

                      {/* Personality Preview */}
                      {personality && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-600 mb-1">Conversation Style:</p>
                          <p className="text-xs text-gray-800">{personality.conversationStyle.tone}</p>
                        </div>
                      )}

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {bot.specialty.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs bg-[#FFD74A] text-[#0B1F3A]">
                            {spec}
                          </Badge>
                        ))}
                        {bot.specialty.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{bot.specialty.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center text-xs text-gray-600 mb-4 space-x-3">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{bot.stats.followers.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{bot.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          <span>{bot.stats.discoveries}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleChatWithBot(bot.id)}
                          size="sm"
                          className="flex-1 bg-[#F14C35] hover:bg-[#E03A28] text-white text-xs"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Chat
                        </Button>
                        <Button 
                          onClick={() => handleViewProfile(bot.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-[#F14C35] text-[#F14C35] hover:bg-[#F14C35] hover:text-white text-xs"
                        >
                          Profile
                        </Button>
                      </div>

                      {/* Personality Traits Preview */}
                      {personality && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-600 mb-1">Personality:</p>
                          <div className="flex flex-wrap gap-1">
                            {personality.personalityTraits.slice(0, 4).map((trait) => (
                              <span 
                                key={trait}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                              >
                                {trait}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 p-6 rounded-b-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#F14C35]">{bots.length}</div>
            <div className="text-sm text-gray-600">Expert Bots</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#A6471E]">{allSpecialties.length}</div>
            <div className="text-sm text-gray-600">Specialties</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#FFD74A]">
              {bots.reduce((sum, bot) => sum + bot.stats.discoveries, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Discoveries</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0B1F3A]">
              {bots.reduce((sum, bot) => sum + bot.stats.followers, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Combined Followers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
