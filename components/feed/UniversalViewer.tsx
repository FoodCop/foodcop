'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Bookmark, Share, ExternalLink, MapPin, Play, Clock, Users, Star, User, Eye, ThumbsUp } from 'lucide-react';
import { FeedCard, SwipeDirection, SwipeAction, isRecipeCard, isRestaurantCard, isVideoCard, isPhotoCard, isAdCard } from '@/types/feed';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface UniversalViewerProps {
  card: FeedCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSwipe?: (direction: SwipeDirection, card: FeedCard, action: SwipeAction) => void;
}

export function UniversalViewer({ card, isOpen, onClose, onSwipe }: UniversalViewerProps) {
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  if (!card) return null;

  const handleAction = async (direction: SwipeDirection, action: SwipeAction) => {
    setIsProcessingAction(true);
    try {
      await onSwipe?.(direction, card, action);
      // Don't close modal for likes/dislikes, only for saves/shares
      if (action === 'SAVE' || action === 'SHARE') {
        onClose();
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const renderContent = () => {
    if (isRecipeCard(card)) {
      const { metadata } = card;
      return (
        <div className="space-y-6">
          {/* Header Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={metadata.image}
              alt={metadata.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary">{metadata.cuisine}</Badge>
              <Badge variant={metadata.difficulty === 'Easy' ? 'default' : metadata.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                {metadata.difficulty}
              </Badge>
            </div>
            {metadata.rating && (
              <div className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white text-sm">{metadata.rating}</span>
              </div>
            )}
          </div>

          {/* Recipe Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{metadata.title}</h2>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{metadata.cook_time} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{metadata.servings} servings</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{metadata.ingredients_count} ingredients</span>
              </div>
            </div>

            {metadata.nutrition && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Nutrition (per serving)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: {metadata.nutrition.calories}</div>
                  <div>Protein: {metadata.nutrition.protein}g</div>
                  <div>Carbs: {metadata.nutrition.carbs}g</div>
                  <div>Fat: {metadata.nutrition.fat}g</div>
                </div>
              </div>
            )}

            {metadata.ingredients && metadata.ingredients.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <ul className="space-y-1 text-sm">
                  {metadata.ingredients.slice(0, 8).map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {ingredient}
                    </li>
                  ))}
                  {metadata.ingredients.length > 8 && (
                    <li className="text-muted-foreground">+{metadata.ingredients.length - 8} more ingredients</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isRestaurantCard(card)) {
      const { metadata } = card;
      const priceLevel = '$'.repeat(metadata.price_level);
      
      return (
        <div className="space-y-6">
          {/* Header Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={metadata.image}
              alt={metadata.name}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary">{metadata.cuisine}</Badge>
              <Badge variant="outline">{priceLevel}</Badge>
            </div>
            <div className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1 flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-white text-sm">{metadata.rating}</span>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{metadata.name}</h2>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{metadata.distance_km.toFixed(1)} km away</span>
            </div>

            <div className="space-y-2 text-sm">
              <p>{metadata.address}</p>
              {metadata.phone && <p>📞 {metadata.phone}</p>}
              {metadata.hours && <p>🕐 {metadata.hours}</p>}
            </div>

            {metadata.reviews_count && (
              <p className="text-sm text-muted-foreground">
                Based on {metadata.reviews_count} reviews
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <MapPin className="w-4 h-4 mr-2" />
                Directions
              </Button>
              {metadata.phone && (
                <Button variant="outline" className="flex-1">
                  📞 Call
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (isVideoCard(card)) {
      const { metadata } = card;
      
      return (
        <div className="space-y-6">
          {/* Video Thumbnail */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden group cursor-pointer">
            <Image
              src={metadata.thumbnail}
              alt={metadata.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="bg-black/60 rounded-full p-4">
                <Play className="w-8 h-8 text-white fill-current" />
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/70 rounded px-2 py-1 text-white text-sm">
              {formatDuration(metadata.duration)}
            </div>
            {metadata.cuisine && (
              <div className="absolute top-4 left-4">
                <Badge variant="secondary">{metadata.cuisine}</Badge>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{metadata.title}</h2>
            
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{metadata.channel}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{formatViews(metadata.views)} views</span>
              </div>
              {metadata.likes && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{formatViews(metadata.likes)} likes</span>
                </div>
              )}
            </div>

            {metadata.description && (
              <div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {metadata.description}
                </p>
              </div>
            )}

            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch on YouTube
            </Button>
          </div>
        </div>
      );
    }

    if (isPhotoCard(card)) {
      const { metadata } = card;
      
      return (
        <div className="space-y-6">
          {/* Photo */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden">
            <Image
              src={metadata.image}
              alt={metadata.caption}
              fill
              className="object-cover"
            />
          </div>

          {/* Photo Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={metadata.user_avatar}
                  alt={metadata.username}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold">@{metadata.username}</p>
                {metadata.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{metadata.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                <span>{metadata.likes_count}</span>
              </div>
            </div>

            <p className="text-base">{metadata.caption}</p>

            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isAdCard(card)) {
      const { metadata } = card;
      
      return (
        <div className="space-y-6">
          {/* Ad Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={metadata.image}
              alt={metadata.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                Sponsored
              </Badge>
            </div>
          </div>

          {/* Ad Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{metadata.title}</h2>
            <p className="text-muted-foreground">{metadata.description}</p>
            <p className="text-sm text-muted-foreground">by {metadata.sponsor}</p>
            
            <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              {metadata.cta_text}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {isRecipeCard(card) ? card.metadata.title :
             isRestaurantCard(card) ? card.metadata.name :
             isVideoCard(card) ? card.metadata.title :
             isPhotoCard(card) ? `Photo by @${card.metadata.username}` :
             isAdCard(card) ? card.metadata.title : 'Content Details'}
          </DialogTitle>
        </DialogHeader>

        {renderContent()}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleAction('LEFT' as SwipeDirection, 'DISLIKE')}
            disabled={isProcessingAction}
          >
            <X className="w-4 h-4 mr-2" />
            Pass
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleAction('RIGHT' as SwipeDirection, 'LIKE')}
            disabled={isProcessingAction}
          >
            <Heart className="w-4 h-4 mr-2" />
            Like
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleAction('DOWN' as SwipeDirection, 'SAVE')}
            disabled={isProcessingAction}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleAction('UP' as SwipeDirection, 'SHARE')}
            disabled={isProcessingAction}
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}