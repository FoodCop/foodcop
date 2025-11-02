import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '../../ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Settings, Lock, MapPin, Users, Image, Video, FileText, Tag, Grid3x3, UserPlus, X, Check } from 'lucide-react';
import { ProfileSettings } from './ProfileSettings';
import { PrivacyPolicy } from './PrivacyPolicy';
import { UniversalViewer } from '../../ui/universal-viewer';
import { usePlateViewer } from '../../../hooks/usePlateViewer';
import { supabase } from '../../../services/supabase';
import type { AuthUser } from '../../../types/auth';
import type { User } from '@supabase/supabase-js';
import type { SavedItem, PhotoMetadata, RecipeMetadata } from '../../../types/plate';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

// Local simplified crew member shape used by the UI (mapped from friend_requests rows)
interface CrewMember {
  id: string;
  name?: string;
  username?: string;
  avatar?: string;
}

interface PlateProps {
  userId: string;
  currentUser?: User;
}

export function Plate({ userId, currentUser }: PlateProps) {
  // Convert Supabase User to AuthUser
  const convertToAuthUser = (supabaseUser: User): AuthUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    created_at: supabaseUser.created_at,
    metadata: supabaseUser.user_metadata
  });

  const [user, setUser] = useState<AuthUser | null>(
    currentUser ? convertToAuthUser(currentUser) : null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  // Add Friend modal states
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [allUsers, setAllUsers] = useState<CrewMember[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  
  // Tab data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<SavedItem[]>([]);
  const [recipes, setRecipes] = useState<SavedItem[]>([]);
  const [offers, setOffers] = useState<SavedItem[]>([]);
  const [videos, setVideos] = useState<SavedItem[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [places, setPlaces] = useState<SavedItem[]>([]);

  // Universal Viewer state
  const { viewerState, openViewer, closeViewer, navigateViewer } = usePlateViewer();

  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('🔍 Fetching real user profile from Supabase for userId:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      console.log('✅ User profile fetched successfully:', data);
      
      // Transform Supabase user data to match AuthUser interface
      const transformedUser = {
        id: data.id,
        email: data.email,
        name: data.display_name || data.first_name ? `${data.first_name} ${data.last_name}`.trim() : data.username,
        avatar_url: data.avatar_url,
        username: data.username,
        bio: data.bio,
        location_city: data.location_city,
        location_country: data.location_country,
        location_state: data.location_state,
        total_points: data.total_points,
        followers_count: data.followers_count,
        following_count: data.following_count,
        dietary_preferences: data.dietary_preferences,
        cuisine_preferences: data.cuisine_preferences,
        spice_tolerance: data.spice_tolerance,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setUser(transformedUser as AuthUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Initialize user from props if available, otherwise fetch profile
    if (currentUser) {
      setUser(convertToAuthUser(currentUser));
      setLoading(false);
      console.log('🍽️ Plate initialized with authenticated user:', currentUser.email);
    } else {
      fetchUserProfile();
    }
  }, [userId, currentUser, fetchUserProfile]);

  const fetchPosts = useCallback(async () => {
    try {
      console.log('📝 Fetching posts from Supabase for userId:', userId);
      
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

      console.log('✅ Posts fetched:', data);
      setPosts((data as Post[]) || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  }, [userId]);

  const fetchPhotos = useCallback(async () => {
    try {
      console.log('📸 Fetching photos from Supabase for userId:', userId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'photo')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
        setPhotos([]);
        return;
      }

      console.log('✅ Photos fetched:', data);
      setPhotos((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    }
  }, [userId]);

  const fetchRecipes = useCallback(async () => {
    try {
      console.log('🍳 Fetching recipes from Supabase for userId:', userId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'recipe')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error);
        setRecipes([]);
        return;
      }

      console.log('✅ Recipes fetched:', data);
      setRecipes((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes([]);
    }
  }, [userId]);

  const fetchOffers = useCallback(async () => {
    try {
      console.log('🏷️ Fetching offers from Supabase for userId:', userId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'offer')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching offers:', error);
        setOffers([]);
        return;
      }

      console.log('✅ Offers fetched:', data);
      setOffers((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    }
  }, [userId]);

  const fetchVideos = useCallback(async () => {
    try {
      console.log('🎥 Fetching videos from Supabase for userId:', userId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'other')
        .eq('metadata->>content_type', 'video') // Use ->> for text extraction from JSONB
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        setVideos([]);
        return;
      }

      console.log('✅ Videos fetched:', data);
      setVideos((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    }
  }, [userId]);

  const fetchCrew = useCallback(async () => {
    try {
      console.log('👥 Fetching crew (friends) from Supabase for userId:', userId);
      
      // Fetch friends - people I'm following and who follow me back
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching crew:', error);
        setCrew([]);
        return;
      }

      console.log('📦 Friend requests fetched:', data);

      // Extract unique friend user IDs (the other person in each friendship)
      const friendIds = (data as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        const requesterId = r['requester_id'] as string;
        const requestedId = r['requested_id'] as string;
        // Return the ID that's NOT the current user
        return requesterId === userId ? requestedId : requesterId;
      });

      console.log('👥 Friend IDs to fetch:', friendIds);

      if (friendIds.length === 0) {
        setCrew([]);
        return;
      }

      // Fetch user profiles for all friends
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_url')
        .in('id', friendIds);

      if (profileError) {
        console.error('Error fetching friend profiles:', profileError);
        setCrew([]);
        return;
      }

      console.log('✅ Friend profiles fetched:', profiles);

      // Map to CrewMember shape
      const mapped = (profiles || []).map((profile) => ({
        id: profile.id,
        name: profile.display_name || profile.username || profile.id,
        username: profile.username,
        avatar: profile.avatar_url,
      } as CrewMember));

      console.log('✅ Crew members mapped:', mapped);
      setCrew(mapped);
    } catch (error) {
      console.error('Error fetching crew:', error);
      setCrew([]);
    }
  }, [userId]);

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      console.log('👥 Fetching all users from Supabase');
      
      // Get all users except the current user and existing friends
      const { data: users, error } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_url')
        .neq('id', userId)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error fetching all users:', error);
        setAllUsers([]);
        return;
      }

      // Get existing friend IDs to filter them out
      const friendIds = crew.map(member => member.id);

      // Get pending/sent friend requests
      const { data: requests } = await supabase
        .from('friend_requests')
        .select('requester_id, requested_id')
        .or(`requester_id.eq.${userId},requested_id.eq.${userId}`);

      const requestedIds = new Set(
        (requests || []).map((req: Record<string, unknown>) => {
          const requesterId = req['requester_id'] as string;
          const requestedId = req['requested_id'] as string;
          return requesterId === userId ? requestedId : requesterId;
        })
      );

      // Filter out current user, friends, and users with pending requests
      const availableUsers = (users || [])
        .filter(user => !friendIds.includes(user.id) && !requestedIds.has(user.id))
        .map(user => ({
          id: user.id,
          name: user.display_name || user.username || user.id,
          username: user.username,
          avatar: user.avatar_url,
        } as CrewMember));

      console.log('✅ Available users fetched:', availableUsers);
      setAllUsers(availableUsers);
    } catch (error) {
      console.error('Error fetching all users:', error);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [userId, crew]);

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      setSendingRequest(targetUserId);
      console.log('📤 Sending friend request to:', targetUserId);

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: userId,
          requested_id: targetUserId,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error sending friend request:', error);
        alert('Failed to send friend request. Please try again.');
        return;
      }

      console.log('✅ Friend request sent successfully');
      // Mark request as sent instead of removing the user
      setSentRequests(prev => new Set([...prev, targetUserId]));
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  };

  const fetchPlaces = useCallback(async () => {
    try {
      console.log('📍 Fetching places/restaurants from Supabase for userId:', userId);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'restaurant')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching places:', error);
        setPlaces([]);
        return;
      }

      console.log('✅ Places fetched:', data);
      setPlaces((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    }
  }, [userId]);

  // Fetch all data on initial load for stats display
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchPosts(),
        fetchPhotos(),
        fetchRecipes(),
        fetchOffers(),
        fetchVideos(),
        fetchCrew(),
        fetchPlaces(),
      ]);
    };
    
    fetchAllData();
  }, [userId, fetchPosts, fetchPhotos, fetchRecipes, fetchOffers, fetchVideos, fetchCrew, fetchPlaces]);

  // Listen for external data updates
  useEffect(() => {
    const handlePlateUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, userId: eventUserId, data } = customEvent.detail;
      
      // Only process events for this user
      if (eventUserId !== userId) return;
      
      console.log('Plate received update:', type, data);
      
      // Refresh the appropriate tab based on event type
      if (type.includes('post')) {
        fetchPosts();
      } else if (type.includes('photo')) {
        fetchPhotos();
      } else if (type.includes('recipe')) {
        fetchRecipes();
      } else if (type.includes('offer')) {
        fetchOffers();
      } else if (type.includes('video')) {
        fetchVideos();
      } else if (type.includes('crew')) {
        fetchCrew();
      } else if (type.includes('place')) {
        fetchPlaces();
      } else if (type === 'batch-saved') {
        // Refresh all tabs
        fetchPosts();
        fetchPhotos();
        fetchRecipes();
        fetchOffers();
        fetchVideos();
        fetchCrew();
        fetchPlaces();
      }
    };

    window.addEventListener('plate-data-update', handlePlateUpdate);
    
    return () => {
      window.removeEventListener('plate-data-update', handlePlateUpdate);
    };
  }, [userId, fetchPosts, fetchPhotos, fetchRecipes, fetchOffers, fetchVideos, fetchCrew, fetchPlaces]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatar_url} alt={user.name || user.email} />
              <AvatarFallback>{(user.name || user.email)?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="mb-1">{user.name || 'Anonymous User'}</h1>
              <p className="text-neutral-500 mb-3">@{user.username || user.email?.split('@')[0] || 'user'}</p>
              {user.bio && <p className="max-w-md">{user.bio}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4 text-neutral-700" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                  <SheetDescription>
                    Manage your profile information and preferences
                  </SheetDescription>
                </SheetHeader>
                <ProfileSettings 
                  userId={userId} 
                  user={user} 
                  onUpdate={(updatedUser) => {
                    setUser(updatedUser);
                    setShowSettings(false);
                  }} 
                />
              </SheetContent>
            </Sheet>

            <Sheet open={showPrivacy} onOpenChange={setShowPrivacy}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Lock className="w-4 h-4 text-neutral-700" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Privacy Policy</SheetTitle>
                  <SheetDescription>
                    Read our privacy policy and data handling practices
                  </SheetDescription>
                </SheetHeader>
                <PrivacyPolicy />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-6 flex-wrap">
          <div>
            <span className="mr-1 font-semibold">{posts.length}</span>
            <span className="text-neutral-500">Posts</span>
          </div>
          <div>
            <span className="mr-1 font-semibold">{photos.length}</span>
            <span className="text-neutral-500">Photos</span>
          </div>
          <div>
            <span className="mr-1 font-semibold">{recipes.length}</span>
            <span className="text-neutral-500">Recipes</span>
          </div>
          <div>
            <span className="mr-1 font-semibold">{places.length}</span>
            <span className="text-neutral-500">Places</span>
          </div>
          <div>
            <span className="mr-1 font-semibold">{videos.length}</span>
            <span className="text-neutral-500">Videos</span>
          </div>
          <div>
            <span className="mr-1 font-semibold">{crew.length}</span>
            <span className="text-neutral-500">Crew</span>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto mb-6 -mx-4 px-4">
            <TabsList className="inline-flex w-auto min-w-full justify-start bg-neutral-100">
              <TabsTrigger value="posts" className="gap-1 sm:gap-2 shrink-0">
                <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-1 sm:gap-2 shrink-0">
                <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="recipes" className="gap-1 sm:gap-2 shrink-0">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Recipes</span>
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-1 sm:gap-2 shrink-0">
                <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Offers</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-1 sm:gap-2 shrink-0">
                <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Videos</span>
              </TabsTrigger>
              <TabsTrigger value="crew" className="gap-1 sm:gap-2 shrink-0">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Crew</span>
              </TabsTrigger>
              <TabsTrigger value="places" className="gap-1 sm:gap-2 shrink-0">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Places</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="posts">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No posts yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <p className="mb-3">{post.content}</p>
                      {post.image && (
                        <img 
                          src={post.image} 
                          alt="Post" 
                          className="mt-4 rounded-lg w-full object-cover"
                        />
                      )}
                      {post.created_at && (
                        <p className="text-neutral-400 mt-3">
                          {new Date(post.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos">
            {photos.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No photos yet</div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo) => {
                  const meta = photo.metadata as PhotoMetadata;
                  return (
                    <div 
                      key={photo.id} 
                      className="aspect-square relative group cursor-pointer"
                      onClick={() => openViewer(photo, photos, 'photo')}
                    >
                      <img
                        src={meta.image_url || meta.image}
                        alt={meta.title || 'Food Photo'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                        <div className="text-white text-sm opacity-0 group-hover:opacity-100 text-center p-2">
                          <p className="font-medium">{meta.title}</p>
                          {meta.restaurant_name && (
                            <p className="text-xs">{meta.restaurant_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recipes">
            {recipes.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No recipes yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => {
                  const meta = recipe.metadata as RecipeMetadata;
                  return (
                    <Card 
                      key={recipe.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => openViewer(recipe, recipes, 'recipe')}
                    >
                      <CardContent className="pt-6">
                        <h3 className="font-semibold mb-2">{meta.title}</h3>
                        <p className="text-neutral-600 mb-3 text-sm line-clamp-3">{meta.summary}</p>
                        {meta.image && (
                          <img 
                            src={meta.image} 
                            alt={meta.title} 
                            className="rounded-lg w-full object-cover mb-3 h-32"
                          />
                        )}
                        <div className="flex gap-4 text-neutral-500 text-sm">
                          {meta.readyInMinutes && (
                            <span>⏱️ {meta.readyInMinutes} min</span>
                          )}
                          {meta.servings && (
                            <span>🍽️ {meta.servings} servings</span>
                          )}
                          {meta.healthScore && (
                            <span>💚 {meta.healthScore}</span>
                          )}
                        </div>
                        {meta.diets && meta.diets.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {meta.diets.slice(0, 3).map((diet: string, idx: number) => (
                              <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {diet}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers">
            {offers.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No offers or ads yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.map((offer) => {
                  const meta = offer.metadata as Record<string, unknown>;
                  return (
                    <Card key={offer.id}>
                      <CardContent className="pt-6">
                        <h3 className="mb-2">{(meta['title'] as string) || ''}</h3>
                        <p className="text-neutral-600 mb-3">{(meta['description'] as string) || ''}</p>
                        <div className="flex items-center justify-between">
                          {(meta['discount'] as number | undefined) && (
                            <div className="inline-block px-3 py-1 bg-neutral-900 text-white rounded">
                              {(meta['discount'] as number)}% OFF
                            </div>
                          )}
                          {(meta['restaurant'] as string | undefined) && (
                            <p className="text-neutral-500">📍 {(meta['restaurant'] as string)}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos">
            {videos.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No videos yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video) => {
                  const meta = video.metadata as Record<string, unknown>;
                  const title = (meta['title'] as string) || '';
                  const thumbnail = meta['thumbnail'] as string | undefined;
                  const duration = meta['duration'] as number | undefined;
                  const views = meta['views'] as number | undefined;
                  return (
                    <Card 
                      key={video.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => openViewer(video, videos, 'video')}
                    >
                      <CardContent className="pt-6">
                        <h3 className="mb-3">{title}</h3>
                        {thumbnail && (
                          <div className="relative mb-3">
                            <img 
                              src={thumbnail} 
                              alt={title} 
                              className="rounded-lg w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                <Video className="w-6 h-6 text-neutral-900" />
                              </div>
                            </div>
                          </div>
                        )}
                        {(duration || views) && (
                          <div className="flex gap-4 text-neutral-500">
                            {duration && <span>🎬 {duration}</span>}
                            {views && <span>👁️ {views} views</span>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="crew">
            <div className="mb-6">
              <Button 
                onClick={() => {
                  setShowAddFriendModal(true);
                  fetchAllUsers();
                }}
                className="bg-neutral-900 text-white hover:bg-neutral-800"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </div>

            {crew.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                No crew members yet. Click "Add Friend" to connect with others!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {crew.map((member, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6 text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-3">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p>{member.name}</p>
                      <p className="text-neutral-500">@{member.username}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="places">
            {places.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No places yet</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {places.map((place) => {
                  const meta = place.metadata as Record<string, unknown>;
                  const name = meta.name as string;
                  const address = (meta.address as string) || (meta.formatted_address as string) || (meta.vicinity as string) || '';
                  const types = meta.types as string[] | undefined;
                  const rating = meta.rating as number | undefined;
                  const priceLevel = meta.price_level as number | undefined;
                  return (
                    <Card 
                      key={place.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => openViewer(place, places, 'restaurant')}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-neutral-500 mt-1 shrink-0" />
                          <div className="flex-1">
                            <h3 className="mb-1">{name}</h3>
                            <p className="text-neutral-600 mb-2">{address}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {types && types.length > 0 && (
                                <span className="text-neutral-500">🍽️ {types[0]}</span>
                              )}
                              {rating && (
                                <span className="text-neutral-500">⭐ {rating}</span>
                              )}
                              {priceLevel !== undefined && (
                                <span className="text-neutral-500">{`Price: ${priceLevel}`}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Universal Viewer Modal */}
      <UniversalViewer 
        state={viewerState}
        onClose={closeViewer}
        onNavigate={navigateViewer}
      />

      {/* Add Friend Modal */}
      <Dialog open={showAddFriendModal} onOpenChange={setShowAddFriendModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Add Friends</DialogTitle>
            <DialogDescription>
              Connect with other FuzoFood users and build your crew!
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loadingUsers ? (
              <div className="text-center py-8 text-neutral-500">
                Loading users...
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No available users to add at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {allUsers.map((availableUser) => {
                  const isPending = sentRequests.has(availableUser.id);
                  return (
                    <Card key={availableUser.id} className="hover:shadow-md transition-shadow bg-white">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={availableUser.avatar} alt={availableUser.name} />
                              <AvatarFallback>{availableUser.name?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{availableUser.name}</p>
                              <p className="text-sm text-neutral-500">@{availableUser.username || 'user'}</p>
                            </div>
                          </div>
                          {isPending ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-md text-sm font-medium">
                              <Check className="w-4 h-4" />
                              PENDING
                            </div>
                          ) : (
                            <Button
                              onClick={() => sendFriendRequest(availableUser.id)}
                              disabled={sendingRequest === availableUser.id}
                              className="bg-neutral-900 text-white hover:bg-neutral-800"
                              size="sm"
                            >
                              {sendingRequest === availableUser.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Add Friend
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
