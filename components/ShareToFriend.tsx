'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';

interface ShareToFriendProps {
  itemId: string;
  itemType: 'restaurant' | 'recipe';
  title: string;
  imageUrl?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface Friend {
  id: string;
  display_name: string;
  username: string;
  email: string;
}

export function ShareToFriend({
  itemId,
  itemType,
  title,
  imageUrl,
  variant = 'button',
  size = 'md',
  className = ''
}: ShareToFriendProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadFriends = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          requester:requester_id(id, display_name, username, email),
          requested:requested_id(id, display_name, username, email)
        `)
        .or(`requester_id.eq.${user?.id},requested_id.eq.${user?.id}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      // Extract friend data (the other user in each friendship)
      const friendsData = data?.map((req: any) => {
        return req.requester_id === user?.id ? req.requested : req.requester;
      }) || [];

      setFriends(friendsData);
    };

    if (showDialog && user) {
      loadFriends();
    }
  }, [showDialog, user]);

  const handleShare = async () => {
    if (!selectedFriend || !user) {
      toast.error('Please select a friend to share with');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/share-to-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendId: selectedFriend,
          itemType,
          itemId,
          itemTitle: title,
          itemImageUrl: imageUrl,
          message: message || `Check out this ${itemType} I found!`
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setShowDialog(false);
        setSelectedFriend('');
        setMessage('');
      } else {
        toast.error(result.error || 'Failed to share item');
      }
    } catch (error) {
      console.error('Error sharing item:', error);
      toast.error('Failed to share item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (!user) {
      toast.error('Please sign in to share with friends');
      return;
    }
    setShowDialog(true);
  };

  const buttonSizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  };

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClick}
          className={`${buttonSizes[size]} ${className}`}
          title="Share with friend"
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share with Friend</DialogTitle>
              <DialogDescription>
                Share &ldquo;{title}&rdquo; with one of your friends
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any friends yet. Connect with other users to share your favorite {itemType}s!
                </p>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Select Friend:</label>
                    <select
                      value={selectedFriend}
                      onChange={(e) => setSelectedFriend(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="">Choose a friend...</option>
                      {friends.map(friend => (
                        <option key={friend.id} value={friend.id}>
                          {friend.display_name} (@{friend.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Message (optional):</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Check out this ${itemType} I found!`}
                      className="w-full mt-1 p-2 border rounded-md"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleShare}
                      disabled={isLoading || !selectedFriend}
                      className="flex-1"
                    >
                      {isLoading ? 'Sharing...' : 'Share'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className={`${buttonSizes[size]} ${className}`}
      >
        <Users className="h-4 w-4 mr-2" />
        Share with Friend
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share with Friend</DialogTitle>
            <DialogDescription>
              Share &ldquo;{title}&rdquo; with one of your friends
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any friends yet. Connect with other users to share your favorite {itemType}s!
              </p>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">Select Friend:</label>
                  <select
                    value={selectedFriend}
                    onChange={(e) => setSelectedFriend(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">Choose a friend...</option>
                    {friends.map(friend => (
                      <option key={friend.id} value={friend.id}>
                        {friend.display_name} (@{friend.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Message (optional):</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Check out this ${itemType} I found!`}
                    className="w-full mt-1 p-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleShare}
                    disabled={isLoading || !selectedFriend}
                    className="flex-1"
                  >
                    {isLoading ? 'Sharing...' : 'Share'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}