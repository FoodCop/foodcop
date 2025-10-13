'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MapPin, Star, Clock, Share2 } from 'lucide-react';
import RestaurantShareDialog from '../chat/modern/sharing/RestaurantShareDialog';

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  cuisine: string[];
  address: string;
  openHours: string;
  priceLevel: number;
  distance: string;
  isOpen: boolean;
  isSaved: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone?: string;
  website?: string;
  photos?: Array<{
    photoReference?: string;
    needsResolving?: boolean;
    width?: number;
    height?: number;
  }>;
  placeId?: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  onSave: () => void;
  onShare?: (restaurant: Restaurant) => void;
  variant?: 'horizontal' | 'grid' | 'compact';
  selected?: boolean;
  className?: string;
}

export function RestaurantCard({
  restaurant,
  onClick,
  onSave,
  onShare,
  variant = 'horizontal',
  selected = false,
  className = ''
}: RestaurantCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const getPriceLevelDisplay = (level: number) => {
    return '$'.repeat(level) + '·'.repeat(Math.max(0, 3 - level));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(restaurant);
    } else {
      setShowShareDialog(true);
    }
  };

  // Compact variant for desktop sidebar
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`restaurant-card-compact ${selected ? 'selected' : ''} ${className}`}
      >
        {/* Restaurant Image */}
        <div className="compact-image">
          {restaurant.image ? (
            <Image
              src={restaurant.image}
              alt={restaurant.name}
              width={60}
              height={60}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div className="compact-info">
          <div className="compact-header">
            <h4 className="compact-name">{restaurant.name}</h4>
            <div className="compact-rating">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs">{restaurant.rating}</span>
            </div>
          </div>
          
          <div className="compact-details">
            <div className="compact-cuisine">
              {restaurant.cuisine.slice(0, 2).map((tag, index) => (
                <span key={index} className="cuisine-tag">
                  {tag}
                </span>
              ))}
              {restaurant.cuisine.length > 2 && (
                <span className="cuisine-more">+{restaurant.cuisine.length - 2}</span>
              )}
            </div>
            <span className="compact-price">
              {getPriceLevelDisplay(restaurant.priceLevel)}
            </span>
            <span className="compact-distance">{restaurant.distance}</span>
          </div>
          
          <div className="compact-status">
            <Clock className="w-3 h-3" />
            <span className={`status-text ${restaurant.isOpen ? 'open' : 'closed'}`}>
              {restaurant.isOpen ? 'Open now' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`compact-save-btn ${restaurant.isSaved ? 'saved' : ''}`}
        >
          <Heart
            className={`w-4 h-4 ${
              restaurant.isSaved ? 'text-red-500 fill-current' : 'text-gray-400'
            }`}
          />
        </button>
      </motion.div>
    );
  }

  // Grid variant for larger displays
  if (variant === 'grid') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`restaurant-card-grid ${className}`}
      >
        <div className="relative">
          {restaurant.image ? (
            <Image
              src={restaurant.image}
              alt={restaurant.name}
              width={300}
              height={200}
              className="w-full h-40 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-t-lg">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`absolute top-3 right-3 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
              restaurant.isSaved
                ? 'bg-red-500/20 hover:bg-red-500/30'
                : 'bg-white/90 hover:bg-white hover:shadow-md'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-200 ${
                restaurant.isSaved
                  ? 'text-red-500 fill-current'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            />
          </button>

          <button
            onClick={handleShare}
            className="absolute top-3 right-14 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-white hover:shadow-md"
          >
            <Share2 className="w-4 h-4 text-gray-600 hover:text-blue-500" />
          </button>

          <button
            onClick={onClick}
            className="absolute bottom-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-600 transition-colors"
          >
            <MapPin className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-4" onClick={onClick}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-xs font-medium text-gray-900">
                {restaurant.rating}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.cuisine.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{restaurant.distance}</span>
            <span className="text-gray-900 font-medium">
              {getPriceLevelDisplay(restaurant.priceLevel)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default horizontal variant
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`restaurant-card-horizontal ${className}`}
    >
      <div className="relative">
        {restaurant.image ? (
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            width={300}
            height={200}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div className="w-full h-36 bg-gray-200 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}

        {/* Status Badge */}
        <div
          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
            restaurant.isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </div>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`absolute top-2 right-2 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
            restaurant.isSaved
              ? 'bg-red-500/20 hover:bg-red-500/30'
              : 'bg-white/90 hover:bg-white hover:shadow-md'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              restaurant.isSaved
                ? 'text-red-500 fill-current'
                : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>

        {/* Distance Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-gray-900/80 text-white text-xs rounded-full font-medium">
          {restaurant.distance}
        </div>
      </div>

      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-sm font-medium text-gray-900">
                  {restaurant.rating}
                </span>
                <span className="text-gray-500 text-xs">
                  ({restaurant.reviewCount})
                </span>
              </div>
              <span className="text-gray-900 text-sm font-medium">
                {getPriceLevelDisplay(restaurant.priceLevel)}
              </span>
            </div>
          </div>
        </div>

        {/* Cuisine Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {restaurant.cuisine.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
          {restaurant.cuisine.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              +{restaurant.cuisine.length - 2}
            </span>
          )}
        </div>

        {/* Address & Hours */}
        <div className="space-y-1.5">
          <div className="flex items-start space-x-1.5 text-gray-600">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="text-xs leading-tight">{restaurant.address}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span
              className={`text-xs font-medium ${
                restaurant.isOpen ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {restaurant.openHours}
            </span>
          </div>
        </div>
      </div>
      
      {/* Share Dialog */}
      {showShareDialog && (
        <RestaurantShareDialog
          restaurant={{
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            rating: restaurant.rating,
            price_range: '$'.repeat(restaurant.priceLevel),
            cuisine_type: restaurant.cuisine.join(', '),
            photo_url: restaurant.image,
            phone: restaurant.phone,
            website: restaurant.website,
            coordinates: restaurant.coordinates,
            opening_hours: restaurant.openHours
          }}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          onShare={async (targets, message) => {
            console.log('Sharing restaurant to:', targets, 'with message:', message);
            setShowShareDialog(false);
          }}
        />
      )}
    </motion.div>
  );
}

export default RestaurantCard;