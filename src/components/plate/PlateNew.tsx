import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Star, Crown, Trophy, Utensils, Play, MapPin } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { savedItemsService, type SavedItem } from '../../services/savedItemsService';
import { toast } from 'sonner';

type TabType = 'all' | 'recipes' | 'videos' | 'places';

// Level configuration
const LEVELS = [
  { name: 'Beginner Chef', minPoints: 0, icon: '🥉' },
  { name: 'Home Cook', minPoints: 500, icon: '🥈' },
  { name: 'Skilled Chef', minPoints: 1000, icon: '🥇' },
  { name: 'Gold Chef', minPoints: 2000, icon: '👑' },
  { name: 'Master Chef', minPoints: 5000, icon: '⭐' },
];

function getUserLevel(points: number) {
  const level = LEVELS.slice().reverse().find(l => points >= l.minPoints) || LEVELS[0];
  const currentIndex = LEVELS.indexOf(level);
  const nextLevel = LEVELS[currentIndex + 1];
  const pointsToNext = nextLevel ? nextLevel.minPoints - points : 0;
  const progressPercent = nextLevel 
    ? ((points - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100
    : 100;
  
  return {
    ...level,
    level: currentIndex + 1,
    pointsToNext,
    progressPercent: Math.min(progressPercent, 100)
  };
}

export default function PlateNew() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock user data - will be replaced with real data
  const userPoints = 2450;
  const userRewards = 18;
  const userLevel = getUserLevel(userPoints);

  useEffect(() => {
    loadSavedItems();
  }, [user]);

  const loadSavedItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await savedItemsService.listSavedItems();
      if (result.success && result.data) {
        setSavedItems(result.data);
      } else {
        throw new Error(result.error || 'Failed to load saved items');
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  // Filter items by tab
  const filteredItems = savedItems.filter(item => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'recipes') return item.item_type === 'recipe';
    if (selectedTab === 'videos') return item.item_type === 'video';
    if (selectedTab === 'places') return item.item_type === 'restaurant';
    return true;
  });

  const handleItemClick = (item: SavedItem) => {
    // Handle item click - open detail modal
    console.log('Item clicked:', item);
    toast.info('Item detail coming soon!');
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Guest';
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || 
           'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg';
  };

  const getUserBio = () => {
    return user?.user_metadata?.bio || 
           'Food enthusiast & home chef 🍳 Exploring flavors from around the world';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Sign In Required</h2>
          <p className="text-[#666666]">Please sign in to view your Plate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-5 py-3 max-w-[1200px] mx-auto">
          <button className="p-2 text-[#1A1A1A] lg:invisible">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[#1A1A1A]">Plate</h1>
          <button className="p-2 text-[#1A1A1A]">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="pb-20 max-w-[1200px] mx-auto">
        {/* Profile Header */}
        <section className="bg-white px-5 py-6 lg:py-8">
          <div className="flex flex-col md:flex-row items-start gap-4 mb-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-[#FF6B35]">
                <img 
                  src={getUserAvatar()} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-yellow-400 to-[#FF6B35] rounded-full flex items-center justify-center border-2 border-white">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-white fill-white" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 w-full md:w-auto">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{getUserDisplayName()}</h2>
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              <p className="text-sm md:text-base text-[#666666] mb-3 max-w-md">{getUserBio()}</p>
              <button className="text-sm font-medium text-[#FF6B35] border border-[#FF6B35] rounded-lg px-4 py-1.5 hover:bg-[#FF6B35] hover:text-white transition-colors">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-around py-4 border-t border-gray-200">
            <button className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <span className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{userPoints.toLocaleString()}</span>
              <span className="text-xs text-[#666666] mt-1">Points</span>
            </button>
            <div className="w-px h-10 bg-gray-200"></div>
            <button className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <span className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{savedItems.length}</span>
              <span className="text-xs text-[#666666] mt-1">Saved</span>
            </button>
            <div className="w-px h-10 bg-gray-200"></div>
            <button className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <span className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{userRewards}</span>
              <span className="text-xs text-[#666666] mt-1">Rewards</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button className="flex-1 bg-[#FF6B35] text-white font-medium py-3 rounded-xl hover:bg-[#e55a2a] transition-colors">
              View Rewards
            </button>
            <button className="flex-1 border border-gray-300 text-[#1A1A1A] font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Share Profile
            </button>
          </div>
        </section>

        {/* Level Progress */}
        <section className="bg-white px-5 py-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-[#FF6B35] rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">{userLevel.name}</p>
                <p className="text-xs text-[#666666]">Level {userLevel.level}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-[#FF6B35]">
              {userLevel.pointsToNext > 0 ? `${userLevel.pointsToNext} to next level` : 'Max Level!'}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FFD500] rounded-full transition-all duration-500"
              style={{ width: `${userLevel.progressPercent}%` }}
            />
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-14 z-40 mt-2">
          <div className="flex">
            <button 
              onClick={() => setSelectedTab('all')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'all' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setSelectedTab('recipes')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'recipes' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Recipes
            </button>
            <button 
              onClick={() => setSelectedTab('videos')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'videos' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Videos
            </button>
            <button 
              onClick={() => setSelectedTab('places')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'places' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Places
            </button>
          </div>
        </nav>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 mt-0.5">
            {[...new Array(12)].map((_, i) => (
              <div key={`skeleton-${i}`} className="aspect-square bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              {selectedTab === 'all' && <Star className="w-10 h-10 text-gray-400" />}
              {selectedTab === 'recipes' && <Utensils className="w-10 h-10 text-gray-400" />}
              {selectedTab === 'videos' && <Play className="w-10 h-10 text-gray-400" />}
              {selectedTab === 'places' && <MapPin className="w-10 h-10 text-gray-400" />}
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
              {selectedTab === 'all' ? 'No saved items yet' : `No ${selectedTab} saved`}
            </h3>
            <p className="text-[#666666] text-center mb-6">
              {selectedTab === 'all' 
                ? 'Start exploring and save recipes, videos, and places you love!'
                : `Tap the bookmark icon to save ${selectedTab}`}
            </p>
            <button 
              onClick={() => toast.info('Navigate to explore page')}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#e55a2a] transition-colors"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 mt-0.5">
            {filteredItems.map((item) => {
              const metadata = item.metadata as Record<string, unknown>;
              const thumbnail = (metadata.thumbnail as string) || (metadata.image as string) || 'https://via.placeholder.com/300';
              const title = (metadata.title as string) || 'Saved Item';
              const duration = metadata.duration as string | undefined;
              
              return (
                <div 
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="aspect-square relative overflow-hidden bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <img 
                    className="w-full h-full object-cover" 
                    src={thumbnail} 
                    alt={title}
                    loading="lazy"
                  />
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
                    {item.item_type === 'recipe' && <Utensils className="w-3 h-3 text-white" />}
                    {item.item_type === 'video' && <Play className="w-3 h-3 text-white" />}
                    {item.item_type === 'restaurant' && <MapPin className="w-3 h-3 text-white" />}
                  </div>
                  {/* Duration Badge (for videos) */}
                  {item.item_type === 'video' && duration && (
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs font-medium">
                      {duration}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
