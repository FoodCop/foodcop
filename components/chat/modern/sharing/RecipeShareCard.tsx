'use client';

import React from 'react';
import { Clock, ChefHat, Users, ExternalLink, Heart, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { RecipeMessage, RecipeData } from './types/ShareTypes';

interface RecipeShareCardProps {
  message: RecipeMessage;
  onSaveToPlate?: (recipe: RecipeData) => void;
  onViewDetails?: (recipe: RecipeData) => void;
  className?: string;
  isPreview?: boolean; // for previewing while composing
}

export default function RecipeShareCard({
  message,
  onSaveToPlate,
  onViewDetails,
  className = '',
  isPreview = false
}: RecipeShareCardProps) {
  const { recipe } = message;

  const getDifficultyColor = (difficulty: string): string => {
    const colors = {
      'Easy': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Hard': 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyIcon = (difficulty: string): string => {
    const icons = {
      'Easy': '👨‍🍳',
      'Medium': '👩‍🍳',
      'Hard': '🧑‍🍳'
    };
    return icons[difficulty as keyof typeof icons] || '👨‍🍳';
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  const getPreviewIngredients = (ingredients: string[]): string => {
    if (ingredients.length <= 3) {
      return ingredients.join(', ');
    }
    return `${ingredients.slice(0, 3).join(', ')} +${ingredients.length - 3} more`;
  };

  const handleSaveToPlate = () => {
    onSaveToPlate?.(recipe);
  };

  const handleViewDetails = () => {
    onViewDetails?.(recipe);
  };

  return (
    <Card className={`max-w-sm mx-auto overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Recipe Image */}
        <div className="relative h-40 bg-gray-200">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
              <div className="text-center">
                <div className="text-3xl mb-2">🍳</div>
                <p className="text-sm text-gray-600 font-medium">No image available</p>
              </div>
            </div>
          )}
          
          {/* Difficulty Badge */}
          <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 shadow-md">
            <div className="flex items-center gap-1">
              <span className="text-xs">{getDifficultyIcon(recipe.difficulty)}</span>
              <span className="text-xs font-semibold">{recipe.difficulty}</span>
            </div>
          </div>

          {/* Category Badge */}
          {recipe.category && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                {recipe.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Recipe Details */}
        <div className="p-4">
          <div className="space-y-3">
            {/* Recipe Title */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                {recipe.title}
              </h3>
              {recipe.author && (
                <p className="text-sm text-gray-500 mt-1">by {recipe.author}</p>
              )}
            </div>

            {/* Recipe Meta Info */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(recipe.cooking_time)}</span>
              </div>
              
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
              
              {recipe.calories && (
                <div className="flex items-center gap-1">
                  <Utensils className="w-4 h-4" />
                  <span>{recipe.calories} cal</span>
                </div>
              )}
            </div>

            {/* Prep Time */}
            {recipe.prep_time && recipe.prep_time !== recipe.cooking_time && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Prep:</span> {formatTime(recipe.prep_time)}
              </div>
            )}

            {/* Ingredients Preview */}
            {recipe.ingredients.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Ingredients:</p>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {getPreviewIngredients(recipe.ingredients)}
                </p>
              </div>
            )}

            {/* Description */}
            {recipe.description && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {recipe.description}
              </p>
            )}

            {/* Optional Message from Sharer */}
            {message.message && !isPreview && (
              <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                <p className="text-sm text-green-800 italic">
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
              View Recipe
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}