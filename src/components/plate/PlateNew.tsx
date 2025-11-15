import { useState, useEffect, useCallback } from 'react';
import { Settings, MapPin, Heart, Clock, Users, Grid, Bookmark } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../services/supabase';
import type { AuthUser } from '../../types/auth';
import type { User } from '@supabase/supabase-js';
import type { SavedItem, RecipeMetadata } from '../../types/plate';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

interface PlateNewProps {
  userId?: string;
  currentUser?: User;
}

type TabType = 'saved' | 'recipes' | 'videos' | 'places' | 'photos';

export default function PlateNew({ userId: propUserId, currentUser }: PlateNewProps) {
  const { user: authUser } = useAuth();
  const userId = propUserId || authUser?.id || '';
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  
  // Tab data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<SavedItem[]>([]);
  const [recipes, setRecipes] = useState<SavedItem[]>([]);
  const [videos, setVideos] = useState<SavedItem[]>([]);
  const [places, setPlaces] = useState<SavedItem[]>([]);

  const convertToAuthUser = (supabaseUser: User): AuthUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    created_at: supabaseUser.created_at,
    metadata: supabaseUser.user_metadata
  });

  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      const transformedUser = {
        id: data.id,
        email: data.email,
        name: data.display_name || data.first_name ? `${data.first_name} ${data.last_name}`.trim() : data.username,
        avatar_url: data.avatar_url,
        username: data.username,
        bio: data.bio,
        location_city: data.location_city,
        location_country: data.location_country,
        total_points: data.total_points,
        followers_count: data.followers_count,
        following_count: data.following_count,
        created_at: data.created_at,
      };
      
      setUser(transformedUser as AuthUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser) {
      setUser(convertToAuthUser(currentUser));
      setLoading(false);
    } else {
      fetchUserProfile();
    }
  }, [userId, currentUser, fetchUserProfile]);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
        return;
      }

      setPosts((data as Post[]) || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  }, [userId]);

  const fetchPhotos = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'photo')
        .order('created_at', { ascending: false });

      if (error) {
        setPhotos([]);
        return;
      }

      setPhotos((data as SavedItem[]) || []);
    } catch (error) {
      setPhotos([]);
    }
  }, [userId]);

  const fetchRecipes = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'recipe')
        .order('created_at', { ascending: false });

      if (error) {
        setRecipes([]);
        return;
      }

      setRecipes((data as SavedItem[]) || []);
    } catch (error) {
      setRecipes([]);
    }
  }, [userId]);

  const fetchVideos = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'video')
        .order('created_at', { ascending: false });

      if (error) {
        setVideos([]);
        return;
      }

      setVideos((data as SavedItem[]) || []);
    } catch (error) {
      setVideos([]);
    }
  }, [userId]);

  const fetchPlaces = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'restaurant')
        .order('created_at', { ascending: false });

      if (error) {
        setPlaces([]);
        return;
      }

      setPlaces((data as SavedItem[]) || []);
    } catch (error) {
      setPlaces([]);
    }
  }, [userId]);

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchPosts(),
        fetchPhotos(),
        fetchRecipes(),
        fetchVideos(),
        fetchPlaces(),
      ]);
    };
    
    if (userId) {
      fetchAllData();
    }
  }, [userId, fetchPosts, fetchPhotos, fetchRecipes, fetchVideos, fetchPlaces]);

  const totalSaved = photos.length + recipes.length + videos.length + places.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#666666] font-[Inter]">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Container */}
      <div className="max-w-[375px] md:max-w-full lg:max-w-7xl mx-auto bg-white">
        
        {/* Desktop Layout: Sidebar + Content */}
        <div className="md:flex md:gap-6 lg:gap-8 md:p-6 lg:p-8">
        {/* Desktop Layout: Sidebar + Content */}
        <div className="md:flex md:gap-6 lg:gap-8 md:p-6 lg:p-8">
          
          {/* Profile Sidebar - Desktop Only */}
          <div className="hidden md:block md:w-80 lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 sticky top-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <img
                    src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
                    alt={user.name || 'User'}
                    className="w-24 h-24 lg:w-28 lg:h-28 rounded-full border-4 border-[#FF6B35]"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#FF6B35] to-[#EA580C] rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                
                <h2 className="text-[#1A1A1A] font-bold text-xl lg:text-2xl leading-7 mb-1 font-[Poppins] text-center">
                  {user.name || 'Anonymous User'}
                </h2>
                <p className="text-[#666666] text-sm lg:text-base mb-3 font-[Inter] text-center">
                  @{user.username || user.email?.split('@')[0] || 'user'}
                </p>
                {user.location_city && user.location_country && (
                  <div className="flex items-center gap-1 text-[#999999] text-sm font-[Inter]">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location_city}, {user.location_country}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-[#1A1A1A] text-sm lg:text-base leading-6 mb-6 font-[Inter] text-center">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-[#E8E8E8]">
                <div className="text-center">
                  <p className="text-[#1A1A1A] font-bold text-xl lg:text-2xl leading-7 font-[Poppins]">
                    {posts.length}
                  </p>
                  <p className="text-[#666666] text-xs lg:text-sm font-[Inter]">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-[#1A1A1A] font-bold text-xl lg:text-2xl leading-7 font-[Poppins]">
                    {user.followers_count || 0}
                  </p>
                  <p className="text-[#666666] text-xs lg:text-sm font-[Inter]">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-[#1A1A1A] font-bold text-xl lg:text-2xl leading-7 font-[Poppins]">
                    {user.following_count || 0}
                  </p>
                  <p className="text-[#666666] text-xs lg:text-sm font-[Inter]">Following</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full h-12 bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white rounded-xl font-semibold text-sm lg:text-base font-[Inter] shadow-md hover:shadow-lg transition-shadow">
                  Edit Profile
                </button>
                <button className="w-full h-12 bg-[#F5F5F5] text-[#666666] rounded-xl font-semibold text-sm lg:text-base font-[Inter] hover:bg-[#E8E8E8] transition-colors">
                  Share Profile
                </button>
              </div>
            </div>
          </div>
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
        
        {/* Header - Sticky - Mobile Only */}
        <div className="md:hidden bg-white shadow-sm px-5 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <h1 className="text-[#1A1A1A] font-bold text-xl leading-7 font-[Poppins]">Profile</h1>
            <button className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center hover:bg-[#E8E8E8] transition-colors">
              <Settings className="w-5 h-5 text-[#666666]" />
            </button>
          </div>
        </div>

        {/* Profile Header - Mobile Only */}
        <div className="md:hidden px-5 py-6">
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
                alt={user.name || 'User'}
                className="w-20 h-20 rounded-full border-4 border-[#FF6B35]"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#FF6B35] to-[#EA580C] rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-[#1A1A1A] font-bold text-lg leading-6 mb-1 font-[Poppins]">
                {user.name || 'Anonymous User'}
              </h2>
              <p className="text-[#666666] text-sm mb-2 font-[Inter]">
                @{user.username || user.email?.split('@')[0] || 'user'}
              </p>
              {user.location_city && user.location_country && (
                <div className="flex items-center gap-1 text-[#999999] text-xs font-[Inter]">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location_city}, {user.location_country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-[#1A1A1A] text-sm leading-5 mb-6 font-[Inter]">
              {user.bio}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-[#1A1A1A] font-bold text-xl leading-7 font-[Poppins]">
                {posts.length}
              </p>
              <p className="text-[#666666] text-xs font-[Inter]">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-[#1A1A1A] font-bold text-xl leading-7 font-[Poppins]">
                {user.followers_count || 0}
              </p>
              <p className="text-[#666666] text-xs font-[Inter]">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-[#1A1A1A] font-bold text-xl leading-7 font-[Poppins]">
                {user.following_count || 0}
              </p>
              <p className="text-[#666666] text-xs font-[Inter]">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="h-11 bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white rounded-xl font-semibold text-sm font-[Inter] shadow-md active:scale-95 transition-transform">
              Edit Profile
            </button>
            <button className="h-11 bg-[#F5F5F5] text-[#666666] rounded-xl font-semibold text-sm font-[Inter] hover:bg-[#E8E8E8] transition-colors">
              Share Profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t md:border-0 border-[#E8E8E8] md:mb-6">
          <div className="px-5 md:px-0 overflow-x-auto hide-scrollbar">
            <div className="flex md:flex-wrap gap-1 md:gap-2 py-2 md:py-0">
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium font-[Inter] transition-all whitespace-nowrap ${
                  activeTab === 'saved'
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white md:bg-[#F5F5F5] text-[#666666] hover:bg-[#F5F5F5] md:hover:bg-[#E8E8E8]'
                }`}
              >
                <Bookmark className="w-4 h-4 md:w-5 md:h-5" />
                Saved ({totalSaved})
              </button>
              <button
                onClick={() => setActiveTab('recipes')}
                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium font-[Inter] transition-all whitespace-nowrap ${
                  activeTab === 'recipes'
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white md:bg-[#F5F5F5] text-[#666666] hover:bg-[#F5F5F5] md:hover:bg-[#E8E8E8]'
                }`}
              >
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
                Recipes ({recipes.length})
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium font-[Inter] transition-all whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white md:bg-[#F5F5F5] text-[#666666] hover:bg-[#F5F5F5] md:hover:bg-[#E8E8E8]'
                }`}
              >
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                Videos ({videos.length})
              </button>
              <button
                onClick={() => setActiveTab('places')}
                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium font-[Inter] transition-all whitespace-nowrap ${
                  activeTab === 'places'
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white md:bg-[#F5F5F5] text-[#666666] hover:bg-[#F5F5F5] md:hover:bg-[#E8E8E8]'
                }`}
              >
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                Places ({places.length})
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-medium font-[Inter] transition-all whitespace-nowrap ${
                  activeTab === 'photos'
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white md:bg-[#F5F5F5] text-[#666666] hover:bg-[#F5F5F5] md:hover:bg-[#E8E8E8]'
                }`}
              >
                <Grid className="w-4 h-4 md:w-5 md:h-5" />
                Photos ({photos.length})
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 md:px-0 py-6 md:py-0">
          {/* Saved Tab */}
          {activeTab === 'saved' && (
            <div>
              {totalSaved === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
                    <Bookmark className="w-10 h-10 md:w-12 md:h-12 text-[#999999]" />
                  </div>
                  <p className="text-[#1A1A1A] font-semibold text-base md:text-lg mb-2 font-[Poppins]">No saved items yet</p>
                  <p className="text-[#666666] text-sm md:text-base font-[Inter] text-center">
                    Start saving recipes, videos, and places!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {/* Show all saved items */}
                  {[...recipes, ...videos, ...places].slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_8px_0_rgba(0,0,0,0.15)] transition-shadow"
                    >
                      {item.item_type === 'recipe' && (
                        <RecipeCard recipe={item} />
                      )}
                      {item.item_type === 'video' && (
                        <VideoCard video={item} />
                      )}
                      {item.item_type === 'restaurant' && (
                        <PlaceCard place={item} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recipes Tab */}
          {activeTab === 'recipes' && (
            <div>
              {recipes.length === 0 ? (
                <EmptyState icon="🍳" title="No recipes saved" description="Discover and save recipes you love" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {recipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div>
              {videos.length === 0 ? (
                <EmptyState icon="🎥" title="No videos saved" description="Save cooking videos to watch later" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Places Tab */}
          {activeTab === 'places' && (
            <div>
              {places.length === 0 ? (
                <EmptyState icon="📍" title="No places saved" description="Save restaurants you want to visit" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {places.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div>
              {photos.length === 0 ? (
                <EmptyState icon="📸" title="No photos saved" description="Save food photos for inspiration" />
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                  {photos.map((photo) => {
                    const meta = photo.metadata as { url?: string; caption?: string };
                    return (
                      <div key={photo.id} className="relative aspect-square">
                        <img
                          src={meta.url || ''}
                          alt={meta.caption || 'Photo'}
                          className="absolute inset-0 w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div> {/* End Tab Content */}
        
        </div> {/* End Main Content Area */}
        </div> {/* End Desktop Layout */}
      </div> {/* End Mobile Container */}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-24">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl md:text-5xl">{icon}</span>
      </div>
      <p className="text-[#1A1A1A] font-semibold text-base md:text-lg mb-2 font-[Poppins]">{title}</p>
      <p className="text-[#666666] text-sm md:text-base font-[Inter] text-center">{description}</p>
    </div>
  );
}

// Recipe Card Component
function RecipeCard({ recipe }: { recipe: SavedItem }) {
  const meta = recipe.metadata as RecipeMetadata;
  
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_8px_0_rgba(0,0,0,0.15)] transition-shadow cursor-pointer">
      {meta.image && (
        <div className="relative w-full h-40">
          <img
            src={meta.image}
            alt={meta.title || 'Recipe'}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {meta.healthScore && meta.healthScore > 70 && (
            <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm">⭐</span>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-[#1A1A1A] font-semibold text-base leading-5 mb-2 line-clamp-2 font-[Poppins]">
          {meta.title || 'Untitled Recipe'}
        </h3>
        {meta.summary && (
          <p className="text-[#666666] text-sm leading-5 mb-3 line-clamp-2 font-[Inter]">
            {meta.summary.replace(/<[^>]*>/g, '')}
          </p>
        )}
        <div className="flex items-center gap-4 text-[#999999] text-xs font-[Inter]">
          {meta.readyInMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {meta.readyInMinutes} min
            </span>
          )}
          {meta.servings && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {meta.servings} servings
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Video Card Component
function VideoCard({ video }: { video: SavedItem }) {
  const meta = video.metadata as { title?: string; thumbnail?: string; channelName?: string; duration?: string };
  
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_8px_0_rgba(0,0,0,0.15)] transition-shadow cursor-pointer">
      {meta.thumbnail && (
        <div className="relative w-full h-48">
          <img
            src={meta.thumbnail}
            alt={meta.title || 'Video'}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-8 border-l-white border-y-6 border-y-transparent ml-1" />
            </div>
          </div>
          {meta.duration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded-md">
              <span className="text-white text-xs font-semibold">{meta.duration}</span>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-[#1A1A1A] font-semibold text-base leading-5 mb-1 line-clamp-2 font-[Poppins]">
          {meta.title || 'Untitled Video'}
        </h3>
        {meta.channelName && (
          <p className="text-[#666666] text-sm font-[Inter]">{meta.channelName}</p>
        )}
      </div>
    </div>
  );
}

// Place Card Component
function PlaceCard({ place }: { place: SavedItem }) {
  const meta = place.metadata as { name?: string; address?: string; rating?: number; types?: string[] };
  
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_8px_0_rgba(0,0,0,0.15)] transition-shadow cursor-pointer p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#EA580C] rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#1A1A1A] font-semibold text-base leading-5 mb-1 truncate font-[Poppins]">
            {meta.name || 'Untitled Place'}
          </h3>
          {meta.address && (
            <p className="text-[#666666] text-sm mb-2 line-clamp-2 font-[Inter]">{meta.address}</p>
          )}
          <div className="flex items-center gap-3">
            {meta.rating && (
              <span className="text-[#999999] text-xs font-[Inter]">⭐ {meta.rating}</span>
            )}
            {meta.types && meta.types[0] && (
              <span className="text-[#999999] text-xs font-[Inter]">🍽️ {meta.types[0]}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
