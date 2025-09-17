import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, UserPlus, Share2, MoreHorizontal, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { mockFriendProfiles, Friend } from './constants/profileData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { FriendPlateTab } from './friend/FriendPlateTab';
import { FriendPhotosTab } from './friend/FriendPhotosTab';
import { FriendReviewsTab } from './friend/FriendReviewsTab';
import { FriendRewardsTab } from './friend/FriendRewardsTab';

type FriendTab = 'plate' | 'photos' | 'reviews' | 'rewards';

interface FriendDetailPageProps {
  friendId: string;
  onNavigateBack?: () => void;
}

export function FriendDetailPage({ friendId, onNavigateBack }: FriendDetailPageProps) {
  const [activeTab, setActiveTab] = useState<FriendTab>('plate');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const friend = mockFriendProfiles[friendId];
  
  if (!friend) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[#0B1F3A] mb-2">Friend not found</h2>
          <button 
            onClick={onNavigateBack}
            className="text-[#F14C35] hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'plate' as FriendTab, label: 'Plate', count: friend.savedPlaces.length },
    { id: 'photos' as FriendTab, label: 'Photos', count: friend.photos.length },
    { id: 'reviews' as FriendTab, label: 'Reviews', count: friend.reviews.length },
    { id: 'rewards' as FriendTab, label: 'Rewards', count: friend.badges.length }
  ];

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(`Check out ${friend.displayName}'s food profile on FUZO!`);
    // In real app, show toast notification
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'plate':
        return <FriendPlateTab savedPlaces={friend.savedPlaces} />;
      case 'photos':
        return <FriendPhotosTab photos={friend.photos} />;
      case 'reviews':
        return <FriendReviewsTab reviews={friend.reviews} />;
      case 'rewards':
        return <FriendRewardsTab badges={friend.badges} points={friend.points} />;
      default:
        return <FriendPlateTab savedPlaces={friend.savedPlaces} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F14C35]/5 to-[#A6471E]/5">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-8 left-8 text-3xl">🍜</div>
            <div className="absolute top-16 right-16 text-2xl">🍕</div>
            <div className="absolute bottom-16 left-16 text-2xl">🥗</div>
            <div className="absolute bottom-8 right-8 text-xl">⭐</div>
          </div>
        </div>

        <div className="relative z-10 p-6 pb-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={onNavigateBack}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
              >
                <MoreHorizontal className="w-5 h-5 text-[#0B1F3A]" />
              </button>
              
              {showMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[150px] z-20">
                  <button 
                    onClick={handleCopyProfile}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Profile</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm text-red-600">
                    <span>⚠️</span>
                    <span>Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <ImageWithFallback
                src={friend.avatar}
                alt={friend.displayName}
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
              />
              {/* Online Status */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full transform translate-x-1/2 translate-y-1/2"></div>
            </div>

            {/* Name & Handle */}
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">{friend.displayName}</h1>
              <p className="text-[#A6471E] font-medium">{friend.handle}</p>
            </div>

            {/* Bio */}
            <p className="text-gray-700 mb-4 max-w-sm mx-auto leading-relaxed">{friend.bio}</p>

            {/* Preferences */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {friend.preferences.map((preference) => (
                <span
                  key={preference}
                  className="px-3 py-1 bg-white/80 backdrop-blur-sm text-[#0B1F3A] rounded-full text-sm font-medium border border-gray-200"
                >
                  {preference}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">{friend.points}</p>
                <p className="text-sm text-gray-600">Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">{friend.mutualFriends}</p>
                <p className="text-sm text-gray-600">Mutual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">{friend.badges.length}</p>
                <p className="text-sm text-gray-600">Badges</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleFollowToggle}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                  isFollowing 
                    ? 'bg-gray-100 text-[#0B1F3A] border border-gray-200' 
                    : 'bg-[#F14C35] text-white hover:bg-[#E63E26]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isFollowing ? 'Following' : 'Follow'}</span>
              </button>
              
              <button className="px-6 py-3 bg-[#0B1F3A] text-white rounded-xl font-medium hover:bg-[#0B1F3A]/90 transition-colors flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#F14C35] text-[#F14C35]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-[#F14C35] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeFriendTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F14C35]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Menu Backdrop */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/20 z-10" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
