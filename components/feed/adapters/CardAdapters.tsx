// Content Adapters for Universal Feed Cards
// These components render different card types in a consistent swipe card format

import Image from 'next/image';
import { Clock, Users, Star, MapPin, Play, Eye, ThumbsUp, User, Calendar, Tag } from 'lucide-react';
import { RecipeCard, RestaurantCard, VideoCard, PhotoCard, AdCard } from '@/types/feed';

interface BaseAdapterProps {
  isFullView?: boolean;
  className?: string;
}

// =====================================================
// Recipe Card Adapter
// =====================================================

export function RecipeAdapter({ card, isFullView = false, className }: { card: RecipeCard } & BaseAdapterProps) {
  const { metadata } = card;
  
  return (
    <div className={`relative w-full h-full bg-gray-200 ${className}`}>
      {/* Simple Recipe Card Layout */}
      <div className="flex flex-col h-full justify-center items-center text-center p-8">
        <div className="text-6xl mb-4">🍳</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Recipe</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{metadata.title}</h3>
        <p className="text-gray-600 text-sm">{metadata.cuisine} • {metadata.difficulty}</p>
      </div>
      
      {/* Keep existing overlays for positioning */}
      <div className="absolute inset-x-0 top-0 h-[125px]" />
      <div className="absolute inset-x-0 bottom-0 h-[201px]" />

      {/* Recipe Info Badges - Top */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="flex gap-2">
          {/* Cuisine Badge */}
          <div className="bg-black/50 rounded-full px-3 py-1">
            <p className="text-white text-sm font-medium">{metadata.cuisine}</p>
          </div>
          
          {/* Difficulty Badge */}
          <div className={`rounded-full px-3 py-1 ${
            metadata.difficulty === 'Easy' ? 'bg-green-500/80' :
            metadata.difficulty === 'Medium' ? 'bg-yellow-500/80' :
            'bg-red-500/80'
          }`}>
            <p className="text-white text-sm font-medium">{metadata.difficulty}</p>
          </div>
        </div>

        {/* Rating */}
        {metadata.rating && (
          <div className="bg-black/50 rounded-full px-3 py-1 flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <p className="text-white text-sm font-medium">{metadata.rating}</p>
          </div>
        )}
      </div>

      {/* Recipe Details - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-white text-3xl font-semibold font-['Poppins'] mb-3 leading-tight">
          {metadata.title}
        </h2>
        
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1">
            <Clock className="w-5 h-5 text-white/80" />
            <span className="text-white text-lg font-['Poppins']">{metadata.cook_time} min</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Users className="w-5 h-5 text-white/80" />
            <span className="text-white text-lg font-['Poppins']">{metadata.servings} servings</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Tag className="w-5 h-5 text-white/80" />
            <span className="text-white text-lg font-['Poppins']">{metadata.ingredients_count} ingredients</span>
          </div>
        </div>

        {metadata.nutrition && (
          <p className="text-white/80 text-base font-['Poppins']">
            {metadata.nutrition.calories} cal • {metadata.nutrition.protein}g protein
          </p>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Restaurant Card Adapter
// =====================================================

export function RestaurantAdapter({ card, isFullView = false, className }: { card: RestaurantCard } & BaseAdapterProps) {
  const { metadata } = card;
  
  const priceLevel = '$'.repeat(metadata.price_level);
  
  return (
    <div className={`relative w-full h-full bg-gray-200 ${className}`}>
      {/* Simple Restaurant Card Layout */}
      <div className="flex flex-col h-full justify-center items-center text-center p-8">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Nearby Restaurant</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{metadata.name}</h3>
        <p className="text-gray-600 text-sm">{metadata.cuisine} • {priceLevel}</p>
        <p className="text-gray-500 text-xs mt-1">{metadata.distance_km}km away</p>
      </div>
      
      {/* Keep existing overlays for positioning */}
      <div className="absolute inset-x-0 top-0 h-[125px]" />
      <div className="absolute inset-x-0 bottom-0 h-[201px]" />

      {/* Restaurant Info Badges - Top */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="flex gap-2">
          {/* Cuisine Badge */}
          <div className="bg-black/50 rounded-full px-3 py-1">
            <p className="text-white text-sm font-medium">{metadata.cuisine}</p>
          </div>
          
          {/* Price Level Badge */}
          <div className="bg-green-500/80 rounded-full px-3 py-1">
            <p className="text-white text-sm font-medium">{priceLevel}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-black/50 rounded-full px-3 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <p className="text-white text-sm font-medium">{metadata.rating}</p>
        </div>
      </div>

      {/* Restaurant Details - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-white text-3xl font-semibold font-['Poppins'] mb-3 leading-tight">
          {metadata.name}
        </h2>
        
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-5 h-5 text-white/80" />
          <span className="text-white text-lg font-['Poppins']">
            {metadata.distance_km ? `${metadata.distance_km.toFixed(1)} km away` : 'Distance unavailable'}
          </span>
        </div>

        <p className="text-white/80 text-base font-['Poppins'] mb-1">
          {metadata.address}
        </p>
        
        {metadata.hours && (
          <p className="text-white/60 text-sm font-['Poppins']">
            {metadata.hours}
          </p>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Video Card Adapter
// =====================================================

export function VideoAdapter({ card, isFullView = false, className }: { card: VideoCard } & BaseAdapterProps) {
  const { metadata } = card;
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number | undefined) => {
    if (!views || views === 0) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };
  
  return (
    <div className={`relative w-full h-full bg-gray-200 ${className}`}>
      {/* Simple Video Card Layout */}
      <div className="flex flex-col h-full justify-center items-center text-center p-8">
        <div className="text-6xl mb-4">📺</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Video</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{metadata.title}</h3>
        <p className="text-gray-600 text-sm">{metadata.channel}</p>
        <p className="text-gray-500 text-xs mt-1">{formatViews(metadata.views)} views • {formatDuration(metadata.duration)}</p>
      </div>
      
      {/* Keep existing overlays for positioning */}
      <div className="absolute inset-x-0 top-0 h-[125px]" />
      <div className="absolute inset-x-0 bottom-0 h-[201px]" />

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/60 rounded-full p-4">
          <Play className="w-12 h-12 text-white fill-current" />
        </div>
      </div>

      {/* Video Info - Top */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="flex gap-2">
          {/* Category Badge */}
          <div className="bg-black/50 rounded-full px-3 py-1">
            <p className="text-white text-sm font-medium">{metadata.category}</p>
          </div>
          
          {metadata.cuisine && (
            <div className="bg-purple-500/80 rounded-full px-3 py-1">
              <p className="text-white text-sm font-medium">{metadata.cuisine}</p>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="bg-black/70 rounded-md px-2 py-1">
          <p className="text-white text-sm font-medium">{formatDuration(metadata.duration)}</p>
        </div>
      </div>

      {/* Video Details - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="text-white text-3xl font-semibold font-['Poppins'] mb-3 leading-tight">
          {metadata.title}
        </h2>
        
        <div className="flex items-center gap-1 mb-2">
          <User className="w-5 h-5 text-white/80" />
          <span className="text-white text-lg font-['Poppins']">{metadata.channel}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-base font-['Poppins']">{formatViews(metadata.views)} views</span>
          </div>
          
          {metadata.likes && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-base font-['Poppins']">{formatViews(metadata.likes)} likes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Photo Card Adapter
// =====================================================

export function PhotoAdapter({ card, isFullView = false, className }: { card: PhotoCard } & BaseAdapterProps) {
  const { metadata } = card;
  
  return (
    <div className={`relative w-full h-full bg-gray-200 ${className}`}>
      {/* Simple Photo Card Layout */}
      <div className="flex flex-col h-full justify-center items-center text-center p-8">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Photo</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">@{metadata.username}</h3>
        <p className="text-gray-600 text-sm">{metadata.caption}</p>
        {metadata.location && <p className="text-gray-500 text-xs mt-1">{metadata.location}</p>}
      </div>
      
      {/* Keep existing overlays for positioning */}
      <div className="absolute inset-x-0 top-0 h-[125px]" />
      <div className="absolute inset-x-0 bottom-0 h-[201px]" />

      {/* User Info - Top */}
      <div className="absolute top-6 left-6 right-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
          <Image
            src={metadata.user_avatar}
            alt={metadata.username}
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
        
        <div className="flex-1">
          <p className="text-white text-lg font-semibold font-['Poppins']">@{metadata.username}</p>
          {metadata.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-white/80" />
              <p className="text-white/80 text-sm font-['Poppins']">{metadata.location}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ThumbsUp className="w-5 h-5 text-white/80" />
          <span className="text-white text-lg font-['Poppins']">{metadata.likes_count}</span>
        </div>
      </div>

      {/* Photo Details - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="text-white text-xl font-['Poppins'] mb-3 leading-relaxed">
          {metadata.caption}
        </p>
        
        {metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metadata.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="bg-white/20 rounded-full px-3 py-1 text-white/90 text-sm font-['Poppins']"
              >
                #{tag}
              </span>
            ))}
            {metadata.tags.length > 4 && (
              <span className="text-white/60 text-sm font-['Poppins']">
                +{metadata.tags.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Ad Card Adapter
// =====================================================

export function AdAdapter({ card, isFullView = false, className }: { card: AdCard } & BaseAdapterProps) {
  const { metadata } = card;
  
  return (
    <div className={`relative w-full h-full bg-gray-200 ${className}`}>
      {/* Simple Ad Card Layout */}
      <div className="flex flex-col h-full justify-center items-center text-center p-8">
        <div className="text-6xl mb-4">📢</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sponsored</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{metadata.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{metadata.description}</p>
        <p className="text-gray-500 text-xs">by {metadata.sponsor}</p>
      </div>
      
      {/* Keep existing overlays for positioning */}
      <div className="absolute inset-x-0 top-0 h-[125px]" />
      <div className="absolute inset-x-0 bottom-0 h-[201px]" />

      {/* Sponsored Badge - Top */}
      <div className="absolute top-6 left-6">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-4 py-2">
          <p className="text-black text-sm font-bold font-['Poppins']">Sponsored</p>
        </div>
      </div>

      {/* Ad Details - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="mb-4">
          <h2 className="text-white text-3xl font-semibold font-['Poppins'] mb-2 leading-tight">
            {metadata.title}
          </h2>
          
          <p className="text-white/90 text-lg font-['Poppins'] mb-3">
            {metadata.description}
          </p>
          
          <p className="text-white/70 text-base font-['Poppins']">
            by {metadata.sponsor}
          </p>
        </div>

        {/* CTA Button */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full px-6 py-3 text-center">
          <p className="text-white text-lg font-bold font-['Poppins']">
            {metadata.cta_text}
          </p>
        </div>
      </div>
    </div>
  );
}