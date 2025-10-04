'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { SaveAndShare } from '@/components/SaveAndShare';

interface SavedItem {
  id: string;
  item_id: string;
  item_type: string;
  metadata: any;
  created_at: string;
}

interface FriendProfile {
  id: string;
  display_name: string;
  username: string;
  email: string;
}

interface FriendPlateProps {
  friendId: string;
  onBack?: () => void;
}

export function FriendPlate({ friendId, onBack }: FriendPlateProps) {
  const { user } = useAuth();
  const [friend, setFriend] = useState<FriendProfile | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFriendPlate = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/view-friend-plate?friendId=${friendId}`);
        const result = await response.json();

        if (result.success) {
          setFriend(result.data.friend);
          setSavedItems(result.data.savedItems);
        } else {
          setError(result.error || 'Failed to load friend\'s plate');
          toast.error(result.error || 'Failed to load friend\'s plate');
        }
      } catch (error) {
        console.error('Error loading friend\'s plate:', error);
        setError('Failed to load friend\'s plate');
        toast.error('Failed to load friend\'s plate');
      } finally {
        setIsLoading(false);
      }
    };

    loadFriendPlate();
  }, [friendId]);

  const reloadFriendPlate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/view-friend-plate?friendId=${friendId}`);
      const result = await response.json();

      if (result.success) {
        setFriend(result.data.friend);
        setSavedItems(result.data.savedItems);
      } else {
        setError(result.error || 'Failed to load friend\'s plate');
        toast.error(result.error || 'Failed to load friend\'s plate');
      }
    } catch (error) {
      console.error('Error loading friend\'s plate:', error);
      setError('Failed to load friend\'s plate');
      toast.error('Failed to load friend\'s plate');
    } finally {
      setIsLoading(false);
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
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold">Friend&apos;s Plate</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={reloadFriendPlate}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">{friend?.display_name}&apos;s Plate</h1>
          <p className="text-gray-600">@{friend?.username}</p>
        </div>
      </div>

      {/* Items Grid */}
      {savedItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            No saved items yet
          </h3>
          <p className="text-gray-400">
            {friend?.display_name} hasn&apos;t saved any items to their plate yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="relative">
                <Image
                  src={getItemImage(item)}
                  alt={getItemTitle(item)}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                {/* Item type badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full capitalize">
                    {item.item_type}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {getItemTitle(item)}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>Saved {formatDate(item.created_at)}</span>
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center">
                  <SaveAndShare
                    itemId={item.item_id}
                    itemType={item.item_type as any}
                    title={getItemTitle(item)}
                    imageUrl={getItemImage(item)}
                    size="sm"
                    showShareButton={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}