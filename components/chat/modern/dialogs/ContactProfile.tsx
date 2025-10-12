'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Phone,
  Video,
  MoreHorizontal,
  UserMinus,
  Flag,
  Shield,
  Clock,
  Users,
  Star,
  Heart,
  ArrowLeft,
  Share,
  Settings,
  Bell,
  BellOff,
} from 'lucide-react';
import { ChatUser } from '../utils/ChatTypes';

interface ContactProfileProps {
  contact: ChatUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat?: (contactId: string) => void;
  onStartCall?: (contactId: string, type: 'voice' | 'video') => void;
  onBlock?: (contactId: string) => void;
  onReport?: (contactId: string) => void;
  onAddToCloseFriends?: (contactId: string) => void;
  onRemoveFromCloseFriends?: (contactId: string) => void;
}

interface MutualFriend {
  id: string;
  name: string;
  avatar_url: string;
}

interface SharedMedia {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnail?: string;
  timestamp: string;
}

export function ContactProfile({
  contact,
  open,
  onOpenChange,
  onStartChat,
  onStartCall,
  onBlock,
  onReport,
  onAddToCloseFriends,
  onRemoveFromCloseFriends,
}: ContactProfileProps) {
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [sharedMedia, setSharedMedia] = useState<SharedMedia[]>([]);
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (contact && open) {
      loadContactDetails(contact.id);
    }
  }, [contact, open]);

  const loadContactDetails = async (contactId: string) => {
    try {
      // Mock data - replace with actual API calls
      const mockMutualFriends: MutualFriend[] = [
        {
          id: 'mutual1',
          name: 'John Doe',
          avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',
        },
        {
          id: 'mutual2',
          name: 'Jane Smith',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612d8b0?w=150&h=150&fit=crop&crop=face',
        },
        {
          id: 'mutual3',
          name: 'Mike Wilson',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        },
      ];

      const mockSharedMedia: SharedMedia[] = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
          timestamp: '2024-10-10T15:30:00Z',
        },
        {
          id: 'media2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop',
          timestamp: '2024-10-09T12:15:00Z',
        },
        {
          id: 'media3',
          type: 'video',
          url: 'https://example.com/video1.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
          timestamp: '2024-10-08T18:45:00Z',
        },
      ];

      setMutualFriends(mockMutualFriends);
      setSharedMedia(mockSharedMedia);
      setIsCloseFriend(false);
      setIsMuted(false);
      setIsBlocked(false);
    } catch (error) {
      console.error('Failed to load contact details:', error);
    }
  };

  const handleToggleCloseFriend = () => {
    if (!contact) return;
    
    if (isCloseFriend) {
      onRemoveFromCloseFriends?.(contact.id);
    } else {
      onAddToCloseFriends?.(contact.id);
    }
    setIsCloseFriend(!isCloseFriend);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement mute/unmute API call
  };

  const handleBlock = () => {
    if (contact) {
      onBlock?.(contact.id);
      setIsBlocked(true);
      onOpenChange(false);
    }
  };

  const handleReport = () => {
    if (contact) {
      onReport?.(contact.id);
      onOpenChange(false);
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header with back button */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="font-medium">Contact Info</h2>
          
          <Button variant="ghost" size="sm" className="p-2">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Profile Section */}
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-24 h-24">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={contact.avatar_url} alt={contact.display_name} />
                  <AvatarFallback className="text-2xl">
                    {contact.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {contact.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                )}
              </div>

              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {contact.display_name}
                </h1>
                <p className="text-gray-500">@{contact.username}</p>
                {contact.status_message && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    &quot;{contact.status_message}&quot;
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2">
                {contact.is_online ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatLastSeen(contact.last_seen)}
                  </Badge>
                )}
                {isCloseFriend && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <Star className="w-3 h-3 mr-1" />
                    Close Friend
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartChat?.(contact.id)}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Message</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartCall?.(contact.id, 'voice')}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Phone className="h-5 w-5" />
                <span className="text-xs">Call</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartCall?.(contact.id, 'video')}
                className="flex flex-col items-center space-y-1 h-auto py-3"
              >
                <Video className="h-5 w-5" />
                <span className="text-xs">Video</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleCloseFriend}
                className={`flex flex-col items-center space-y-1 h-auto py-3 ${
                  isCloseFriend ? 'bg-orange-50 text-orange-700 border-orange-200' : ''
                }`}
              >
                {isCloseFriend ? (
                  <Heart className="h-5 w-5 fill-current" />
                ) : (
                  <Star className="h-5 w-5" />
                )}
                <span className="text-xs">
                  {isCloseFriend ? 'Close' : 'Favorite'}
                </span>
              </Button>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Contact Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Privacy</p>
                      <p className="text-xs text-gray-500">
                        {contact.privacy_settings.show_online_status ? 'Shows online status' : 'Hidden online status'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mutual Friends */}
            {mutualFriends.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {mutualFriends.length} Mutual Friend{mutualFriends.length > 1 ? 's' : ''}
                  </h3>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {mutualFriends.slice(0, 6).map((friend) => (
                    <div key={friend.id} className="text-center">
                      <Avatar className="h-12 w-12 mx-auto mb-1">
                        <AvatarImage src={friend.avatar_url} alt={friend.name} />
                        <AvatarFallback className="text-xs">
                          {friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs text-gray-700 truncate">
                        {friend.name.split(' ')[0]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Media */}
            {sharedMedia.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Shared Media ({sharedMedia.length})
                  </h3>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.slice(0, 6).map((media) => (
                    <div
                      key={media.id}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={media.thumbnail || media.url}
                        alt="Shared media"
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                      {media.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy & Security */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Privacy & Security</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Bell className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Notifications</p>
                      <p className="text-xs text-gray-500">
                        {isMuted ? 'Muted' : 'Enabled'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleToggleMute}>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Block Contact</p>
                      <p className="text-xs text-gray-500">
                        Prevent messages and calls
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleBlock} className="text-red-600">
                    Block
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Flag className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Report Contact</p>
                      <p className="text-xs text-gray-500">
                        Report spam or abuse
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReport} className="text-red-600">
                    Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}