'use client';

import React from 'react';
import { Message } from '../utils/ChatTypes';
import { RestaurantData, RecipeData } from './types/ShareTypes';
import RestaurantShareCard from './RestaurantShareCard';
import RecipeShareCard from './RecipeShareCard';

interface SharedContentRendererProps {
  message: Message;
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

  if (message.type === 'restaurant' && message.restaurant_data) {
    // Map ChatTypes restaurant_data to ShareTypes RestaurantData format
    const restaurantData = {
      id: message.restaurant_data.id,
      name: message.restaurant_data.name,
      address: message.restaurant_data.address,
      rating: message.restaurant_data.rating,
      photo_url: message.restaurant_data.photoUrl,
      cuisine_type: message.restaurant_data.cuisine,
      price_range: '$'.repeat(message.restaurant_data.priceLevel),
      phone: message.restaurant_data.phone,
      website: message.restaurant_data.website
    };

    const restaurantMessage = {
      type: 'restaurant' as const,
      restaurant: restaurantData,
      shared_by_user_id: message.sender_id,
      shared_at: message.timestamp,
      message: message.content
    };

    return (
      <RestaurantShareCard
        message={restaurantMessage}
        onSaveToPlate={handleSaveToPlate}
        onViewDetails={handleViewDetails}
        onGetDirections={handleGetDirections}
        className={className}
      />
    );
  }

  if (message.type === 'recipe' && message.recipe_data) {
    // Map ChatTypes recipe_data to ShareTypes RecipeData format
    const recipeData = {
      id: message.recipe_data.id,
      title: message.recipe_data.title,
      description: message.recipe_data.description,
      image_url: message.recipe_data.imageUrl,
      cooking_time: message.recipe_data.totalTime,
      difficulty: message.recipe_data.difficulty,
      ingredients: message.recipe_data.ingredients,
      servings: message.recipe_data.servings,
      category: message.recipe_data.tags[0] || 'General'
    };

    const recipeMessage = {
      type: 'recipe' as const,
      recipe: recipeData,
      shared_by_user_id: message.sender_id,
      shared_at: message.timestamp,
      message: message.content
    };

    return (
      <RecipeShareCard
        message={recipeMessage}
        onSaveToPlate={handleSaveToPlate}
        onViewDetails={handleViewDetails}
        className={className}
      />
    );
  }

  // Return null for non-shared content messages
  if (message.type !== 'restaurant' && message.type !== 'recipe') {
    return null;
  }

  // Fallback for shared content without data
  return (
    <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
      <p className="text-sm text-gray-600">
        Shared content data is missing or corrupted.
      </p>
    </div>
  );
}