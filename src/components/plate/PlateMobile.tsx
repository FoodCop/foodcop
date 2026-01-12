import { useState, useEffect, useCallback } from 'react';
import { Star, Crown, Trophy, Utensils, Play, MapPin, Clock, Navigation, Settings, Trash, UserPlus, MessageCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { type SavedItem } from '../../services/savedItemsService';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { RecipeCard } from '../bites/components/RecipeCard';
import type { Recipe } from '../bites/components/RecipeCard';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ProfileService } from '../../services/profileService';
import DashboardService, { type DashboardData } from '../../services/dashboardService';
import type { UserProfile } from '../../types/profile';
import { GeolocationService } from '../../services/geolocationService';
import { CardHeading } from '../ui/card-heading';
import { SectionHeading } from '../ui/section-heading';
import { useUniversalViewer } from '../../contexts/UniversalViewerContext';
import { transformSavedItemToUnified, hydrateSavedRecipeToUnified, hydrateSavedVideoToUnified } from '../../utils/unifiedContentTransformers';
import { savedItemsService } from '../../services/savedItemsService';
import { PreferencesHintModal } from '../common/PreferencesHintModal';
import { PreferencesChips } from '../common/PreferencesChips';
import { FriendFinder } from '../friends/FriendFinder';
import { UserProfileView } from '../friends/UserProfileView';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { RecentChats } from './RecentChats';
import { useDMChatStore } from '../../stores/chatStore';

type TabType = 'places' | 'recipes' | 'videos' | 'crew' | 'posts';

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

interface PlateMobileProps {
  userId?: string;
  currentUser?: User;
}

// Level configuration
const LEVELS = [
  { name: 'Beginner Chef', minPoints: 0, icon: 'fa-solid fa-medal' },
  { name: 'Home Cook', minPoints: 500, icon: 'fa-solid fa-trophy' },
  { name: 'Skilled Chef', minPoints: 1000, icon: 'fa-solid fa-award' },
  { name: 'Gold Chef', minPoints: 2000, icon: 'fa-solid fa-crown' },
  { name: 'Master Chef', minPoints: 5000, icon: 'fa-solid fa-star' },
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

export default function PlateMobile({ userId: propUserId, currentUser }: PlateMobileProps = {}) {
  const { user: authUser } = useAuth();
  
  // Use prop userId if provided, otherwise fall back to auth user
  const user = currentUser || authUser;
  const userId = propUserId || user?.id;
  
  const [selectedTab, setSelectedTab] = useState<TabType>('places');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    crew: [],
    savedRecipes: [],
    restaurantRecommendations: [],
    masterbotPosts: []
  });
  const [loadingSection, setLoadingSection] = useState({
    crew: true,
    recipes: true,
    restaurants: true,
    masterbot: true
  });
  const [currentLocation, setCurrentLocation] = useState<{ city?: string; state?: string } | null>(null);
  const [showPreferencesHint, setShowPreferencesHint] = useState(false);
  const [showFriendFinder, setShowFriendFinder] = useState(false);
  const [selectedFriendUserId, setSelectedFriendUserId] = useState<string | null>(null);
  
  // Mock user data - will be replaced with real data
  const userPoints = 2450;
  const userRewards = 18;
  const userLevel = getUserLevel(userPoints);
  
  // Check if preferences hint should be shown
  useEffect(() => {
    const checkPreferencesHint = async () => {
      if (!user) return;

      try {
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          const hintShown = profileResult.data.preferences_hint_shown === true;
          console.log('🔍 PlateMobile: preferences_hint_shown =', hintShown);
          
          // Only show hint if explicitly false or undefined
          if (hintShown) {
            console.log('❌ PlateMobile: Hint already shown, skipping modal');
          } else {
            console.log('✅ PlateMobile: Showing preferences hint modal');
            setShowPreferencesHint(true);
          }
        }
      } catch (error) {
        console.error('Error checking preferences hint:', error);
      }
    };

    checkPreferencesHint();
  }, [user]);  // Get location from geolocation if profile doesn't have it
  useEffect(() => {
    const fetchGeolocation = async () => {
      // Only fetch if profile doesn't have location
      if (userProfile?.location_city) {
        return;
      }

      try {
        const locationData = await GeolocationService.getCurrentLocationData();
        if (locationData) {
          setCurrentLocation({
            city: locationData.city,
            state: locationData.state
          });
        }
      } catch (error) {
        console.error('Error fetching geolocation:', error);
      }
    };

    fetchGeolocation();
  }, [userProfile]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch user profile
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
        }

        // Get user location from profile or geolocation
        let userLocation: { lat: number; lng: number } | undefined;
        
        // Try to get from browser geolocation
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
          } catch {
            console.log('Geolocation not available, using default');
          }
        }

        // Fetch all dashboard data
        const data = await DashboardService.fetchDashboardData(user.id, userLocation);
        setDashboardData(data);
        
        setLoadingSection({
          crew: false,
          recipes: false,
          restaurants: false,
          masterbot: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);
  
  const getUserLocation = () => {
    // First try profile location
    if (userProfile?.location_city) {
      const state = userProfile.location_state;
      return state ? `${userProfile.location_city}, ${state}` : userProfile.location_city;
    }
    // Then try geolocation
    if (currentLocation?.city) {
      const state = currentLocation.state;
      return state ? `${currentLocation.city}, ${state}` : currentLocation.city;
    }
    return 'Location not set';
  };

  // ✅ Direct Supabase queries like old Plate implementation  
  const fetchAllSavedItems = useCallback(async () => {
    if (!userId) {
      console.log('❌ PlateMobile: No userId available');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 PlateMobile: Fetching all saved items for userId:', userId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching saved items:', error);
        setSavedItems([]);
        setLoading(false);
        return;
      }

      console.log('✅ Saved items fetched:', data?.length || 0);
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
      console.log('❌ PlateMobile: No userId available for posts');
      return;
    }

    try {
      console.log('🔍 PlateMobile: Fetching posts for userId:', userId);
      
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

  const { openViewer } = useUniversalViewer();

  const handleDeleteSavedItem = useCallback(
    async (item: SavedItem) => {
      try {
        const meta = item.metadata as Record<string, unknown>;
        const itemName = (meta.title as string) || (meta.name as string) || 'this item';

        const confirmed = globalThis.confirm(`Delete "${itemName}" from your Plate?`);
        if (!confirmed) return;

        const result = await savedItemsService.unsaveItem({
          itemId: item.item_id || item.id,
          itemType: item.item_type as 'recipe' | 'video' | 'restaurant' | 'photo'
        });

        if (result.success) {
          toast.success('Removed from Plate');
          fetchAllSavedItems();
        } else {
          toast.error('Failed to remove item');
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('An error occurred while removing the item');
      }
    },
    [fetchAllSavedItems]
  );
  
  const handleItemClick = useCallback(
    async (item: SavedItem) => {
      try {
        const unified =
          item.item_type === 'recipe'
            ? await hydrateSavedRecipeToUnified(item)
            : item.item_type === 'video'
            ? await hydrateSavedVideoToUnified(item)
            : transformSavedItemToUnified(item);

        openViewer(unified);
      } catch (error) {
        console.error('Error opening viewer:', error);
        toast.error('Failed to open item details');
      }
    },
    [openViewer]
  );

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.user_metadata?.display_name) return user.user_metadata.display_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Guest';
  };

  const getUserBio = () => {
    if (userProfile?.bio) return userProfile.bio;
    return 'Food enthusiast exploring the culinary world!';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2 text-[#8B0000]">Sign In Required</h1>
          <p style={{ color: '#808080' }}>Please sign in to view your Plate</p>
        </div>
      </div>
    );
  }

  const handlePreferencesUpdated = async () => {
    // Reload profile and dashboard data when preferences are updated
    if (user) {
      try {
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
        }

        let userLocation: { lat: number; lng: number } | undefined;
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
          } catch {
            console.log('Geolocation not available');
          }
        }

        const data = await DashboardService.fetchDashboardData(user.id, userLocation);
        setDashboardData(data);
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ backgroundImage: 'url(/bg.svg)', backgroundRepeat: 'repeat' }}>
      {showPreferencesHint && (
        <PreferencesHintModal
          onClose={() => setShowPreferencesHint(false)}
          onPreferencesSet={() => {
            setShowPreferencesHint(false);
            handlePreferencesUpdated();
          }}
        />
      )}
      <main className="max-w-full mx-auto">
        {/* Profile Header */}
        <section className="bg-white px-5 py-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-[#FF6B35] bg-gray-200">
                <img 
                  src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || 
                       'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg'} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                      const initials = getUserDisplayName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      if (fallback.textContent === '') {
                        fallback.textContent = initials || 'U';
                      }
                    }
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white font-bold text-lg md:text-2xl">
                  {getUserDisplayName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-yellow-400 to-[#FF6B35] rounded-full flex items-center justify-center border-2 border-white">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-white fill-white" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 w-full md:w-auto">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-[#8B0000]">{getUserDisplayName()}</h1>
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              <p className="text-sm md:text-base mb-3 max-w-md" style={{ color: '#808080' }}>{getUserBio()}</p>
              <div className="mb-3">
                <PreferencesChips 
                  userProfile={userProfile} 
                  onPreferencesUpdated={handlePreferencesUpdated}
                />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-around py-4 border-t border-gray-200">
            <button className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <span className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{userPoints.toLocaleString()}</span>
              <span className="text-xs mt-1" style={{ color: '#808080' }}>Points</span>
            </button>
            <div className="w-px h-10 bg-gray-200"></div>
            <button 
              onClick={() => setSelectedTab('posts')}
              className="flex flex-col items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{savedItems.length}</span>
              <span className="text-xs mt-1" style={{ color: '#808080' }}>Saved</span>
            </button>
            <div className="w-px h-10 bg-gray-200"></div>
            <button className="flex flex-col items-center hover:opacity-80 transition-opacity">
              <span className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{userRewards}</span>
              <span className="text-xs mt-1" style={{ color: '#808080' }}>Rewards</span>
            </button>
          </div>


          {/* Level Progress */}
          <section className="bg-white px-5 py-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-[#FF6B35] rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{userLevel.name}</p>
                  <p className="text-xs" style={{ color: '#808080' }}>Level {userLevel.level}</p>
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
        </section>

        {/* Tab Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-14 z-40 mt-2">
          <div className="flex">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTab('places');
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'places' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'hover:text-[#1A1A1A]'
              }`}
              style={selectedTab === 'places' ? {} : { color: '#808080' }}
            >
              Places
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTab('recipes');
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'recipes' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'hover:text-[#1A1A1A]'
              }`}
              style={selectedTab === 'recipes' ? {} : { color: '#808080' }}
            >
              Recipes
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTab('videos');
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'videos' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'hover:text-[#1A1A1A]'
              }`}
              style={selectedTab === 'videos' ? {} : { color: '#808080' }}
            >
              Videos
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTab('crew');
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'crew' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'hover:text-[#1A1A1A]'
              }`}
              style={selectedTab === 'crew' ? {} : { color: '#808080' }}
            >
              Crew
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedTab('posts');
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                selectedTab === 'posts' 
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]' 
                  : 'hover:text-[#1A1A1A]'
              }`}
              style={selectedTab === 'posts' ? {} : { color: '#808080' }}
            >
              Posts
            </button>
          </div>
        </nav>

        {/* Content */}
        {renderContent()}
      </main>

      {/* Friend Finder Dialog */}
      <Dialog open={showFriendFinder} onOpenChange={setShowFriendFinder}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Find Friends</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <FriendFinder
              onUserClick={(userId) => {
                setSelectedFriendUserId(userId);
                setShowFriendFinder(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile View Dialog */}
      <Dialog open={!!selectedFriendUserId} onOpenChange={(open) => !open && setSelectedFriendUserId(null)}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
          {selectedFriendUserId && (
            <UserProfileView
              userId={selectedFriendUserId}
              onBack={() => setSelectedFriendUserId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
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

    // Crew tab - show crew members, chats, saved recipes and restaurants
    if (selectedTab === 'crew') {
      return (
        <div className="pb-20">
          <div className="space-y-6">
            {/* My Crew */}
            <section className="mb-6">
              <div className="px-5 mb-4 flex items-center justify-between">
                <SectionHeading>My Crew</SectionHeading>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFriendFinder(true)}
                  className="text-xs"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="px-5">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  {loadingSection.crew ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col items-center shrink-0">
                          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                          <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mt-2" />
                        </div>
                      ))}
                    </div>
                  ) : dashboardData.crew.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {dashboardData.crew.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedFriendUserId(member.id)}
                          className="flex flex-col items-center shrink-0 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F7C59F] p-[3px]">
                            <Avatar className="w-full h-full border-2 border-white">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="bg-gray-100 text-sm">{member.initials}</AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-xs font-medium mt-2 max-w-16 truncate" style={{ color: '#6B7280' }}>
                            {member.name.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6" style={{ color: '#9CA3AF' }}>
                      <p className="text-sm">No crew members yet</p>
                      <p className="text-xs mt-1">Add friends to build your crew!</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFriendFinder(true)}
                        className="mt-4"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Find Friends
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Recent Chats */}
            <section className="mb-6">
              <div className="px-5 mb-4 flex items-center justify-between">
                <SectionHeading>Recent Chats</SectionHeading>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const { openChat } = useDMChatStore.getState();
                    openChat();
                  }}
                  className="text-xs text-[#FF6B35] hover:text-[#FF6B35] hover:bg-orange-50"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  View All
                </Button>
              </div>
              <div className="px-5">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <RecentChats limit={5} />
                </div>
              </div>
            </section>

            {/* Saved Recipes */}
            <section className="mb-6">
              <div className="px-5 mb-4">
                <SectionHeading>Saved Recipes</SectionHeading>
              </div>
              {loadingSection.recipes ? (
                <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="h-36 bg-gray-200 animate-pulse" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboardData.savedRecipes.length > 0 ? (
                <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dashboardData.savedRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all"
                    >
                      <div className="relative h-36">
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Recipe';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <CardHeading variant="accent" size="lg" lineClamp={2} className="mb-1 leading-tight">
                          {recipe.name}
                        </CardHeading>
                        <div className="flex items-center gap-1.5" style={{ color: '#6B7280', fontSize: '10pt' }}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{recipe.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 text-center py-6" style={{ color: '#9CA3AF' }}>
                  <p className="text-sm">No saved recipes yet</p>
                  <p className="text-xs mt-1">Save recipes from Bites to see them here!</p>
                </div>
              )}
            </section>

            {/* Restaurant Recommendations */}
            <section className="mb-6">
              <div className="px-5 flex items-center justify-between mb-4">
                <SectionHeading>Nearby Restaurants</SectionHeading>
                <button className="flex items-center gap-1.5 text-[#FF6B35] text-sm font-medium">
                  <span>Map View</span>
                  <Navigation className="w-4 h-4 fill-current" />
                </button>
              </div>
              {loadingSection.restaurants ? (
                <div className="px-5 space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="h-44 bg-gray-200 animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-5 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dashboardData.restaurantRecommendations.length > 0 ? (
                <div className="px-5 space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                  {dashboardData.restaurantRecommendations.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all"
                    >
                      <div className="relative h-44">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Restaurant';
                          }}
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#10B981] text-white shadow-md">
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span className="text-xs font-bold">{restaurant.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <CardHeading variant="accent" size="lg" lineClamp={1} className="mb-1">
                          {restaurant.name}
                        </CardHeading>
                        <p className="mb-3" style={{ color: '#6B7280', fontSize: '10pt' }}>{restaurant.cuisine}</p>
                        <div className="flex items-center gap-2" style={{ color: '#6B7280', fontSize: '10pt' }}>
                          <Navigation className="w-4 h-4 text-[#FF6B35]" />
                          <span>{restaurant.distance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 text-center py-6" style={{ color: '#9CA3AF' }}>
                  <p className="text-sm">No restaurant recommendations</p>
                  <p className="text-xs mt-1">Enable location to see nearby restaurants!</p>
                </div>
              )}
            </section>
          </div>
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
            <p className="text-center mb-6" style={{ color: '#808080' }}>
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
                <span className="text-sm" style={{ color: '#808080' }}>
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
          <p className="text-center mb-6" style={{ color: '#808080' }}>
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
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSavedItem(item);
                }}
                className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white transition"
                aria-label="Delete saved recipe"
              >
                <Trash className="w-4 h-4 text-red-500" />
              </button>
              <RecipeCard 
                recipe={recipe} 
                onClick={() => void handleItemClick(item)} 
              />
            </div>
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
              place_id: metadata.place_id as string,
              name: (metadata.name as string) || 'Unknown Restaurant',
              rating: metadata.rating as number,
              price_level: metadata.price_level as number,
              distance: metadata.distance as number,
              cuisine: metadata.cuisine as string | string[],
              photos: metadata.photos as { photo_reference: string }[],
              image_url: metadata.image_url as string
            };
            
          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSavedItem(item);
                }}
                className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white transition"
                aria-label="Delete saved place"
              >
                <Trash className="w-4 h-4 text-red-500" />
              </button>
              <RestaurantCardComponent restaurant={restaurant} onClick={() => void handleItemClick(item)} />
            </div>
          );
          })}
        </section>
      );
    }

    // Video cards
    if (selectedTab === 'videos') {
      return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredItems.map((item) => {
            const metadata = item.metadata;
            
            return (
              <button 
                key={item.id}
                type="button"
                onClick={() => void handleItemClick(item)}
                className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow text-left w-full"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSavedItem(item);
                  }}
                  className="absolute top-3 right-3 z-20 rounded-full bg-white/90 p-2 shadow hover:bg-white transition"
                  aria-label="Delete saved video"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
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
                  <CardHeading variant="accent" size="lg" weight="semibold" lineClamp={2} className="mb-1">
                    {(metadata.title as string) || (metadata.name as string) || 'Video'}
                  </CardHeading>
                  {metadata.creator && (
                    <p className="text-sm" style={{ color: '#808080' }}>{metadata.creator as string}</p>
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
  const getImageUrl = () => {
    if (restaurant.image_url) return restaurant.image_url;
    if (restaurant.photos && restaurant.photos.length > 0) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${restaurant.photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`;
    }
    return 'https://via.placeholder.com/400x300?text=Restaurant';
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-shadow text-left w-full"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={getImageUrl()} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Restaurant';
          }}
        />
        {restaurant.rating && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#10B981] text-white shadow-md">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span className="text-xs font-bold">{restaurant.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <CardHeading variant="accent" size="lg" lineClamp={1} className="mb-1">
          {restaurant.name}
        </CardHeading>
        {restaurant.cuisine && (
          <p className="text-sm mb-2" style={{ color: '#808080' }}>
            {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
          </p>
        )}
        {restaurant.distance && (
          <div className="flex items-center gap-1 text-sm" style={{ color: '#808080' }}>
            <i className="fa-solid fa-person-walking"></i>
            <span>{(restaurant.distance / 1000).toFixed(1)} km</span>
          </div>
        )}
      </div>
    </button>
  );
}

