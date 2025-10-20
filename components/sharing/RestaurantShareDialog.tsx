'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Send, X, MapPin, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RestaurantData {
  id: string;
  name: string;
  image?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  cuisine?: string[];
  priceLevel?: number;
  distance?: string;
}

interface RestaurantShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: (message?: string) => void;
  restaurant: RestaurantData;
}

export default function RestaurantShareDialog({
  isOpen,
  onClose,
  onShare,
  restaurant
}: RestaurantShareDialogProps) {
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
      
      toast.success(`Restaurant "${restaurant.name}" shared successfully!`);
      
      // Reset form
      setShareMessage('');
      onClose();
    } catch (error) {
      console.error('Error sharing restaurant:', error);
      toast.error('Failed to share restaurant');
    } finally {
      setIsSending(false);
    }
  };

  const getSuggestedMessage = (): string => {
    const suggestions = [
      `Found this amazing ${restaurant.cuisine?.[0] || 'restaurant'}!`,
      `Check out this ${getPriceRange(restaurant.priceLevel)} spot I discovered!`,
      `This place has great reviews${restaurant.rating ? ` (${restaurant.rating}★)` : ''}!`,
      `Perfect restaurant${restaurant.distance ? ` just ${restaurant.distance} away` : ''}!`
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const getPriceRange = (priceLevel?: number): string => {
    switch (priceLevel) {
      case 1: return 'budget-friendly';
      case 2: return 'affordable';
      case 3: return 'upscale';
      case 4: return 'fine dining';
      default: return 'great';
    }
  };

  const handleSuggestedMessage = () => {
    if (!shareMessage.trim()) {
      setShareMessage(getSuggestedMessage());
    }
  };

  const renderPriceLevel = (level?: number) => {
    if (!level) return null;
    return '€'.repeat(level);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Share Restaurant</span>
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
          {/* Restaurant Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {restaurant.image && (
                <Image 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {restaurant.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{restaurant.rating}</span>
                      {restaurant.reviewCount && (
                        <span>({restaurant.reviewCount})</span>
                      )}
                    </div>
                  )}
                  {restaurant.priceLevel && (
                    <span className="font-medium">
                      {renderPriceLevel(restaurant.priceLevel)}
                    </span>
                  )}
                </div>
                
                {restaurant.address && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                )}
                
                {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {restaurant.cuisine.slice(0, 2).map((type, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-200 text-xs rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}
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
              placeholder="Tell them why you're sharing this restaurant..."
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