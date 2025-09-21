import React from 'react';
import { Trophy, Lock, Star, Progress } from 'lucide-react';
import { Badge } from '../constants/profileData';
import { motion } from 'framer-motion';

interface RewardsTabProps {
  badges: Badge[];
  currentPoints: number;
}

export function RewardsTab({ badges, currentPoints }: RewardsTabProps) {
  const unlockedBadges = badges.filter(badge => badge.isUnlocked);
  const lockedBadges = badges.filter(badge => !badge.isUnlocked);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getNextMilestone = () => {
    const milestones = [1000, 2500, 5000, 10000];
    return milestones.find(milestone => milestone > currentPoints) || 10000;
  };

  const nextMilestone = getNextMilestone();
  const progressToNext = Math.min((currentPoints / nextMilestone) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#F14C35] to-[#A6471E] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-[#0B1F3A] mb-1">Achievements</h2>
        <p className="text-sm text-gray-600">Your food exploration journey</p>
      </div>

      {/* Tako Mascot Message */}
      <div className="bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 rounded-xl p-4 relative">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">🐙</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0B1F3A] mb-1">Keep exploring, foodie!</p>
            <p className="text-xs text-gray-600">
              You're {nextMilestone - currentPoints} points away from your next big achievement!
            </p>
          </div>
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="bg-[#F8F9FA] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#0B1F3A]">Progress to {nextMilestone} points</span>
          <span className="text-sm text-gray-600">{Math.round(progressToNext)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] h-2 rounded-full"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {currentPoints} / {nextMilestone} points
        </p>
      </div>

      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
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
                    <p className="text-xs text-[#F14C35] font-medium">Unlocked</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="font-medium text-[#0B1F3A] mb-4 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <span>Upcoming Badges ({lockedBadges.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {lockedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (unlockedBadges.length + index) * 0.1 }}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-gray-200 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-400 mb-1">{badge.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{badge.description}</p>
                    <p className="text-xs text-gray-400">Keep exploring to unlock!</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-1">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium">Locked</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Stats */}
      <div className="bg-[#F8F9FA] rounded-xl p-4">
        <h3 className="font-medium text-[#0B1F3A] mb-3">Achievement Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{unlockedBadges.length}</p>
            <p className="text-xs text-gray-600">Earned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{lockedBadges.length}</p>
            <p className="text-xs text-gray-600">Remaining</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">
              {Math.round((unlockedBadges.length / badges.length) * 100)}%
            </p>
            <p className="text-xs text-gray-600">Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}
