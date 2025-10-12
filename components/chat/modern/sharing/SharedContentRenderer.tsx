'use client';

import React from 'react';
import { RestaurantMessage, RecipeMessage, RestaurantData, RecipeData } from './types/ShareTypes';
import RestaurantShareCard from './RestaurantShareCard';
import RecipeShareCard from './RecipeShareCard';

interface SharedContentRendererProps {
  message: RestaurantMessage | RecipeMessage;
  onSaveToPlate?: (content: RestaurantData | RecipeData) => void;
  onViewDetails?: (content: RestaurantData | RecipeData) => void;
  onGetDirections?: (restaurant: RestaurantData) => void;
  className?: string;
}

export default function SharedContentRenderer({
  message,
  onSaveToPlate,
  onViewDetails,
  onGetDirections,
  className = ''
}: SharedContentRendererProps) {
  const handleSaveToPlate = (content: RestaurantData | RecipeData) => {
    onSaveToPlate?.(content);
  };

  const handleViewDetails = (content: RestaurantData | RecipeData) => {
    onViewDetails?.(content);
  };

  const handleGetDirections = (restaurant: RestaurantData) => {
    onGetDirections?.(restaurant);
  };

  if (message.type === 'restaurant') {
    return (
      <RestaurantShareCard
        message={message}
        onSaveToPlate={handleSaveToPlate}
        onViewDetails={handleViewDetails}
        onGetDirections={handleGetDirections}
        className={className}
      />
    );
  }

  if (message.type === 'recipe') {
    return (
      <RecipeShareCard
        message={message}
        onSaveToPlate={handleSaveToPlate}
        onViewDetails={handleViewDetails}
        className={className}
      />
    );
  }

  // Fallback for unknown content types
  return (
    <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
      <p className="text-sm text-gray-600">
        Shared content type &quot;{(message as any).type}&quot; is not supported.
      </p>
    </div>
  );
}