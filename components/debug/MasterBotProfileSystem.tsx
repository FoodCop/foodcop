import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Heart, Star, MapPin, Calendar, Users, Award, Coffee, Camera, Book } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getMasterBotById } from './constants/masterBotsData';
import { getBotPersonality } from './constants/masterBotPersonalities';
import { MasterBotChatSystem } from './MasterBotChatSystem';

interface MasterBotProfileSystemProps {
  botId: string;
  onClose?: () => void;
}

export function MasterBotProfileSystem({ botId, onClose }: MasterBotProfileSystemProps) {
  const [activeTab, setActiveTab] = useState('about');
  const [showChat, setShowChat] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const bot = getMasterBotById(botId);
  const personality = getBotPersonality(botId);

  if (!bot || !personality) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Bot profile not found.</p>
      </Card>
    );
  }

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // In a real app, this would make an API call
  };

  if (showChat) {
    return (
      <MasterBotChatSystem 
        botId={botId} 
        onClose={() => setShowChat(false)}
        initialMessage="Hi! I'd love to learn more about your food experiences!"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-[#F14C35] to-[#A6471E]">
        {bot.coverImage && (
          <img 
            src={bot.coverImage} 
            alt={`${bot.name} cover`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-4">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
            <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
          </Avatar>
          
          <div className="flex-1 sm:ml-6 mt-4 sm:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1F3A]">{bot.name}</h1>
                <p className="text-[#A6471E] font-medium">{bot.username}</p>
                {bot.nickname && (
                  <p className="text-gray-600 text-sm">"{bot.nickname}"</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                <Button 
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className={isFollowing ? "" : "bg-[#F14C35] hover:bg-[#E03A28] text-white"}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button 
                  onClick={handleStartChat}
                  variant="outline"
                  className="border-[#F14C35] text-[#F14C35] hover:bg-[#F14C35] hover:text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-gray-700 mb-4">{bot.bio}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 mb-4">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-[#FFD74A]" />
            <span className="text-sm font-medium">{bot.stats.discoveries} discoveries</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm">{bot.stats.followers.toLocaleString()} followers</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-sm">{bot.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Joined {new Date(bot.joinedDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-6">
          {bot.specialty.map((spec) => (
            <Badge key={spec} variant="secondary" className="bg-[#FFD74A] text-[#0B1F3A]">
              {spec}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="plate">Plate</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-6 space-y-6">
          {/* Personality Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F3A] mb-4 flex items-center">
              <Coffee className="w-5 h-5 mr-2" />
              Personality & Style
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Conversation Style</h4>
                <p className="text-sm text-gray-600 mb-2">{personality.conversationStyle.tone}</p>
                <div className="flex flex-wrap gap-1">
                  {personality.personalityTraits.map((trait) => (
                    <Badge key={trait} variant="outline" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Communication</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Response style:</span> {personality.socialBehavior.response_speed}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Message length:</span> {personality.conversationStyle.message_length}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Formality:</span> {personality.conversationStyle.formality}
                </p>
              </div>
            </div>
          </Card>

          {/* Backstory */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F3A] mb-4 flex items-center">
              <Book className="w-5 h-5 mr-2" />
              Personal Story
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Childhood Food Memory</h4>
                <p className="text-sm text-gray-600">{personality.backstory.childhood_food_memory}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Biggest Food Adventure</h4>
                <p className="text-sm text-gray-600">{personality.backstory.biggest_food_adventure}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Cooking Philosophy</h4>
                <p className="text-sm text-gray-600">{personality.backstory.cooking_philosophy}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Life Motto</h4>
                <p className="text-sm text-gray-600 italic">"{personality.backstory.life_motto}"</p>
              </div>
            </div>
          </Card>

          {/* Expertise */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F3A] mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Expertise & Interests
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Can Help With</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {personality.expertise.can_help_with.map((item) => (
                    <li key={item} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-[#F14C35] rounded-full mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Favorite Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {personality.expertise.favorite_conversation_topics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Fun Facts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[#0B1F3A] mb-4">Fun Facts & Quirks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Fun Facts</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {personality.quirks.fun_facts.map((fact, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-[#FFD74A] rounded-full mr-2" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Unexpected Interests</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {personality.quirks.unexpected_interests.map((interest, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-[#A6471E] rounded-full mr-2" />
                      {interest}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          <div className="space-y-4">
            {bot.recentPosts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-10 h-10">
                    <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-[#0B1F3A]">{bot.name}</h4>
                      <span className="text-sm text-gray-500">{bot.username}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    <p className="text-gray-700 mb-3">{post.content}</p>
                    {post.image && (
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plate" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bot.plateItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-[#0B1F3A] mb-1">{item.name}</h3>
                  {item.location && (
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {item.location}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {item.note && (
                    <p className="text-sm text-gray-700 italic">"{item.note}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Saved {new Date(item.savedDate).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bot.badges.map((badge) => (
              <Card key={badge.id} className="p-6 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
                  style={{ backgroundColor: badge.color + '20' }}
                >
                  {badge.icon}
                </div>
                <h3 className="font-semibold text-[#0B1F3A] mb-2">{badge.name}</h3>
                <p className="text-sm text-gray-600">{badge.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-6 border-t border-gray-200">
        <div className="flex justify-center">
          <Button 
            onClick={handleStartChat}
            className="bg-[#F14C35] hover:bg-[#E03A28] text-white px-8"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Conversation with {bot.name}
          </Button>
        </div>
      </div>
    </div>
  );
}
