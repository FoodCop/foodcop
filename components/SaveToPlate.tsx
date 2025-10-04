'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { savedItemsService, SaveItemParams } from '@/lib/savedItemsService';
import { useAuth } from '@/components/auth/AuthProvider';

interface SaveToPlateProps {
  itemId: string;
  itemType: 'restaurant' | 'recipe' | 'photo' | 'other';
  title?: string;
  imageUrl?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  onSaved?: () => void;
  onUnsaved?: () => void;
  className?: string;
}

export function SaveToPlate({
  itemId,
  itemType,
  title,
  imageUrl,
  variant = 'button',
  size = 'md',
  onSaved,
  onUnsaved,
  className = ''
}: SaveToPlateProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(true);

  const checkSavedStatus = useCallback(async () => {
    if (!user) {
      setIsCheckingSaved(false);
      return;
    }

    try {
      const result = await savedItemsService.isItemSaved({
        itemId,
        itemType
      });

      if (result.success) {
        setIsSaved(result.data || false);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    } finally {
      setIsCheckingSaved(false);
    }
  }, [itemId, itemType, user]);

  // Check if item is already saved on component mount
  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  const handleSaveClick = () => {
    if (!user) {
      // Redirect to auth if not logged in
      toast.error('Please sign in to save items to your plate');
      router.push('/auth-success');
      return;
    }

    if (isSaved) {
      // If already saved, unsave immediately
      handleUnsave();
    } else {
      // Show confirmation dialog for saving
      setShowDialog(true);
    }
  };

  const handleConfirmSave = async () => {
    setShowDialog(false);
    await performSave();
  };

  const performSave = async () => {
    setIsLoading(true);

    // Optimistic update
    const wasSaved = isSaved;
    setIsSaved(true);

    try {
      const metadata: Record<string, any> = {};
      if (title) metadata.title = title;
      if (imageUrl) metadata.image_url = imageUrl;

      const result = await savedItemsService.saveItem({
        itemId,
        itemType,
        metadata
      });

      if (result.success) {
        toast.success('Saved to your Plate!');
        onSaved?.();
      } else {
        // Rollback optimistic update
        setIsSaved(wasSaved);
        toast.error(result.error || 'Failed to save item');
      }
    } catch (error) {
      // Rollback optimistic update
      setIsSaved(wasSaved);
      console.error('Error saving item:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async () => {
    setIsLoading(true);

    // Optimistic update
    setIsSaved(false);

    try {
      const result = await savedItemsService.unsaveItem({
        itemId,
        itemType
      });

      if (result.success) {
        toast.success('Removed from your Plate');
        onUnsaved?.();
      } else {
        // Rollback optimistic update
        setIsSaved(true);
        toast.error(result.error || 'Failed to remove item');
      }
    } catch (error) {
      // Rollback optimistic update
      setIsSaved(true);
      console.error('Error unsaving item:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 px-2 text-sm';
      case 'lg': return 'h-12 px-6 text-lg';
      default: return 'h-10 px-4';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  if (isCheckingSaved) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={`${getButtonSize()} ${className}`}
      >
        <Heart className={`${getIconSize()} animate-pulse`} />
      </Button>
    );
  }

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          onClick={handleSaveClick}
          disabled={isLoading}
          className={`${getButtonSize()} ${className}`}
          aria-label={isSaved ? `Remove ${title || 'item'} from plate` : `Save ${title || 'item'} to plate`}
        >
          <Heart
            className={`${getIconSize()} ${isSaved ? 'fill-current' : ''} ${isLoading ? 'animate-pulse' : ''}`}
          />
        </Button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save to Plate?</DialogTitle>
              <DialogDescription>
                {title ? `Save "${title}" to your plate?` : 'Save this item to your plate?'}
                {imageUrl && (
                  <div className="mt-4">
                    <img
                      src={imageUrl}
                      alt={title || 'Item preview'}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSave}
                disabled={isLoading}
                style={{ backgroundColor: '#329937' }}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant={isSaved ? "default" : "outline"}
        onClick={handleSaveClick}
        disabled={isLoading}
        className={`${getButtonSize()} ${className}`}
        style={isSaved ? { backgroundColor: '#329937' } : undefined}
      >
        {isLoading ? (
          <>
            <Heart className={`${getIconSize()} animate-pulse mr-2`} />
            {isSaved ? 'Removing...' : 'Saving...'}
          </>
        ) : isSaved ? (
          <>
            <Heart className={`${getIconSize()} fill-current mr-2`} />
            Saved
          </>
        ) : (
          <>
            <Plus className={`${getIconSize()} mr-2`} />
            Save to Plate
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Plate?</DialogTitle>
            <DialogDescription>
              {title ? `Save "${title}" to your plate?` : 'Save this item to your plate?'}
                {imageUrl && (
                  <div className="mt-4">
                    <img
                      src={imageUrl}
                      alt={title || 'Item preview'}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={isLoading}
              style={{ backgroundColor: '#329937' }}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}