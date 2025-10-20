'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Users, MessageCircle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { RecipeData, ShareTarget } from './types/ShareTypes';
import { useChatService } from '../hooks/useChatService';
import RecipeShareCard from './RecipeShareCard';

interface RecipeShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (targets: ShareTarget[], message?: string) => void;
  recipe: RecipeData;
}

export default function RecipeShareDialog({
  isOpen,
  onClose,
  onShare,
  recipe
}: RecipeShareDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<ShareTarget[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [contacts, setContacts] = useState<ShareTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Use the shared chat service
  const { loadContacts: loadChatContacts } = useChatService();

  const loadContactsFromService = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the shared chat service instead of duplicating contact loading
      const chatContacts = await loadChatContacts();
      const shareTargets: ShareTarget[] = chatContacts.map(contact => ({
        id: contact.id,
        display_name: contact.display_name,
        type: 'user' as const,
        username: contact.username,
        avatar_url: contact.avatar_url,
        is_master_bot: false
      }));
      setContacts(shareTargets);
    } catch (error) {
      console.error('Error loading contacts for sharing:', error);
      // Fallback to mock data if shared service fails
      const mockContacts: ShareTarget[] = [
        {
          id: 'f2e517b0-7dd2-4534-a678-5b64d4795b3a',
          display_name: 'Anika Kapoor',
          type: 'user',
          username: 'spice_scholar_anika',
          is_master_bot: true
        },
        {
          id: '78de3261-040d-492e-b511-50f71c0d9986',
          display_name: 'Sebastian LeClair',
          type: 'user',
          username: 'sommelier_seb',
          is_master_bot: true
        },
        {
          id: '2400b343-0e89-43f7-b3dc-6883fa486da3',
          display_name: 'Lila Cheng',
          type: 'user',
          username: 'plant_pioneer_lila',
          is_master_bot: true
        },
        {
          id: 'user-2',
          display_name: 'John Smith',
          type: 'user',
          username: 'john_smith'
        },
        {
          id: 'user-3',
          display_name: 'Sarah Wilson',
          type: 'user',
          username: 'sarah_wilson'
        },
        {
          id: 'group-2',
          display_name: 'Recipe Lovers',
          type: 'group'
        },
        {
          id: 'group-3',
          display_name: 'Healthy Eating',
          type: 'group'
        }
      ];
      setContacts(mockContacts);
    } finally {
      setIsLoading(false);
    }
  }, [loadChatContacts]);

  // Load contacts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadContactsFromService();
    }
  }, [isOpen, loadContactsFromService]);

  const filteredContacts = contacts.filter(contact =>
    contact.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTargetToggle = (target: ShareTarget, checked: boolean) => {
    if (checked) {
      setSelectedTargets(prev => [...prev, target]);
    } else {
      setSelectedTargets(prev => prev.filter(t => t.id !== target.id));
    }
  };

  const handleShare = async () => {
    if (selectedTargets.length === 0) return;
    
    setIsSending(true);
    try {
      await onShare(selectedTargets, shareMessage.trim() || undefined);
      
      // Reset form
      setSelectedTargets([]);
      setShareMessage('');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error sharing recipe:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getContactIcon = (contact: ShareTarget) => {
    if (contact.type === 'group') {
      return <Users className="w-4 h-4" />;
    }
    if (contact.is_master_bot) {
      return <span className="text-sm">🤖</span>;
    }
    return <MessageCircle className="w-4 h-4" />;
  };

  const getAvatarFallback = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getSuggestedMessage = (recipe: RecipeData): string => {
    const suggestions = [
      `Check out this ${recipe.difficulty.toLowerCase()} recipe!`,
      `Found this delicious ${recipe.category?.toLowerCase() || 'recipe'} to try!`,
      `This ${formatTime(recipe.cooking_time)} recipe looks amazing!`,
      `Perfect recipe for ${recipe.servings || '4'} people!`
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}-minute`;
    return `${Math.floor(minutes / 60)}-hour`;
  };

  const handleSuggestedMessage = () => {
    if (!shareMessage.trim()) {
      setShareMessage(getSuggestedMessage(recipe));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Share Recipe</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Recipe Preview */}
          <div className="flex-shrink-0">
            <RecipeShareCard
              message={{
                type: 'recipe',
                recipe,
                shared_by_user_id: 'current-user',
                shared_at: new Date().toISOString()
              }}
              isPreview={true}
              className="scale-90 transform -mx-4"
            />
          </div>

          {/* Contact Search */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedTargets.some(t => t.id === contact.id);
                  
                  return (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleTargetToggle(contact, !isSelected)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleTargetToggle(contact, !!checked)}
                      />
                      
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar_url} alt={contact.display_name} />
                        <AvatarFallback className="text-xs">
                          {getAvatarFallback(contact.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.display_name}
                          </p>
                          {getContactIcon(contact)}
                        </div>
                        {contact.username && (
                          <p className="text-xs text-gray-500">@{contact.username}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {filteredContacts.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No contacts found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional Message */}
          <div className="flex-shrink-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Add a message (optional)
                </label>
                {!shareMessage.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggestedMessage}
                    className="text-xs h-6 px-2"
                  >
                    Suggest
                  </Button>
                )}
              </div>
              <Textarea
                placeholder="Tell them why you're sharing this recipe..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="min-h-[60px] max-h-[120px]"
                maxLength={500}
              />
              {shareMessage.length > 0 && (
                <p className="text-xs text-gray-500">
                  {shareMessage.length}/500 characters
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={selectedTargets.length === 0 || isSending}
              className="flex-1"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Share ({selectedTargets.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}