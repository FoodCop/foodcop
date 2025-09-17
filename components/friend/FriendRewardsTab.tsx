import React from 'react';
import { Trophy, Award, Star } from 'lucide-react';
import { Badge } from '../constants/profileData';
import { motion } from 'framer-motion';

interface FriendRewardsTabProps {
  badges: Badge[];
  points: number;
}

export function FriendRewardsTab({ badges, points }: FriendRewardsTabProps) {
  const unlockedBadges = badges.filter(badge => badge.isUnlocked);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPointsLevel = (points: number) => {
    if (points >= 5000) return { level: 'Master', color: '#0B1F3A' };
    if (points >= 2500) return { level: 'Expert', color: '#F14C35' };
    if (points >= 1000) return { level: 'Explorer', color: '#A6471E' };
    return { level: 'Beginner', color: '#FFD74A' };
  };

  const userLevel = getPointsLevel(points);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#F14C35] to-[#A6471E] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-[#0B1F3A] mb-1">Achievements</h2>
        <p className="text-sm text-gray-600">Their food exploration journey</p>
      </div>

      {/* Points Display */}
      <div className="text-center bg-gradient-to-br from-[#F14C35] to-[#A6471E] rounded-2xl p-6 text-white">
        <h3 className="text-3xl font-bold mb-2">{points.toLocaleString()}</h3>
        <p className="text-white/80 mb-3">Total Points Earned</p>
        
        <div className="bg-white/20 rounded-xl p-3">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Award className="w-5 h-5" />
            <span className="font-medium">Level: {userLevel.level}</span>
          </div>
          <p className="text-sm text-white/80">Foodie achievement level</p>
        </div>
      </div>

      {/* Badges */}
      {unlockedBadges.length > 0 ? (
        <div>
          <h3 className="font-medium text-[#0B1F3A] mb-4 flex items-center space-x-2">
            <Star className="w-4 h-4 text-[#F14C35]" />
            <span>Earned Badges ({unlockedBadges.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {unlockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border-2 border-[#F14C35]/20 rounded-xl p-4 relative overflow-hidden"
              >
                {/* Shine Effect */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-full -mr-8 -mt-8" />
                
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm"
                    style={{ backgroundColor: `${badge.color}20`, border: `2px solid ${badge.color}` }}
                  >
                    {badge.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#0B1F3A] mb-1">{badge.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                    <p className="text-xs text-gray-500">Earned {formatDate(badge.earnedAt)}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#F14C35] to-[#A6471E] rounded-full flex items-center justify-center mb-1">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-[#F14C35] font-medium">Earned</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* No Badges Yet */
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">No badges earned yet</h3>
          <p className="text-gray-600">They're just getting started on their food journey!</p>
        </div>
      )}

      {/* Achievement Stats */}
      <div className="bg-[#F8F9FA] rounded-xl p-4">
        <h3 className="font-medium text-[#0B1F3A] mb-3">Achievement Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{unlockedBadges.length}</p>
            <p className="text-xs text-gray-600">Badges Earned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{points}</p>
            <p className="text-xs text-gray-600">Total Points</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{userLevel.level}</p>
            <p className="text-xs text-gray-600">Current Level</p>
          </div>
        </div>
      </div>

      {/* Inspiration Message */}
      <div className="bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 rounded-xl p-4 border border-[#F14C35]/20">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🎯</div>
          <div>
            <h4 className="font-medium text-[#0B1F3A] mb-1">Get Inspired</h4>
            <p className="text-sm text-gray-600">
              {unlockedBadges.length > 0 
                ? "See what achievements you can unlock by exploring like they do!"
                : "Follow their food journey and discover new ways to earn points and badges!"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Prompt (if friend has achievements) */}
      {unlockedBadges.length > 0 && (
        <div className="bg-white border border-[#F14C35]/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#F14C35]/10 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#F14C35]" />
              </div>
              <div>
                <h4 className="font-medium text-[#0B1F3A]">Challenge Yourself</h4>
                <p className="text-sm text-gray-600">Can you earn the same badges?</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[#F14C35] text-white rounded-lg font-medium hover:bg-[#E63E26] transition-colors text-sm">
              View My Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
