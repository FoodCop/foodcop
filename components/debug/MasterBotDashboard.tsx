import React, { useState } from 'react';
import { ArrowLeft, Activity, TrendingUp, Users, MapPin, Calendar, Settings, Play, Pause, MoreVertical, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { masterBots, MasterBot } from './constants/masterBotsData';

interface MasterBotDashboardProps {
  onClose?: () => void;
}

export function MasterBotDashboard({ onClose }: MasterBotDashboardProps) {
  const [selectedBot, setSelectedBot] = useState<MasterBot | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');

  const dashboardStats = {
    totalPosts: masterBots.reduce((acc, bot) => acc + bot.recentPosts.length, 0),
    totalEngagement: masterBots.reduce((acc, bot) => acc + bot.stats.followers, 0),
    activeExplorers: masterBots.length,
    newDiscoveries: 24
  };

  if (selectedBot) {
    return (
      <BotDetailDashboard 
        bot={selectedBot} 
        onBack={() => setSelectedBot(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
              >
                <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-[#0B1F3A]">Master Bots Control Center</h1>
              <p className="text-gray-600">Manage AI-powered food explorer personas</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
              Deploy New Bot
            </button>
            <button className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
              <Settings className="w-5 h-5 text-[#0B1F3A]" />
            </button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#F14C35]/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#F14C35]" />
              </div>
              <span className="text-sm text-green-600 font-medium">+12% this week</span>
            </div>
            <h3 className="text-2xl font-bold text-[#0B1F3A] mb-1">{dashboardStats.totalPosts}</h3>
            <p className="text-gray-600 text-sm">Total Posts Generated</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+8% this week</span>
            </div>
            <h3 className="text-2xl font-bold text-[#0B1F3A] mb-1">{(dashboardStats.totalEngagement / 1000).toFixed(0)}K</h3>
            <p className="text-gray-600 text-sm">Total Followers</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">All active</span>
            </div>
            <h3 className="text-2xl font-bold text-[#0B1F3A] mb-1">{dashboardStats.activeExplorers}</h3>
            <p className="text-gray-600 text-sm">Active Explorers</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+15% today</span>
            </div>
            <h3 className="text-2xl font-bold text-[#0B1F3A] mb-1">{dashboardStats.newDiscoveries}</h3>
            <p className="text-gray-600 text-sm">New Discoveries</p>
          </div>
        </div>

        {/* Bots Grid */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0B1F3A]">Master Bot Fleet</h2>
              <div className="flex items-center space-x-3">
                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Learning</option>
                </select>
                <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20">
                  <option>All Specialties</option>
                  <option>Street Food</option>
                  <option>Fine Dining</option>
                  <option>Vegan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Explorer</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Specialty</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Performance</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Last Active</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {masterBots.map((bot, index) => (
                  <BotTableRow 
                    key={bot.id} 
                    bot={bot} 
                    onSelect={() => setSelectedBot(bot)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0B1F3A]">Recent Bot Activity</h2>
            <button className="px-4 py-2 text-[#F14C35] hover:bg-[#F14C35]/10 rounded-lg font-medium transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {masterBots.slice(0, 5).map((bot, index) => (
              <div key={bot.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <ImageWithFallback
                    src={bot.avatar}
                    alt={bot.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#0B1F3A]">
                    <span className="text-[#F14C35]">{bot.name}</span> discovered a new restaurant
                  </p>
                  <p className="text-sm text-gray-600">
                    {bot.recentPosts[0]?.title || 'Exploring new culinary experiences'} • 2 hours ago
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bot Table Row Component
function BotTableRow({ bot, onSelect }: { bot: MasterBot; onSelect: () => void }) {
  const [isActive, setIsActive] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const getPerformanceScore = () => {
    const baseScore = 85;
    const followerBonus = Math.min(bot.stats.followers / 1000, 10);
    const discoveryBonus = Math.min(bot.stats.discoveries / 100, 5);
    return Math.round(baseScore + followerBonus + discoveryBonus);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const performanceScore = getPerformanceScore();

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <ImageWithFallback
              src={bot.avatar}
              alt={bot.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <button
              onClick={onSelect}
              className="font-medium text-[#0B1F3A] hover:text-[#F14C35] transition-colors"
            >
              {bot.name}
            </button>
            <p className="text-sm text-gray-500">{bot.username}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex flex-wrap gap-1">
          {bot.specialty.slice(0, 2).map((spec) => (
            <span
              key={spec}
              className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-full text-xs font-medium"
            >
              {spec}
            </span>
          ))}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
            {isActive ? 'Active' : 'Paused'}
          </span>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center space-x-2">
          <div className={`text-lg font-bold ${getPerformanceColor(performanceScore)}`}>
            {performanceScore}%
          </div>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-current transition-all duration-300 ${getPerformanceColor(performanceScore)}`}
              style={{ width: `${performanceScore}%` }}
            />
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="text-sm text-gray-600">
          <p>2 hours ago</p>
          <p className="text-xs text-gray-400">Posted: {bot.recentPosts[0]?.title.substring(0, 20)}...</p>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isActive 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
            title={isActive ? 'Pause Bot' : 'Activate Bot'}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-32">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Edit</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Clone</button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Delete</button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// Bot Detail Dashboard Component
function BotDetailDashboard({ 
  bot, 
  onBack, 
  onClose 
}: { 
  bot: MasterBot; 
  onBack: () => void; 
  onClose?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <ImageWithFallback
                  src={bot.avatar}
                  alt={bot.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0B1F3A]">{bot.name}</h1>
                <p className="text-gray-600">{bot.username} • {bot.specialty.join(', ')}</p>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-[#F14C35] transition-colors"
            >
              Close Dashboard
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'activity', label: 'Activity Feed' },
              { id: 'settings', label: 'Settings' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-3 px-1 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-[#F14C35] text-[#F14C35]'
                    : 'border-transparent text-gray-500 hover:text-[#F14C35]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <BotOverviewTab bot={bot} />}
        {activeTab === 'activity' && <BotActivityTab bot={bot} />}
        {activeTab === 'settings' && <BotSettingsTab bot={bot} />}
      </div>
    </div>
  );
}

// Bot Overview Tab
function BotOverviewTab({ bot }: { bot: MasterBot }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Stats Cards */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0B1F3A]">Discoveries</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-[#0B1F3A] mb-2">{bot.stats.discoveries}</p>
            <p className="text-sm text-green-600">+12 this week</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0B1F3A]">Followers</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-[#0B1F3A] mb-2">{(bot.stats.followers / 1000).toFixed(1)}K</p>
            <p className="text-sm text-blue-600">+8% this month</p>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#0B1F3A] mb-4">Recent Posts</h3>
          <div className="space-y-4">
            {bot.recentPosts.map((post) => (
              <div key={post.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[#0B1F3A] mb-1">{post.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{post.likes} likes</span>
                    <span>{post.comments} comments</span>
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bot Info Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#0B1F3A] mb-4">Bot Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Location</p>
              <p className="font-medium text-[#0B1F3A]">{bot.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Joined</p>
              <p className="font-medium text-[#0B1F3A]">{new Date(bot.joinedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Points</p>
              <p className="font-medium text-[#0B1F3A]">{bot.stats.points}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#0B1F3A] mb-4">Specialties</h3>
          <div className="space-y-2">
            {bot.specialty.map((spec) => (
              <span
                key={spec}
                className="block px-3 py-2 bg-[#F14C35]/10 text-[#F14C35] rounded-lg text-sm font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-[#0B1F3A] mb-4">Badges</h3>
          <div className="space-y-3">
            {bot.badges.map((badge) => (
              <div key={badge.id} className="flex items-center space-x-3">
                <div className="text-xl">{badge.icon}</div>
                <div>
                  <p className="font-medium text-[#0B1F3A] text-sm">{badge.name}</p>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bot Activity Tab
function BotActivityTab({ bot }: { bot: MasterBot }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="font-bold text-[#0B1F3A] mb-6">Activity Timeline</h3>
      <div className="space-y-6">
        {bot.recentPosts.map((post, index) => (
          <div key={post.id} className="flex items-start space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              {index < bot.recentPosts.length - 1 && (
                <div className="w-0.5 h-16 bg-gray-200 mt-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-[#0B1F3A]">New Post Published</p>
                  <span className="text-sm text-gray-500">{new Date(post.timestamp).toLocaleString()}</span>
                </div>
                <h4 className="font-bold text-[#0B1F3A] mb-2">{post.title}</h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{post.likes} likes</span>
                  <span>{post.comments} comments</span>
                  <span>{post.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bot Settings Tab
function BotSettingsTab({ bot }: { bot: MasterBot }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-[#0B1F3A] mb-6">Bot Configuration</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Posting Frequency</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20">
              <option>Daily (Current)</option>
              <option>Every 2 days</option>
              <option>Weekly</option>
              <option>Custom schedule</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Types</label>
            <div className="space-y-2">
              {['Restaurants', 'Recipes', 'Food Stories', 'Market Discoveries'].map((type) => (
                <label key={type} className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Geographic Focus</label>
            <input 
              type="text" 
              defaultValue={bot.location}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20"
            />
          </div>

          <div className="flex space-x-4">
            <button className="px-6 py-2 bg-[#F14C35] text-white rounded-lg font-medium hover:bg-[#E63E26] transition-colors">
              Save Changes
            </button>
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
