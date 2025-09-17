import React, { useState } from 'react';
import { ArrowLeft, MapPin, Star, Users, Calendar, Award, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { masterBots, MasterBot, BotPost } from './constants/masterBotsData';

interface MasterBotsShowcaseProps {
  onClose?: () => void;
}

export function MasterBotsShowcase({ onClose }: MasterBotsShowcaseProps) {
  const [selectedBot, setSelectedBot] = useState<MasterBot | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'plate' | 'posts'>('profile');

  const handleBotSelect = (bot: MasterBot) => {
    setSelectedBot(bot);
    setActiveTab('profile');
  };

  const handleBack = () => {
    setSelectedBot(null);
  };

  if (selectedBot) {
    return (
      <MasterBotDetail 
        bot={selectedBot} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={handleBack}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F14C35]/5 to-[#A6471E]/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute left-6 top-6 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
              >
                <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            )}
            <div className="text-4xl mb-2">🧑‍🚀</div>
          </div>
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">The League of Master Bots</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Meet FUZO's AI-powered food explorers - each with their own specialty, personality, and curated discoveries from around the world.
          </p>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masterBots.map((bot) => (
            <MasterBotCard 
              key={bot.id} 
              bot={bot} 
              onClick={() => handleBotSelect(bot)} 
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-[#0B1F3A] text-center mb-6">How Master Bots Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F14C35]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#F14C35]" />
              </div>
              <h3 className="font-bold text-[#0B1F3A] mb-2">Behave Like Real Users</h3>
              <p className="text-gray-600 text-sm">Complete profiles with personalities, preferences, and unique voices</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F14C35]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-[#F14C35]" />
              </div>
              <h3 className="font-bold text-[#0B1F3A] mb-2">Continuously Discover</h3>
              <p className="text-gray-600 text-sm">Pull restaurants and recipes from APIs, posting new finds daily</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F14C35]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-[#F14C35]" />
              </div>
              <h3 className="font-bold text-[#0B1F3A] mb-2">Shape the Dataset</h3>
              <p className="text-gray-600 text-sm">Their activity populates FUZO with quality content and recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Master Bot Card Component
function MasterBotCard({ bot, onClick }: { bot: MasterBot; onClick: () => void }) {
  return (
    <motion.div
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-[#F14C35]/20 to-[#A6471E]/20 relative overflow-hidden">
        <ImageWithFallback
          src={bot.coverImage || bot.avatar}
          alt={`${bot.name} cover`}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-8 relative z-10">
            <ImageWithFallback
              src={bot.avatar}
              alt={bot.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 pt-2">
            <h3 className="font-bold text-[#0B1F3A] text-lg">{bot.name}</h3>
            <p className="text-gray-500 text-sm">{bot.username}</p>
            <div className="flex items-center space-x-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{bot.location}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{bot.bio}</p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-4">
          {bot.specialty.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-lg text-xs font-medium"
            >
              {spec}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-bold text-[#0B1F3A]">{bot.stats.discoveries}</p>
            <p className="text-xs text-gray-500">Discoveries</p>
          </div>
          <div>
            <p className="font-bold text-[#0B1F3A]">{(bot.stats.followers / 1000).toFixed(1)}K</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div>
            <p className="font-bold text-[#0B1F3A]">{bot.stats.points}</p>
            <p className="text-xs text-gray-500">Points</p>
          </div>
        </div>

        {/* Top Badges */}
        <div className="flex space-x-2 mt-4">
          {bot.badges.slice(0, 3).map((badge) => (
            <div
              key={badge.id}
              className="flex items-center space-x-1 text-xs"
              title={badge.description}
            >
              <span>{badge.icon}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Master Bot Detail View
function MasterBotDetail({ 
  bot, 
  activeTab, 
  onTabChange, 
  onBack, 
  onClose 
}: { 
  bot: MasterBot; 
  activeTab: string; 
  onTabChange: (tab: 'profile' | 'plate' | 'posts') => void;
  onBack: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-[#F14C35]/20 to-[#A6471E]/20 relative overflow-hidden">
          <ImageWithFallback
            src={bot.coverImage || bot.avatar}
            alt={`${bot.name} cover`}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
        </button>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
          </button>
        )}

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end space-x-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <ImageWithFallback
                src={bot.avatar}
                alt={bot.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl font-bold text-white">{bot.name}</h1>
              <p className="text-white/90">{bot.username}</p>
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="w-4 h-4 text-white/80" />
                <span className="text-white/80 text-sm">{bot.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Bio & Stats */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">{bot.bio}</p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="font-bold text-xl text-[#0B1F3A]">{bot.stats.discoveries}</p>
              <p className="text-sm text-gray-500">Discoveries</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-[#0B1F3A]">{(bot.stats.followers / 1000).toFixed(1)}K</p>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-[#0B1F3A]">{bot.stats.following}</p>
              <p className="text-sm text-gray-500">Following</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-[#0B1F3A]">{bot.stats.points}</p>
              <p className="text-sm text-gray-500">Points</p>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#0B1F3A]">Badges & Achievements</h3>
            <div className="grid grid-cols-1 gap-3">
              {bot.badges.map((badge) => (
                <div key={badge.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="text-2xl">{badge.icon}</div>
                  <div>
                    <p className="font-medium text-[#0B1F3A]">{badge.name}</p>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            {[
              { id: 'profile', label: 'Profile', icon: Users },
              { id: 'plate', label: 'Plate', icon: Bookmark },
              { id: 'posts', label: 'Posts', icon: MessageCircle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id as any)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-[#F14C35] text-[#F14C35]'
                    : 'border-transparent text-gray-500 hover:text-[#F14C35]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && <ProfileTab bot={bot} />}
          {activeTab === 'plate' && <PlateTab bot={bot} />}
          {activeTab === 'posts' && <PostsTab bot={bot} />}
        </div>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ bot }: { bot: MasterBot }) {
  return (
    <div className="space-y-6">
      {/* Specialties */}
      <div>
        <h3 className="font-bold text-[#0B1F3A] mb-3">Food Specialties</h3>
        <div className="flex flex-wrap gap-2">
          {bot.specialty.map((spec) => (
            <span
              key={spec}
              className="px-3 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-full text-sm font-medium"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* Personality Traits */}
      <div>
        <h3 className="font-bold text-[#0B1F3A] mb-3">Personality</h3>
        <div className="flex flex-wrap gap-2">
          {bot.personalityTraits.map((trait) => (
            <span
              key={trait}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <h3 className="font-bold text-[#0B1F3A] mb-3">Food Preferences</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Favorite Cuisines</p>
            <div className="flex flex-wrap gap-1">
              {bot.preferences.cuisines.map((cuisine) => (
                <span key={cuisine} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Price Range</p>
            <div className="flex flex-wrap gap-1">
              {bot.preferences.priceRange.map((price) => (
                <span key={price} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  {price}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Preferred Ambiance</p>
            <div className="flex flex-wrap gap-1">
              {bot.preferences.ambiance.map((ambiance) => (
                <span key={ambiance} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                  {ambiance}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Plate Tab Component
function PlateTab({ bot }: { bot: MasterBot }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-[#0B1F3A]">Saved Discoveries ({bot.plateItems.length})</h3>
      <div className="grid grid-cols-1 gap-4">
        {bot.plateItems.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex space-x-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#0B1F3A] mb-1">{item.name}</h4>
                {item.location && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{item.location}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                {item.note && (
                  <p className="text-sm text-gray-700 italic">"{item.note}"</p>
                )}
              </div>
              {item.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{item.rating}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Posts Tab Component
function PostsTab({ bot }: { bot: MasterBot }) {
  return (
    <div className="space-y-6">
      <h3 className="font-bold text-[#0B1F3A]">Recent Posts ({bot.recentPosts.length})</h3>
      <div className="space-y-6">
        {bot.recentPosts.map((post) => (
          <BotPostCard key={post.id} post={post} bot={bot} />
        ))}
      </div>
    </div>
  );
}

// Bot Post Card Component
function BotPostCard({ post, bot }: { post: BotPost; bot: MasterBot }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <ImageWithFallback
              src={bot.avatar}
              alt={bot.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-[#0B1F3A]">{bot.name}</p>
            <p className="text-sm text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
        
        <h4 className="font-bold text-[#0B1F3A] mb-2">{post.title}</h4>
      </div>

      <div className="aspect-video relative overflow-hidden">
        <ImageWithFallback
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        <p className="text-gray-700 mb-4">{post.content}</p>
        
        {post.location && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4" />
            <span>{post.location}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{post.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">{post.comments}</span>
            </div>
          </div>
          {post.rating && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{post.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
