'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Users, Heart, UserPlus, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio?: string;
  location_city?: string;
  location_country?: string;
  followers_count?: number;
  following_count?: number;
  is_master_bot?: boolean;
  last_seen?: string;
  created_at: string;
  savedItemsCount: number;
  friendsCount: number;
  isMasterbot: boolean;
  isCurrentUserFriend: boolean;
  hasPendingRequest: boolean;
}

interface SavedItem {
  id: string;
  item_id: string;
  item_type: string;
  metadata: any;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const username = params?.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentItems, setRecentItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/user-profile/${username}`);
        const result = await response.json();

        if (result.success) {
          setProfile(result.data.user);
          setRecentItems(result.data.recentSavedItems || []);
        } else {
          setError(result.error || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const sendFriendRequest = async () => {
    if (!user || !profile) return;

    setSendingRequest(true);
    
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: user.id,
          requested_id: profile.id,
          message: `Hi ${profile.display_name}! I'd like to connect with you on FUZO.`,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        toast.error('Failed to send friend request');
      } else {
        toast.success('Friend request sent!');
        // Update the profile state
        setProfile(prev => prev ? { ...prev, hasPendingRequest: true } : null);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getItemTitle = (item: SavedItem) => {
    return item.metadata?.title || `${item.item_type} item`;
  };

  const getItemImage = (item: SavedItem) => {
    return item.metadata?.image_url || '/images/placeholder-food.jpg';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const canViewFullProfile = profile.isCurrentUserFriend || profile.isMasterbot || profile.id === user?.id;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
                  {profile.isMasterbot && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      🤖 Masterbot
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-2">@{profile.username}</p>
                
                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}

                {/* Location for masterbots */}
                {profile.isMasterbot && (profile.location_city || profile.location_country) && (
                  <p className="text-gray-600 mb-3">
                    📍 {profile.location_city ? `${profile.location_city}, ` : ''}{profile.location_country}
                  </p>
                )}
                
                <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                  {/* Followers/Following for masterbots */}
                  {profile.isMasterbot && (
                    <>
                      {profile.followers_count !== null && profile.followers_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{profile.followers_count.toLocaleString()} followers</span>
                        </div>
                      )}
                      {profile.following_count !== null && profile.following_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{profile.following_count.toLocaleString()} following</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Standard stats for all users */}
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{profile.savedItemsCount} saved items</span>
                  </div>
                  
                  {!profile.isMasterbot && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{profile.friendsCount} friends</span>
                    </div>
                  )}
                  
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {user && profile.id !== user.id && (
              <div className="flex gap-2">
                {profile.isCurrentUserFriend ? (
                  <>
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button variant="outline">
                      <Heart className="h-4 w-4 mr-2" />
                      View Plate
                    </Button>
                  </>
                ) : profile.hasPendingRequest ? (
                  <Button variant="outline" disabled>
                    ⏳ Request Pending
                  </Button>
                ) : (
                  <Button onClick={sendFriendRequest} disabled={sendingRequest}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {sendingRequest ? 'Sending...' : 'Add Friend'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Saved Items */}
        {canViewFullProfile && recentItems.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Saves</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentItems.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <Image
                    src={getItemImage(item)}
                    alt={getItemTitle(item)}
                    width={300}
                    height={200}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {getItemTitle(item)}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{item.item_type}</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        {!canViewFullProfile && (
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Private Profile</h3>
            <p className="text-gray-600">
              Connect with {profile.display_name} to view their saved items and activity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}