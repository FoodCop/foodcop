import React from 'react';
import { TrendingUp, MapPin, Camera, MessageCircle, ChefHat, Trophy } from 'lucide-react';

interface PointsTabProps {
  currentPoints: number;
}

interface PointsBreakdown {
  category: string;
  points: number;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

export function PointsTab({ currentPoints }: PointsTabProps) {
  const pointsBreakdown: PointsBreakdown[] = [
    {
      category: 'Restaurant Visits',
      points: 1240,
      icon: MapPin,
      color: '#F14C35',
      description: '62 places discovered'
    },
    {
      category: 'Photo Sharing',
      points: 680,
      icon: Camera,
      color: '#FFD74A',
      description: '34 photos uploaded'
    },
    {
      category: 'Reviews Written',
      points: 420,
      icon: MessageCircle,
      color: '#A6471E',
      description: '21 detailed reviews'
    },
    {
      category: 'Recipe Tries',
      points: 320,
      icon: ChefHat,
      color: '#0B1F3A',
      description: '16 recipes attempted'
    },
    {
      category: 'Social Activity',
      points: 187,
      icon: Trophy,
      color: '#F14C35',
      description: 'Likes, shares & interactions'
    }
  ];

  const recentActivity = [
    { action: 'Visited Ramen Takeshi', points: 25, time: '2 hours ago', icon: MapPin },
    { action: 'Uploaded pasta photo', points: 15, time: '5 hours ago', icon: Camera },
    { action: 'Reviewed Verde Pizza', points: 30, time: '1 day ago', icon: MessageCircle },
    { action: 'Saved spicy ramen recipe', points: 10, time: '2 days ago', icon: ChefHat },
    { action: 'Friend liked your photo', points: 5, time: '3 days ago', icon: Trophy }
  ];

  const getPointsLevel = (points: number) => {
    if (points >= 5000) return { level: 'Master', color: '#0B1F3A' };
    if (points >= 2500) return { level: 'Expert', color: '#F14C35' };
    if (points >= 1000) return { level: 'Explorer', color: '#A6471E' };
    return { level: 'Beginner', color: '#FFD74A' };
  };

  const userLevel = getPointsLevel(currentPoints);
  const nextLevelThreshold = currentPoints >= 5000 ? 10000 : currentPoints >= 2500 ? 5000 : currentPoints >= 1000 ? 2500 : 1000;
  const progressToNext = (currentPoints / nextLevelThreshold) * 100;

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <div className="text-center bg-gradient-to-br from-[#F14C35] to-[#A6471E] rounded-2xl p-6 text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold mb-2">{currentPoints.toLocaleString()}</h2>
        <p className="text-white/80 mb-4">Total Points Earned</p>
        
        <div className="bg-white/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Level: {userLevel.level}</span>
            <span className="text-sm">{Math.round(progressToNext)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/70 mt-2">
            {nextLevelThreshold - currentPoints} points to next level
          </p>
        </div>
      </div>

      {/* Points Breakdown */}
      <div>
        <h3 className="font-semibold text-[#0B1F3A] mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-[#F14C35]" />
          <span>Points Breakdown</span>
        </h3>
        
        <div className="space-y-3">
          {pointsBreakdown.map((item, index) => {
            const IconComponent = item.icon;
            const percentage = (item.points / currentPoints) * 100;
            
            return (
              <div key={item.category} className="bg-[#F8F9FA] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <IconComponent 
                        className="w-5 h-5"
                        style={{ color: item.color }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#0B1F3A]">{item.category}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0B1F3A]">{item.points}</p>
                    <p className="text-xs text-gray-500">{Math.round(percentage)}%</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-semibold text-[#0B1F3A] mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => {
            const IconComponent = activity.icon;
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#F14C35]/10 rounded-full flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-[#F14C35]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0B1F3A]">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#F14C35]">+{activity.points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points Tips */}
      <div className="bg-gradient-to-r from-[#FFD74A]/20 to-[#F14C35]/20 rounded-xl p-4">
        <h3 className="font-semibold text-[#0B1F3A] mb-3 flex items-center space-x-2">
          <span className="text-lg">🐙</span>
          <span>Tako's Points Tips</span>
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <span>📍</span>
            <p><strong>Visit new places</strong> - Earn 25 points for each new restaurant discovery</p>
          </div>
          <div className="flex items-start space-x-2">
            <span>📸</span>
            <p><strong>Share photos</strong> - Upload food pics to earn 10-20 points based on engagement</p>
          </div>
          <div className="flex items-start space-x-2">
            <span>✍️</span>
            <p><strong>Write detailed reviews</strong> - Quality reviews earn up to 30 points</p>
          </div>
          <div className="flex items-start space-x-2">
            <span>👥</span>
            <p><strong>Engage socially</strong> - Like, comment, and share to earn bonus points</p>
          </div>
        </div>
      </div>

      {/* Monthly Progress */}
      <div className="bg-[#F8F9FA] rounded-xl p-4">
        <h3 className="font-semibold text-[#0B1F3A] mb-3">This Month</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">347</p>
            <p className="text-xs text-gray-600">Points Earned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">12</p>
            <p className="text-xs text-gray-600">Places Visited</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">8</p>
            <p className="text-xs text-gray-600">Photos Shared</p>
          </div>
        </div>
      </div>
    </div>
  );
}
