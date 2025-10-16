'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Star, MapPin, Clock, Share2, Heart, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { SaveToPlate } from '../SaveToPlate';
import { SaveAndShare } from '../SaveAndShare';

interface CapturedPhoto {
  id: string;
  imageUrl: string;
  imageBlob: Blob;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface TaggingData {
  restaurantName: string;
  rating: number;
  foodTags: string[];
  additionalTags: string[];
  review: string;
  priceRange: string;
  visitDate: Date;
}

interface TaggingViewProps {
  photo: CapturedPhoto;
  onComplete: (data: TaggingData) => void;
  onRetake: () => void;
  snapId?: string; // ID of the saved snap for save to plate functionality
}

const FOOD_TAGS = [
  'Burger', 'Pizza', 'Sushi', 'Pasta', 'Salad', 'Ramen',
  'Tacos', 'BBQ', 'Dessert', 'Breakfast', 'Coffee', 'Smoothie',
  'Sandwich', 'Soup', 'Steak', 'Chicken', 'Seafood', 'Vegetarian',
  'Vegan', 'Healthy', 'Spicy', 'Sweet', 'Italian', 'Asian',
  'Mexican', 'Indian', 'Thai', 'Chinese', 'Japanese', 'Mediterranean'
];

const ADDITIONAL_TAGS = [
  { id: 'price1', label: 'Budget Friendly', icon: '💲', category: 'price' },
  { id: 'price2', label: 'Mid-Range', icon: '💲💲', category: 'price' },
  { id: 'price3', label: 'Fine Dining', icon: '💲💲💲', category: 'price' },
  { id: 'ambience1', label: 'Cozy', icon: '🕯️', category: 'ambience' },
  { id: 'ambience2', label: 'Trendy', icon: '✨', category: 'ambience' },
  { id: 'ambience3', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦', category: 'ambience' },
  { id: 'speed1', label: 'Quick Service', icon: '⚡', category: 'service' },
  { id: 'speed2', label: 'Leisurely', icon: '🐌', category: 'service' },
  { id: 'dietary1', label: 'Vegetarian Options', icon: '🥬', category: 'dietary' },
  { id: 'dietary2', label: 'Vegan Options', icon: '🌱', category: 'dietary' },
  { id: 'dietary3', label: 'Gluten Free', icon: '🚫🌾', category: 'dietary' },
  { id: 'recommend', label: 'Must Try!', icon: '⭐', category: 'special' },
  { id: 'outdoor', label: 'Outdoor Seating', icon: '🌿', category: 'special' },
  { id: 'romantic', label: 'Date Night', icon: '💝', category: 'special' }
];

const RESTAURANT_SUGGESTIONS = [
  'The Local Bistro',
  'Pizza Paradise',
  'Sushi Zen',
  'Burger House',
  'Green Garden Cafe',
  'Spice Route',
  'Corner Deli',
  'Mountain View Restaurant',
  'City Eats',
  'Fresh Kitchen'
];

export function TaggingView({ photo, onComplete, onRetake, snapId }: TaggingViewProps) {
  const [restaurantName, setRestaurantName] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);
  const [selectedAdditionalTags, setSelectedAdditionalTags] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [photoSavedToPlate, setPhotoSavedToPlate] = useState(false);
  const [showSaveToPlate, setShowSaveToPlate] = useState(false);

  const toggleFoodTag = (tag: string) => {
    setSelectedFoodTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleAdditionalTag = (tagId: string) => {
    const tag = ADDITIONAL_TAGS.find(t => t.id === tagId);
    if (!tag) return;

    // Handle price range selection (only one allowed)
    if (tag.category === 'price') {
      setPriceRange(tag.label);
      setSelectedAdditionalTags(prev => 
        prev.filter(t => !ADDITIONAL_TAGS.find(at => at.id === t)?.category.includes('price')).concat(tagId)
      );
    } else {
      setSelectedAdditionalTags(prev => 
        prev.includes(tagId) 
          ? prev.filter(t => t !== tagId)
          : [...prev, tagId]
      );
    }
  };

  const handleSubmit = () => {
    const taggingData: TaggingData = {
      restaurantName,
      rating,
      foodTags: selectedFoodTags,
      additionalTags: selectedAdditionalTags,
      review,
      priceRange,
      visitDate: photo.timestamp
    };
    
    onComplete(taggingData);
  };

  const canSubmit = restaurantName.trim() && rating > 0 && selectedFoodTags.length > 0;

  // Calculate potential points
  const calculatePoints = () => {
    let points = 0;
    points += selectedFoodTags.length * 5; // 5 points per food tag
    points += selectedAdditionalTags.length * 3; // 3 points per additional tag
    points += review.trim() ? 20 : 0; // 20 points for review
    points += rating > 0 ? 10 : 0; // 10 points for rating
    points += 15; // 15 base points for taking photo
    return points;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetake}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retake
          </Button>
          <h1 className="text-lg font-semibold">Tag Your Snap</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Photo Preview */}
        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg border border-border">
          <Image 
            src={photo.imageUrl} 
            alt="Captured food"
            fill
            className="object-cover"
          />
          
          {/* Photo metadata overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex items-center text-white text-xs space-x-3">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {photo.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {photo.location && (
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-40">
                    {photo.location.address || 'Unknown location'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Points Preview */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">+{calculatePoints()}</div>
          <div className="text-sm text-muted-foreground">
            Potential points for this snap
          </div>
        </div>

        {/* Restaurant Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Restaurant Name *</label>
          <div className="relative">
            <Input
              value={restaurantName}
              onChange={(e) => {
                setRestaurantName(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(restaurantName.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Where did you eat?"
              className="bg-background border-border"
            />
            
            {/* Auto-suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                {RESTAURANT_SUGGESTIONS
                  .filter(name => name.toLowerCase().includes(restaurantName.toLowerCase()))
                  .map(name => (
                    <button
                      key={name}
                      onClick={() => {
                        setRestaurantName(name);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border last:border-b-0"
                    >
                      {name}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Rating *</label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star 
                  className={`h-8 w-8 transition-colors ${
                    star <= rating 
                      ? 'text-primary fill-primary' 
                      : 'text-muted-foreground hover:text-primary/50'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating > 0 && `${rating}/5`}
            </span>
          </div>
        </div>

        {/* Food Type Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Food Type * 
            <span className="font-normal text-muted-foreground">
              (+5 points each)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {FOOD_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={selectedFoodTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedFoodTags.includes(tag)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted border-border'
                }`}
                onClick={() => toggleFoodTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Additional Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Additional Details
            <span className="font-normal text-muted-foreground">
              (+3 points each)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ADDITIONAL_TAGS.map(tag => (
              <Badge
                key={tag.id}
                variant={selectedAdditionalTags.includes(tag.id) ? "default" : "outline"}
                className={`cursor-pointer transition-colors justify-start p-3 h-auto ${
                  selectedAdditionalTags.includes(tag.id)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted border-border'
                }`}
                onClick={() => toggleAdditionalTag(tag.id)}
              >
                <span className="mr-2">{tag.icon}</span>
                <span className="text-xs">{tag.label}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Review */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Quick Review 
            <span className="font-normal text-muted-foreground">
              (+20 bonus points!)
            </span>
          </label>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your thoughts about this dish..."
            className="bg-background border-border resize-none"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-8">
          {/* Primary Save Snap Button */}
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Save to Plate (+{calculatePoints()} points)
          </Button>

          {/* Info about plate saving */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-center text-muted-foreground">
              💾 Your photo will be saved to your Plate where you can view it later in the Photos tab
            </p>
          </div>

          {/* Additional Save to Plate option - Only show if snap has been saved */}
          {snapId && (
            <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
              <div className="text-center">
                <h4 className="text-sm font-medium text-foreground mb-1">Quick Save Option</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Also save this photo as a separate saved item (like Scout and Bites)
                </p>
              </div>
              
              <SaveToPlate
                itemId={snapId}
                itemType="photo"
                title={restaurantName ? `${restaurantName} - Food Snap` : 'Food Snap'}
                imageUrl={photo.imageUrl}
                variant="button"
                size="sm"
                className="w-full"
                onSaved={() => setPhotoSavedToPlate(true)}
                onUnsaved={() => setPhotoSavedToPlate(false)}
              />
            </div>
          )}
          
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                // TODO: Implement share functionality
                console.log('Share clicked');
              }}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                // TODO: Implement add to feed functionality  
                console.log('Add to feed clicked');
              }}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Heart className="h-4 w-4 mr-2" />
              Add to Feed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}