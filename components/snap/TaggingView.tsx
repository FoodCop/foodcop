import React, { useState } from 'react';
import { ArrowLeft, Star, MapPin, Clock, Share2, Heart, Bookmark } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';

interface CapturedPhoto {
  id: string;
  imageUrl: string;
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
}

interface TaggingViewProps {
  photo: CapturedPhoto;
  onComplete: (data: TaggingData) => void;
  onRetake: () => void;
}

const FOOD_TAGS = [
  'Burger', 'Pizza', 'Sushi', 'Pasta', 'Salad', 'Ramen',
  'Tacos', 'BBQ', 'Dessert', 'Breakfast', 'Vegan', 'Healthy',
  'Spicy', 'Italian', 'Asian', 'Mexican', 'Indian', 'Thai'
];

const ADDITIONAL_TAGS = [
  { id: 'price1', label: 'Budget Friendly', icon: '💲' },
  { id: 'price2', label: 'Mid-Range', icon: '💲💲' },
  { id: 'price3', label: 'Fine Dining', icon: '💲💲💲' },
  { id: 'ambience1', label: 'Cozy', icon: '🕯️' },
  { id: 'ambience2', label: 'Trendy', icon: '✨' },
  { id: 'ambience3', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦' },
  { id: 'speed1', label: 'Quick Service', icon: '⚡' },
  { id: 'speed2', label: 'Leisurely', icon: '🐌' },
  { id: 'dietary1', label: 'Vegetarian', icon: '🥬' },
  { id: 'dietary2', label: 'Vegan', icon: '🌱' },
  { id: 'dietary3', label: 'Gluten Free', icon: '🚫🌾' },
  { id: 'recommend', label: 'Must Try!', icon: '⭐' }
];

const RESTAURANT_SUGGESTIONS = [
  'The Local Bistro',
  'Pizza Paradise',
  'Sushi Zen',
  'Burger House',
  'Green Garden Cafe',
  'Spice Route'
];

export function TaggingView({ photo, onComplete, onRetake }: TaggingViewProps) {
  const [restaurantName, setRestaurantName] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);
  const [selectedAdditionalTags, setSelectedAdditionalTags] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceRange, setPriceRange] = useState('');

  const toggleFoodTag = (tag: string) => {
    setSelectedFoodTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleAdditionalTag = (tagId: string) => {
    setSelectedAdditionalTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
    
    // Handle price range selection
    if (tagId.startsWith('price')) {
      const priceTag = ADDITIONAL_TAGS.find(t => t.id === tagId);
      if (priceTag) {
        setPriceRange(priceTag.label);
        // Remove other price tags
        setSelectedAdditionalTags(prev => 
          prev.filter(t => !t.startsWith('price')).concat(tagId)
        );
      }
    }
  };

  const handleSubmit = () => {
    const taggingData: TaggingData = {
      restaurantName,
      rating,
      foodTags: selectedFoodTags,
      additionalTags: selectedAdditionalTags,
      review,
      priceRange
    };
    
    onComplete(taggingData);
  };

  const canSubmit = restaurantName.trim() && rating > 0 && selectedFoodTags.length > 0;

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
          <h1 className="text-lg">Tag Your Snap</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Photo Preview */}
        <div className="relative w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg">
          <img 
            src={photo.imageUrl} 
            alt="Captured food"
            className="w-full h-full object-cover"
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
                  {photo.location.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Name */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Restaurant Name *</label>
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
              className="bg-input-background border-border"
            />
            
            {/* Auto-suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20">
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
          <label className="text-sm text-muted-foreground">Rating *</label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star 
                  className={`h-8 w-8 ${
                    star <= rating 
                      ? 'text-primary fill-primary' 
                      : 'text-muted-foreground'
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
          <label className="text-sm text-muted-foreground">Food Type *</label>
          <div className="flex flex-wrap gap-2">
            {FOOD_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={selectedFoodTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedFoodTags.includes(tag)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted'
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
          <label className="text-sm text-muted-foreground">Additional Details</label>
          <div className="grid grid-cols-2 gap-2">
            {ADDITIONAL_TAGS.map(tag => (
              <Badge
                key={tag.id}
                variant={selectedAdditionalTags.includes(tag.id) ? "default" : "outline"}
                className={`cursor-pointer transition-colors justify-start p-3 h-auto ${
                  selectedAdditionalTags.includes(tag.id)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-muted'
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
          <label className="text-sm text-muted-foreground">Quick Review (Optional)</label>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your thoughts about this dish..."
            className="bg-input-background border-border resize-none"
            rows={3}
          />
          <div className="text-xs text-muted-foreground text-right">
            +20 bonus points for reviews!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-8">
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Save to Plate
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share with Friends
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit}
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
