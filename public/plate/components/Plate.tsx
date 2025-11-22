import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '../../ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Settings, Lock, MapPin, Users, User as UserIcon, Image, Video, FileText, Tag, Grid3x3, UserPlus, Check, UserCheck, Mail, MailX } from 'lucide-react';
import { ProfileSettings } from './ProfileSettings';
import { PrivacyPolicy } from './PrivacyPolicy';
import { UniversalViewer } from '../../ui/universal-viewer';
import { usePlateViewer } from '../../../hooks/usePlateViewer';
import { supabase } from '../../../services/supabase';
import FriendService, { type FriendData } from '../../../services/friendService';
import { savedItemsService } from '../../../services';
import { toast } from 'sonner';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
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

export function Plate({ userId, currentUser }: Readonly<PlateProps>) {
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
  
  // âœ… NEW: Comprehensive friend management states
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friends, setFriends] = useState<FriendData[]>([]); // Accepted friends
  const [incomingRequests, setIncomingRequests] = useState<FriendData[]>([]); // Requests I received
  const [outgoingRequests, setOutgoingRequests] = useState<FriendData[]>([]); // Requests I sent
  const [searchResults, setSearchResults] = useState<Array<FriendData & { relationshipStatus: 'none' | 'friend' | 'incoming' | 'outgoing' }>>([]); // User search
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  // Tab data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<SavedItem[]>([]);
  const [recipes, setRecipes] = useState<SavedItem[]>([]);
  const [offers, setOffers] = useState<SavedItem[]>([]);
  const [videos, setVideos] = useState<SavedItem[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]); // Legacy - kept for compatibility
  const [places, setPlaces] = useState<SavedItem[]>([]);

  // Universal Viewer state
  const { viewerState, openViewer, closeViewer, navigateViewer } = usePlateViewer();

  // Confirmation dialog for delete operations
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('ðŸ” Fetching real user profile from Supabase for userId:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      console.log('âœ… User profile fetched successfully:', data);
      
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
      console.log('ðŸ½ï¸ Plate initialized with authenticated user:', currentUser.email);
    } else {
      fetchUserProfile();
    }
  }, [userId, currentUser, fetchUserProfile]);

  const fetchPosts = useCallback(async () => {
    try {
      console.log('ðŸ“ Fetching posts from Supabase for userId:', userId);
      
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

      console.log('âœ… Posts fetched:', data);
      setPosts((data as Post[]) || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  }, [userId]);

  const fetchPhotos = useCallback(async () => {
    try {
      console.log('ðŸ“¸ Fetching photos from Supabase for userId:', userId);
      
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

      console.log('âœ… Photos fetched:', data);
      setPhotos((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    }
  }, [userId]);

  const fetchRecipes = useCallback(async () => {
    try {
      console.log('ðŸ³ Fetching recipes from Supabase for userId:', userId);
      
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

      console.log('âœ… Recipes fetched:', data);
      setRecipes((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setRecipes([]);
    }
  }, [userId]);

  const fetchOffers = useCallback(async () => {
    try {
      console.log('ðŸ·ï¸ Fetching offers from Supabase for userId:', userId);
      
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

      console.log('âœ… Offers fetched:', data);
      setOffers((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    }
  }, [userId]);

  const fetchVideos = useCallback(async () => {
    try {
      console.log('ðŸŽ¥ Fetching videos from Supabase for userId:', userId);
      
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

      console.log('âœ… Videos fetched:', data);
      setVideos((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    }
  }, [userId]);

  // âœ… NEW: Load all friend data using FriendService
  const loadFriendData = useCallback(async () => {
    try {
      setLoadingFriends(true);
      console.log('ðŸ‘¥ Loading comprehensive friend data for userId:', userId);
      
      const response = await FriendService.fetchAllFriendData(userId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load friend data');
      }

      const { friends: friendsList, incomingRequests: incoming, outgoingRequests: outgoing } = response.data;
      
      console.log('âœ… Friend data loaded:', {
        friends: friendsList.length,
        incoming: incoming.length,
        outgoing: outgoing.length
      });

      setFriends(friendsList);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);

      // Also populate legacy crew state for backward compatibility
      const legacyCrew = friendsList.map(f => ({
        id: f.userId,
        name: f.displayName,
        username: f.username,
        avatar: f.avatarUrl
      } as CrewMember));
      setCrew(legacyCrew);

    } catch (error) {
      console.error('âŒ Error loading friend data:', error);
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setCrew([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [userId]);

  // âœ… NEW: Search users with relationship status annotation
  const searchUsersWithStatus = useCallback(async (query: string) => {
    try {
      setLoadingFriends(true);
      console.log('ðŸ” Searching users with query:', query);
      
      const response = await FriendService.searchUsers(userId, query);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to search users');
      }
      
      console.log('âœ… Search results:', response.data.length, 'users');
      setSearchResults(response.data);

    } catch (error) {
      console.error('âŒ Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [userId]);

  // âœ… NEW: Handle friend request actions
  const handleSendRequest = async (targetUserId: string) => {
    try {
      setActionInProgress(targetUserId);
      await FriendService.sendFriendRequest(userId, targetUserId);
      console.log('âœ… Friend request sent to:', targetUserId);
      
      // Refresh search results to update relationship status
      await searchUsersWithStatus(searchQuery);
    } catch (error) {
      console.error('âŒ Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      setActionInProgress(friendshipId);
      await FriendService.acceptFriendRequest(friendshipId);
      console.log('âœ… Friend request accepted:', friendshipId);
      
      // Reload all friend data
      await loadFriendData();
    } catch (error) {
      console.error('âŒ Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      setActionInProgress(friendshipId);
      await FriendService.declineFriendRequest(friendshipId);
      console.log('âœ… Friend request declined:', friendshipId);
      
      // Reload all friend data
      await loadFriendData();
    } catch (error) {
      console.error('âŒ Error declining friend request:', error);
      alert('Failed to decline friend request. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      setActionInProgress(friendshipId);
      await FriendService.cancelFriendRequest(friendshipId);
      console.log('âœ… Friend request cancelled:', friendshipId);
      
      // Reload all friend data
      await loadFriendData();
    } catch (error) {
      console.error('âŒ Error cancelling friend request:', error);
      alert('Failed to cancel friend request. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  // âœ… TODO: Implement remove friend functionality in UI
  // const handleRemoveFriend = async (friendshipId: string) => {
  //   try {
  //     setActionInProgress(friendshipId);
  //     await FriendService.removeFriend(friendshipId);
  //     console.log('âœ… Friend removed:', friendshipId);
  //     
  //     // Reload all friend data
  //     await loadFriendData();
  //   } catch (error) {
  //     console.error('âŒ Error removing friend:', error);
  //     alert('Failed to remove friend. Please try again.');
  //   } finally {
  //     setActionInProgress(null);
  //   }
  // };

  const fetchPlaces = useCallback(async () => {
    try {
      console.log('ðŸ“ Fetching places/restaurants from Supabase for userId:', userId);
      
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

      console.log('âœ… Places fetched:', data);
      setPlaces((data as SavedItem[]) || []);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    }
  }, [userId]);

  // Delete saved item handler with confirmation
  const handleDeleteItem = useCallback(async (itemId: string, itemType: string) => {
    try {
      // Find item name for confirmation dialog
      let itemName = 'this item';
      const allItems = [...recipes, ...photos, ...videos, ...places];
      const item = allItems.find(i => i.id === itemId);
      
      if (item) {
        const meta = item.metadata as Record<string, unknown>;
        itemName = (meta.title as string) || (meta.name as string) || 'this item';
      }

      // Show confirmation dialog
      const confirmed = await showConfirm({
        title: "Remove from Plate?",
        description: `Are you sure you want to remove "${itemName}" from your saved items?`,
        confirmText: "Remove",
        cancelText: "Cancel",
        variant: "destructive",
        icon: "warning"
      });

      if (!confirmed) {
        return;
      }

      // Delete the item
      const result = await savedItemsService.unsaveItem({
        itemId: item?.item_id || '',
        itemType: itemType as 'recipe' | 'video' | 'restaurant' | 'photo'
      });

      if (result.success) {
        toast.success("Removed from Plate");
        
        // Close viewer
        closeViewer();
        
        // Refresh appropriate data based on item type
        switch (itemType) {
          case 'recipe':
            await fetchRecipes();
            break;
          case 'video':
            await fetchVideos();
            break;
          case 'restaurant':
            await fetchPlaces();
            break;
          case 'photo':
            await fetchPhotos();
            break;
        }
      } else {
        toast.error("Failed to remove item");
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error("An error occurred while removing the item");
    }
  }, [recipes, photos, videos, places, showConfirm, closeViewer, fetchRecipes, fetchVideos, fetchPlaces, fetchPhotos]);

  // Fetch all data on initial load for stats display
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchPosts(),
        fetchPhotos(),
        fetchRecipes(),
        fetchOffers(),
        fetchVideos(),
        loadFriendData(), // âœ… NEW: Using FriendService
        fetchPlaces(),
      ]);
    };
    
    fetchAllData();
  }, [userId, fetchPosts, fetchPhotos, fetchRecipes, fetchOffers, fetchVideos, loadFriendData, fetchPlaces]);

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
      } else if (type.includes('crew') || type.includes('friend')) {
        loadFriendData(); // âœ… NEW: Using FriendService
      } else if (type.includes('place')) {
        fetchPlaces();
      } else if (type === 'batch-saved') {
        // Refresh all tabs
        fetchPosts();
        fetchPhotos();
        fetchRecipes();
        fetchOffers();
        fetchVideos();
        loadFriendData(); // âœ… NEW: Using FriendService
        fetchPlaces();
      }
    };

    globalThis.addEventListener('plate-data-update', handlePlateUpdate);
    
    return () => {
      globalThis.removeEventListener('plate-data-update', handlePlateUpdate);
    };
  }, [userId, fetchPosts, fetchPhotos, fetchRecipes, fetchOffers, fetchVideos, loadFriendData, fetchPlaces]);

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
              <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white">
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
              <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white">
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
                  <Card key={`post-${post.id || post.content.substring(0, 20)}-${idx}`}>
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
                    <button 
                      key={photo.id} 
                      className="aspect-square relative group cursor-pointer"
                      onClick={() => openViewer(photo, photos, 'photo')}
                      aria-label={`View ${meta.title || 'photo'}`}
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
                    </button>
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
                            <span>â±ï¸ {meta.readyInMinutes} min</span>
                          )}
                          {meta.servings && (
                            <span>ðŸ½ï¸ {meta.servings} servings</span>
                          )}
                          {meta.healthScore && (
                            <span>ðŸ’š {meta.healthScore}</span>
                          )}
                        </div>
                        {meta.diets && meta.diets.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {meta.diets.slice(0, 3).map((diet: string) => (
                              <span key={diet} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
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
                            <p className="text-neutral-500">ðŸ“ {(meta['restaurant'] as string)}</p>
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
                            {duration && <span>ðŸŽ¬ {duration}</span>}
                            {views && <span>ðŸ‘ï¸ {views} views</span>}
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
                  setSearchQuery('');
                  searchUsersWithStatus(''); // âœ… Load all users
                }}
                className="bg-neutral-900 text-white hover:bg-neutral-800"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </div>

            {/* âœ… NEW: Incoming Friend Requests Section */}
            {incomingRequests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Incoming Requests ({incomingRequests.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {incomingRequests.map((request) => (
                    <Card key={request.friendshipId} className="border-yellow-500 border-2">
                      <CardContent className="flex flex-col items-center p-4 space-y-2">
                        <div className="w-20 h-20 bg-linear-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                          {request.avatarUrl ? (
                            <img 
                              src={request.avatarUrl} 
                              alt={request.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-12 h-12 text-white" />
                          )}
                        </div>
                        <h3 className="font-semibold text-neutral-900 text-center">{request.displayName}</h3>
                        <p className="text-sm text-neutral-500 text-center">@{request.username}</p>
                        <div className="flex gap-2 w-full">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.friendshipId)}
                            disabled={actionInProgress === request.friendshipId}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {actionInProgress === request.friendshipId ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.friendshipId)}
                            disabled={actionInProgress === request.friendshipId}
                            className="flex-1"
                          >
                            <MailX className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* âœ… NEW: Outgoing Friend Requests Section */}
            {outgoingRequests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Sent Requests ({outgoingRequests.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {outgoingRequests.map((request) => (
                    <Card key={request.friendshipId} className="border-blue-500 border-2 opacity-75">
                      <CardContent className="flex flex-col items-center p-4 space-y-2">
                        <div className="w-20 h-20 bg-linear-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                          {request.avatarUrl ? (
                            <img 
                              src={request.avatarUrl} 
                              alt={request.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-12 h-12 text-white" />
                          )}
                        </div>
                        <h3 className="font-semibold text-neutral-900 text-center">{request.displayName}</h3>
                        <p className="text-sm text-neutral-500 text-center">@{request.username}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(request.friendshipId)}
                          disabled={actionInProgress === request.friendshipId}
                          className="w-full"
                        >
                          {actionInProgress === request.friendshipId ? (
                            <span className="animate-pulse">Cancelling...</span>
                          ) : (
                            'Cancel Request'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* âœ… Accepted Friends Section */}
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Friends ({friends.length})
            </h3>

            {crew.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                No crew members yet. Click "Add Friend" to connect with others!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {crew.map((member) => (
                  <Card key={member.id}>
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
                                <span className="text-neutral-500">ðŸ½ï¸ {types[0]}</span>
                              )}
                              {rating && (
                                <span className="text-neutral-500">â­ {rating}</span>
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
        onDelete={handleDeleteItem}
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog />

      {/* âœ… NEW: Enhanced Add Friend Modal with Search & Relationship Status */}
      <Dialog open={showAddFriendModal} onOpenChange={setShowAddFriendModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Add Friends</DialogTitle>
            <DialogDescription>
              Connect with other FuzoFood users and build your crew!
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search users by name or username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsersWithStatus(e.target.value);
              }}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div className="mt-4">
            {(() => {
              if (loadingFriends) {
                return (
                  <div className="text-center py-8 text-neutral-500">
                    Loading users...
                  </div>
                );
              }
              
              if (searchResults.length === 0) {
                const emptyMessage = searchQuery 
                  ? 'No users found matching your search.' 
                  : 'No available users to add at the moment.';
                return (
                  <div className="text-center py-8 text-neutral-500">
                    {emptyMessage}
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 gap-3">
                  {searchResults.map((user) => {
                    const { relationshipStatus } = user;
                    return (
                    <Card key={user.userId} className="hover:shadow-md transition-shadow bg-white">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                              <AvatarFallback>{user.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-sm text-neutral-500">@{user.username}</p>
                            </div>
                          </div>

                          {/* âœ… NEW: Relationship Status Badges & Actions */}
                          {(() => {
                            if (relationshipStatus === 'friend') {
                              return (
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                                  <Check className="w-4 h-4" />
                                  FRIEND
                                </div>
                              );
                            }
                            
                            if (relationshipStatus === 'outgoing') {
                              return (
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-md text-sm font-medium">
                                  <Mail className="w-4 h-4" />
                                  PENDING
                                </div>
                              );
                            }
                            
                            if (relationshipStatus === 'incoming') {
                              return (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                                  <Mail className="w-4 h-4" />
                                  INVITED YOU
                                </div>
                              );
                            }
                            
                            return (
                              <Button
                                onClick={() => handleSendRequest(user.userId)}
                                disabled={actionInProgress === user.userId}
                                className="bg-neutral-900 text-white hover:bg-neutral-800"
                              size="sm"
                            >
                              {actionInProgress === user.userId ? (
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
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

