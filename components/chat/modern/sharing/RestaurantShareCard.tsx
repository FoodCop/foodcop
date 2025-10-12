'use client';

import React from 'react';
import { MapPin, Star, Clock, ExternalLink, Heart, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { RestaurantMessage, RestaurantData } from './types/ShareTypes';

interface RestaurantShareCardProps {
  message: RestaurantMessage;
  onSaveToPlate?: (restaurant: RestaurantData) => void;
  onViewDetails?: (restaurant: RestaurantData) => void;
  onGetDirections?: (restaurant: RestaurantData) => void;
  className?: string;
  isPreview?: boolean; // for previewing while composing
}

export default function RestaurantShareCard({
  message,
  onSaveToPlate,
  onViewDetails,
  onGetDirections,
  className = '',
  isPreview = false
}: RestaurantShareCardProps) {
  const { restaurant } = message;

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    }
    return `${(distance / 1000).toFixed(1)}km away`;
  };

  const getPriceRangeDisplay = (priceRange: string): string => {
    const priceMap: Record<string, string> = {
      '$': '💰 Budget-friendly',
      '$$': '💰💰 Moderate',
      '$$$': '💰💰💰 Upscale',
      '$$$$': '💰💰💰💰 Fine dining'
    };
    return priceMap[priceRange] || priceRange;
  };

  const handleSaveToPlate = () => {
    onSaveToPlate?.(restaurant);
  };

  const handleViewDetails = () => {
    onViewDetails?.(restaurant);
  };

  const handleGetDirections = () => {
    onGetDirections?.(restaurant);
  };

  return (
    <Card className={`max-w-sm mx-auto overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Restaurant Image */}
        <div className="relative h-40 bg-gray-200">
          {restaurant.photo_url ? (
            <Image
              src={restaurant.photo_url}
              alt={restaurant.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
              <div className="text-center">
                <div className="text-3xl mb-2">🍽️</div>
                <p className="text-sm text-gray-600 font-medium">No image available</p>
              </div>
            </div>
          )}
          
          {/* Rating Badge */}
          {restaurant.rating > 0 && (
            <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 shadow-md">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs font-semibold">{restaurant.rating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant Details */}
        <div className="p-4">
          <div className="space-y-3">
            {/* Restaurant Name */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                {restaurant.name}
              </h3>
              {restaurant.cuisine_type && (
                <Badge variant="secondary" className="mt-1">
                  {restaurant.cuisine_type}
                </Badge>
              )}
            </div>

            {/* Location */}
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="line-clamp-2">{restaurant.address}</p>
                {restaurant.distance && (
                  <p className="text-blue-600 font-medium mt-1">
                    {formatDistance(restaurant.distance)}
                  </p>
                )}
              </div>
            </div>

            {/* Price Range */}
            {restaurant.price_range && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{getPriceRangeDisplay(restaurant.price_range)}</span>
              </div>
            )}

            {/* Opening Hours */}
            {restaurant.opening_hours && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="line-clamp-1">{restaurant.opening_hours}</span>
              </div>
            )}

            {/* Description */}
            {restaurant.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {restaurant.description}
              </p>
            )}

            {/* Optional Message from Sharer */}
            {message.message && !isPreview && (
              <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                <p className="text-sm text-blue-800 italic">
                  &ldquo;{message.message}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToPlate}
              className="flex-1"
            >
              <Heart className="w-4 h-4 mr-1" />
              Save
            </Button>
            
            {restaurant.coordinates && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetDirections}
                className="flex-shrink-0"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}