"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Send } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { YouTubeVideo } from "@/app/api/youtube/videos/route";

interface Friend {
  id: string;
  display_name: string;
  username: string;
  email: string;
}

interface ShareWithCrewDialogProps {
  video: YouTubeVideo;
  trigger?: React.ReactNode;
  onShare?: (selectedFriends: string[], message: string) => void;
}

export function ShareWithCrewDialog({ video, trigger, onShare }: ShareWithCrewDialogProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        requester:requester_id(id, display_name, username, email),
        requested:requested_id(id, display_name, username, email)
      `)
      .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error loading friends:', error);
      return;
    }

    const friendList: Friend[] = [];
    data?.forEach((friendship: any) => {
      if (friendship.requester_id === user.id && friendship.requested) {
        friendList.push(friendship.requested);
      } else if (friendship.requested_id === user.id && friendship.requester) {
        friendList.push(friendship.requester);
      }
    });

    setFriends(friendList);
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadFriends();
    }
  }, [isOpen, user, loadFriends]);

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleShare = async () => {
    if (selectedFriends.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // TODO: Implement actual sharing logic via API
      // For now, we'll just call the onShare callback
      onShare?.(selectedFriends, message);
      
      // Reset state
      setSelectedFriends([]);
      setMessage("");
      setIsOpen(false);
      
      console.log('Sharing video with crew:', {
        videoId: video.id,
        videoTitle: video.title,
        selectedFriends,
        message
      });
      
    } catch (error) {
      console.error('Error sharing video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Users className="h-4 w-4" />
      <span className="ml-1">Share with Crew</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with Crew</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex gap-3">
              <Image 
                src={video.thumbnail} 
                alt={video.title}
                width={80}
                height={48}
                className="object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
              </div>
            </div>
          </div>

          {/* Friends Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select friends to share with:</label>
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any friends yet. Connect with other users to share videos!
              </p>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {friends.map(friend => (
                  <div 
                    key={friend.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                      selectedFriends.includes(friend.id) 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{friend.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{friend.username}</p>
                    </div>
                    {selectedFriends.includes(friend.id) && (
                      <Badge variant="default" className="text-xs">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-2 block">Add a message (optional):</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Check out this amazing cooking video!"
              className="min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={selectedFriends.length === 0 || isLoading}
            >
              {isLoading ? (
                <>Sharing...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Share ({selectedFriends.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareWithCrewDialog;