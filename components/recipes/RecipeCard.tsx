import React, { useState } from 'react';
import { Clock, Users, Flame, Heart, Share2, Bookmark, Star } from 'lucide-react';
import type { Recipe } from '@/components/recipes/types';
import Image from 'next/image';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onSave: () => void;
  onShare: () => void;
  isSaved?: boolean;
  showActions?: boolean;
}

export function RecipeCard({ recipe, onClick, onSave, onShare, isSaved = false, showActions = true }: RecipeCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
    >
      {/* Recipe Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {showActions && (
          <>
            {/* Overlay Actions */}
            <div className="absolute top-3 right-3 flex space-x-2">
              <button
                onClick={handleLike}
                className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-colors ${
                  isLiked 
                    ? 'bg-[#F14C35] text-white' 
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleSave}
                className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-colors ${
                  isSaved 
                    ? 'bg-[#F14C35] text-white' 
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Difficulty Badge */}
            {recipe.difficulty && (
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/20 ${
                  recipe.difficulty === 'Easy' ? 'bg-green-500/80 text-white' :
                  recipe.difficulty === 'Medium' ? 'bg-yellow-500/80 text-white' :
                  'bg-red-500/80 text-white'
                }`}>
                  {recipe.difficulty}
                </span>
              </div>
            )}
          </>
        )}

        {/* Recipe Rating */}
        {recipe.spoonacularScore && (
          <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs font-medium text-gray-900">{Math.round(recipe.spoonacularScore / 10)}</span>
          </div>
        )}
      </div>

      {/* Recipe Info */}
      <div className="p-4">
        {/* Title and Cuisine */}
        <div className="mb-3">
          <h3 className="font-semibold text-[#0B1F3A] mb-1 line-clamp-1">{recipe.title}</h3>
          {recipe.cuisines && recipe.cuisines.length > 0 && (
            <p className="text-sm text-gray-600">{recipe.cuisines[0]} • Ready in {recipe.readyInMinutes}m</p>
          )}
        </div>

        {/* Tags */}
        {recipe.diets && recipe.diets.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.diets.slice(0, 3).map((diet: string) => (
              <span
                key={diet}
                className="px-2 py-1 bg-[#F8F9FA] text-xs font-medium text-gray-600 rounded-full"
              >
                #{diet}
              </span>
            ))}
            {recipe.diets.length > 3 && (
              <span className="px-2 py-1 bg-[#F8F9FA] text-xs font-medium text-gray-600 rounded-full">
                +{recipe.diets.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.readyInMinutes}m</span>
          </div>
          {recipe.healthScore && (
            <div className="flex items-center space-x-1">
              <Flame className="w-4 h-4" />
              <span>{recipe.healthScore} health</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={onClick}
              className="flex-1 bg-[#F14C35] text-white py-2 px-4 rounded-xl font-medium hover:bg-[#E63E26] transition-colors"
            >
              View Recipe
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}