'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RecipeData {
  id: string;
  name: string;
  image?: string;
  description?: string;
  difficulty?: string;
  cooking_time?: number;
  servings?: number;
  category?: string;
}

interface RecipeShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: (message?: string) => void;
  recipe: RecipeData;
}

export default function RecipeShareDialog({
  isOpen,
  onClose,
  onShare,
  recipe
}: RecipeShareDialogProps) {
  const [shareMessage, setShareMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleShare = async () => {
    setIsSending(true);
    try {
      // Simple sharing - just show success message for now
      // In the future, this can connect to the real chat system
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      if (onShare) {
        onShare(shareMessage.trim() || undefined);
      }
      
      toast.success(`Recipe "${recipe.name}" shared successfully!`);
      
      // Reset form
      setShareMessage('');
      onClose();
    } catch (error) {
      console.error('Error sharing recipe:', error);
      toast.error('Failed to share recipe');
    } finally {
      setIsSending(false);
    }
  };

  const getSuggestedMessage = (): string => {
    const suggestions = [
      `Check out this ${recipe.difficulty?.toLowerCase() || 'delicious'} recipe!`,
      `Found this amazing ${recipe.category?.toLowerCase() || 'recipe'} to try!`,
      `This ${formatTime(recipe.cooking_time)} recipe looks perfect!`,
      `Great recipe for ${recipe.servings || '4'} people!`
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const formatTime = (minutes?: number): string => {
    if (!minutes) return 'quick';
    if (minutes < 60) return `${minutes}-minute`;
    return `${Math.floor(minutes / 60)}-hour`;
  };

  const handleSuggestedMessage = () => {
    if (!shareMessage.trim()) {
      setShareMessage(getSuggestedMessage());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
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

        <div className="space-y-4">
          {/* Recipe Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {recipe.image && (
                <Image 
                  src={recipe.image} 
                  alt={recipe.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h3 className="font-medium text-gray-900">{recipe.name}</h3>
                <p className="text-sm text-gray-500">
                  {recipe.difficulty && `${recipe.difficulty} • `}
                  {recipe.cooking_time && `${recipe.cooking_time}min • `}
                  {recipe.servings && `${recipe.servings} servings`}
                </p>
              </div>
            </div>
          </div>

          {/* Share Message */}
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
              className="min-h-[80px]"
              maxLength={500}
            />
            {shareMessage.length > 0 && (
              <p className="text-xs text-gray-500">
                {shareMessage.length}/500 characters
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
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
              disabled={isSending}
              className="flex-1"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Sharing features will be expanded with the new chat system
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}