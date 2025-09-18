import React, { useState } from 'react';
import { ArrowLeft, Edit, Settings, LogOut, Users, Bookmark, Camera, Award, Star } from 'lucide-react';
import { motion } from 'framer-motion';
// Removed mock data import - using only real user data
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { CrewTab } from './profile/CrewTab';
import { PlateTab } from './profile/PlateTab';
import { PhotosTab } from './profile/PhotosTab';
import { RewardsTab } from './profile/RewardsTab';
import { PointsTab } from './profile/PointsTab';

type ProfileTab = 'crew' | 'plate' | 'photos' | 'rewards' | 'points';

interface ProfilePageProps {
  onNavigateBack?: () => void;
  onNavigateToFriend?: (friendId: string) => void;
}

export function ProfilePage({ onNavigateBack, onNavigateToFriend }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('crew');
  const [isEditing, setIsEditing] = useState(false);
  const { user, profile, signOut, updateProfile } = useAuth();
  
  // Use only real profile data from context
  const userProfile = {
    id: user?.id || "new_user",
    displayName: profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "FUZO User",
    handle: `@${profile?.username || user?.email?.split('@')[0] || 'user'}`,
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
    email: profile?.email || user?.email || '',
    bio: profile?.bio || '',
    location: [profile?.location_city, profile?.location_state, profile?.location_country].filter(Boolean).join(', ') || '',
    preferences: [...(profile?.dietary_preferences || []), ...(profile?.cuisine_preferences || [])],
    points: profile?.total_points || 0,
    // Fresh profile data - no mock data
    crew: [],
    savedPlaces: [],
    savedRecipes: [],
    photos: [],
    badges: [],
    achievements: []
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 User signing out...')
      await signOut()
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  const handleProfileUpdate = async (updates: any) => {
    try {
      console.log('📝 Updating profile from UI...', updates)
      await updateProfile(updates)
    } catch (error) {
      console.error('❌ Profile update error:', error)
      // TODO: Show error toast
    }
  }

  const tabs = [
    { id: 'crew' as ProfileTab, label: 'Crew', icon: Users, count: 0 }, // Will be loaded from backend
    { id: 'plate' as ProfileTab, label: 'Plate', icon: Bookmark, count: 0 }, // Will be loaded from backend
    { id: 'photos' as ProfileTab, label: 'Photos', icon: Camera, count: 0 }, // Will be loaded from backend
    { id: 'rewards' as ProfileTab, label: 'Rewards', icon: Award, count: 0 }, // Will be loaded from backend
    { id: 'points' as ProfileTab, label: 'Points', icon: Star, count: userProfile.points }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'crew':
        return <CrewTab crew={userProfile.crew} onFriendClick={onNavigateToFriend} />;
      case 'plate':
        return <PlateTab savedPlaces={[]} savedRecipes={[]} />;
      case 'photos':
        return <PhotosTab photos={userProfile.photos} />;
      case 'rewards':
        return <RewardsTab badges={userProfile.badges} currentPoints={userProfile.points} />;
      case 'points':
        return <PointsTab currentPoints={userProfile.points} />;
      default:
        return <CrewTab crew={userProfile.crew} onFriendClick={onNavigateToFriend} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F14C35]/5 to-[#A6471E]/5">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-8 left-8 text-4xl">🍽️</div>
            <div className="absolute top-16 right-16 text-3xl">✨</div>
            <div className="absolute bottom-16 left-16 text-3xl">🎉</div>
            <div className="absolute bottom-8 right-8 text-2xl">🍕</div>
          </div>
        </div>

        <div className="relative z-10 p-6 pb-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            {onNavigateBack && (
              <button 
                onClick={onNavigateBack}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            )}
            <div className="flex space-x-2">
              <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200">
                <Settings className="w-5 h-5 text-[#0B1F3A]" />
              </button>
              <button 
                onClick={handleSignOut}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="relative">
                <ImageWithFallback
                  src={userProfile.avatar}
                  alt={userProfile.displayName}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                />
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-[#E63E26] transition-colors"
                  style={{ transform: 'translate(25%, 25%)' }}
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Name & Handle */}
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">{userProfile.displayName}</h1>
              <p className="text-[#A6471E] font-medium">{userProfile.handle}</p>
            </div>

            {/* Bio */}
            <p className="text-gray-700 mb-4 max-w-sm mx-auto leading-relaxed">{userProfile.bio}</p>

            {/* Preferences */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {userProfile.preferences.map((preference) => (
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
                <p className="text-2xl font-bold text-[#F14C35]">{userProfile.points}</p>
                <p className="text-sm text-gray-600">Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">{userProfile.crew.length}</p>
                <p className="text-sm text-gray-600">Crew</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">{userProfile.badges.filter(b => b.isUnlocked).length}</p>
                <p className="text-sm text-gray-600">Badges</p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 px-4 py-4 text-sm font-medium border-b-2 transition-colors relative ${
                  isActive
                    ? 'border-[#F14C35] text-[#F14C35]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="relative">
                    <IconComponent className="w-5 h-5" />
                    {tab.count > 0 && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#F14C35] text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {tab.count > 99 ? '99+' : tab.count}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
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
    </div>
  );
}
