import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MoreVertical, Star, Crown, Trophy, Utensils, Play, MapPin } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { type SavedItem } from '../../services/savedItemsService';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { RecipeCard } from '../bites/components/RecipeCard';
import type { Recipe } from '../bites/components/RecipeCard';

type TabType = 'posts' | 'recipes' | 'videos' | 'places';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface Restaurant {
  place_id?: string;
  name: string;
  rating?: number;
  price_level?: number;
  distance?: number;
  cuisine?: string | string[];
  photos?: { photo_reference: string }[];
  image_url?: string;
}

interface PlateNewProps {
  userId?: string;
  currentUser?: User;
}

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

export default function PlateNew({ userId: propUserId, currentUser }: PlateNewProps = {}) {
  const { user: authUser } = useAuth();
  
  // Use prop userId if provided, otherwise fall back to auth user
  const user = currentUser || authUser;
  const userId = propUserId || user?.id;
  
  // 🔥 FORCE RELOAD MARKER - Version 2.0 - Nov 17, 2025 16:45
  console.log('🔥 PlateNew LOADED - Version 2.0 - Direct Supabase Query Implementation');
  console.log('📍 UserId from props:', propUserId);
  console.log('📍 UserId from auth:', authUser?.id);
  console.log('📍 Final userId:', userId);
  
  const [selectedTab, setSelectedTab] = useState<TabType>('posts');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock user data - will be replaced with real data
  const userPoints = 2450;
  const userRewards = 18;
  const userLevel = getUserLevel(userPoints);

  // ✅ Direct Supabase queries like old Plate implementation  
  const fetchAllSavedItems = useCallback(async () => {
    if (!userId) {
      console.log('❌ PlateNew: No userId available');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 PlateNew: Fetching all saved items for userId:', userId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching saved items:', error);
        setSavedItems([]);
        toast.error('Failed to load saved items');
        return;
      }

      console.log('✅ Saved items fetched:', data?.length || 0);
      console.log('📊 Item types:', data?.map(item => item.item_type) || []);
      
      // Debug first restaurant item to see metadata structure
      const firstRestaurant = data?.find(item => item.item_type === 'restaurant');
      if (firstRestaurant) {
        console.log('🍽️ Sample restaurant metadata:', firstRestaurant.metadata);
      }
      
      console.log('🔄 Setting savedItems state with', data?.length || 0, 'items');
      setSavedItems((data as SavedItem[]) || []);
      console.log('✅ State update complete - savedItems should now have', data?.length || 0, 'items');
    } catch (error) {
      console.error('💥 Unexpected error fetching saved items:', error);
      setSavedItems([]);
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    if (!userId) {
      console.log('❌ PlateNew: No userId available for posts');
      return;
    }

    try {
      console.log('🔍 PlateNew: Fetching posts for userId:', userId);
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching posts:', error);
        setPosts([]);
        return;
      }

      console.log('✅ Posts fetched:', data?.length || 0);
      setPosts((data as Post[]) || []);
    } catch (error) {
      console.error('💥 Unexpected error fetching posts:', error);
      setPosts([]);
    }
  }, [userId]);

  useEffect(() => {
    fetchAllSavedItems();
    fetchPosts();
  }, [fetchAllSavedItems, fetchPosts]);

  // Filter items by tab
  const filteredItems = savedItems.filter(item => {
    if (selectedTab === 'posts') return false; // Posts from posts table, not saved_items
    if (selectedTab === 'recipes') return item.item_type === 'recipe';
    if (selectedTab === 'videos') return item.item_type === 'video';
    if (selectedTab === 'places') return item.item_type === 'restaurant';
    return false;
  });

  // Log filtering results
  console.log(`🔍 Filtering for tab: ${selectedTab}`);
  console.log(`📋 Total items: ${savedItems.length}, Filtered: ${filteredItems.length}`);
  console.log(`📊 Item breakdown:`, {
    recipes: savedItems.filter(i => i.item_type === 'recipe').length,
    videos: savedItems.filter(i => i.item_type === 'video').length,
    restaurants: savedItems.filter(i => i.item_type === 'restaurant').length,
    photos: savedItems.filter(i => i.item_type === 'photo').length,
    other: savedItems.filter(i => i.item_type === 'other').length
  });

  const handleItemClick = (item: SavedItem) => {
    // Handle item click - open detail modal
    console.log('Item clicked:', item);
    toast.info('Item detail coming soon!');
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name;
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
      <div 
        className="min-h-screen bg-[#FAFAFA] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg.svg)',
        }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Sign In Required</h2>
          <p className="text-[#666666]">Please sign in to view your Plate</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/bg.svg)',
      }}
    >
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
            <button 
              onClick={() => setSelectedTab('posts')}
              className="flex flex-col items-center hover:opacity-80 transition-opacity"
            >
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
              onClick={() => setSelectedTab('posts')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'posts' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Posts
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

        {/* Content */}
        {renderContent()}
      </main>
    </div>
  );

  function renderContent() {
    if (loading) {
      const skeletons = Array.from({ length: 6 }, (_, i) => ({ id: `skeleton-${i}` }));
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {skeletons.map((item) => (
            <div key={item.id} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      );
    }

    // Posts tab - show user's posts
    if (selectedTab === 'posts') {
      if (posts.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Star className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No posts yet</h3>
            <p className="text-[#666666] text-center mb-6">
              Share your food adventures and connect with friends!
            </p>
            <button 
              onClick={() => toast.info('Create post coming soon')}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#e55a2a] transition-colors"
            >
              Create Post
            </button>
          </div>
        );
      }

      return (
        <section className="p-4 space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {post.image_url && (
                <img src={post.image_url} alt="Post" className="w-full h-64 object-cover" />
              )}
              <div className="p-4">
                <p className="text-[#1A1A1A] mb-2">{post.content}</p>
                <span className="text-sm text-[#666666]">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </section>
      );
    }

    // Empty state for other tabs
    if (filteredItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {selectedTab === 'recipes' && <Utensils className="w-10 h-10 text-gray-400" />}
            {selectedTab === 'videos' && <Play className="w-10 h-10 text-gray-400" />}
            {selectedTab === 'places' && <MapPin className="w-10 h-10 text-gray-400" />}
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{`No ${selectedTab} saved`}</h3>
          <p className="text-[#666666] text-center mb-6">
            {`Tap the bookmark icon to save ${selectedTab}`}
          </p>
          <button 
            onClick={() => toast.info('Navigate to explore page')}
            className="bg-[#FF6B35] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#e55a2a] transition-colors"
          >
            Start Exploring
          </button>
        </div>
      );
    }

    // Recipe cards
    if (selectedTab === 'recipes') {
      return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredItems.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metadata = item.metadata as Record<string, any>;
            const recipe: Recipe = {
              id: item.item_id ? Number(item.item_id) : 0,
              title: (metadata.title as string) || (metadata.name as string) || 'Untitled Recipe',
              image: (metadata.image as string) || (metadata.image_url as string) || '',
              readyInMinutes: (metadata.readyInMinutes as number) || (metadata.cookTime as number) || 30,
              servings: (metadata.servings as number) || 4,
              diets: (metadata.diets as string[]) || [],
              cuisines: (metadata.cuisines as string[]) || [],
              summary: (metadata.summary as string) || '',
              instructions: (metadata.instructions as string) || '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              extendedIngredients: (metadata.extendedIngredients as any[]) || []
            };
            
            return (
              <RecipeCard 
                key={item.id} 
                recipe={recipe} 
                onClick={() => handleItemClick(item)} 
              />
            );
          })}
        </section>
      );
    }

    // Restaurant cards
    if (selectedTab === 'places') {
      return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredItems.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metadata = item.metadata as Record<string, any>;
            const restaurant: Restaurant = {
              place_id: (metadata.place_id as string) || item.item_id,
              name: (metadata.name as string) || 'Unknown Restaurant',
              rating: (metadata.rating as number) || 4,
              price_level: (metadata.price_level as number) || (metadata.priceLevel as number) || 2,
              distance: metadata.distance as number | undefined,
              cuisine: (metadata.cuisine as string | string[]) || (metadata.types as string | string[]) || 'Restaurant',
              photos: (metadata.photos as { photo_reference: string }[]) || undefined,
              image_url: (metadata.image_url as string) || (metadata.image as string) || (metadata.photo as string) || undefined
            };
            
            return <RestaurantCardComponent key={item.id} restaurant={restaurant} onClick={() => handleItemClick(item)} />;
          })}
        </section>
      );
    }

    // Video cards - placeholder for now
    if (selectedTab === 'videos') {
      return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredItems.map((item) => {
            const metadata = item.metadata;
            
            return (
              <button 
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow text-left w-full"
              >
                <div className="relative aspect-video bg-gray-900">
                  {((metadata.thumbnail_url || metadata.thumbnailUrl || metadata.image) as string | undefined) ? (
                    <img 
                      src={(metadata.thumbnail_url || metadata.thumbnailUrl || metadata.image) as string} 
                      alt={(metadata.title as string) || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-8 h-8 text-[#FF6B35] fill-[#FF6B35] ml-1" />
                    </div>
                  </div>
                  {metadata.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs">
                      {metadata.duration as string}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[#1A1A1A] mb-1 line-clamp-2">
                    {(metadata.title as string) || (metadata.name as string) || 'Video'}
                  </h3>
                  {metadata.creator && (
                    <p className="text-sm text-[#666666]">{metadata.creator as string}</p>
                  )}
                </div>
              </button>
            );
          })}
        </section>
      );
    }

    return null;
  }
}

// Restaurant Card Component (inline since FeaturedRestaurantCard is complex)
function RestaurantCardComponent({ restaurant, onClick }: Readonly<{ restaurant: Restaurant; onClick?: () => void }>) {
  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$$';
  
  const getDistanceText = () => {
    if (!restaurant.distance || typeof restaurant.distance !== 'number') return '0.5km away';
    if (restaurant.distance < 1) return `${Math.round(restaurant.distance * 1000)}m away`;
    return `${restaurant.distance.toFixed(1)}km away`;
  };
  const distanceText = getDistanceText();
  
  const cuisineTypes: string[] = Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [restaurant.cuisine || 'Restaurant'];
  
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow text-left w-full"
    >
      {/* Hero image with gradient overlay */}
      <div className="relative h-56 overflow-hidden bg-linear-to-br from-gray-200 to-gray-300">
        {restaurant.image_url ? (
          <img 
            src={restaurant.image_url} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken images and show placeholder
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
        
        {/* Bottom content */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{restaurant.name}</h3>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-white" />
                <span className="text-sm text-white">{distanceText}</span>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-full flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-lg font-bold text-gray-900">{restaurant.rating}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Details section */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex items-center space-x-2 mb-4">
          {cuisineTypes.slice(0, 2).map((type) => (
            <span key={type} className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-700">
              {type}
            </span>
          ))}
          <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-700">
            {priceLevel}
          </span>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-5 leading-relaxed line-clamp-2">
          Experience exquisite cuisine in an elegant setting. Saved from your explorations.
        </p>
        
        {/* Action button */}
        <div className="flex space-x-3">
          <button className="flex-1 h-12 bg-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors">
            <MapPin className="w-4 h-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </button>
  );
}
