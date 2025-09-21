import { Clock, Flame, Share2, Star, Users } from "lucide-react";
import React from "react";
import { Recipe } from "../constants/recipesData";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  onSelect?: (recipe: Recipe) => void;
  onShare?: () => void;
}

export function RecipeCard({
  recipe,
  onClick,
  onSelect,
  onShare,
}: RecipeCardProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.();
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(recipe);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
    >
      {/* Recipe Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/20 ${
              recipe.difficulty === "Easy"
                ? "bg-green-500/80 text-white"
                : recipe.difficulty === "Medium"
                ? "bg-yellow-500/80 text-white"
                : "bg-red-500/80 text-white"
            }`}
          >
            {recipe.difficulty}
          </span>
        </div>

        {/* Recipe Rating */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          <span className="text-xs font-medium text-gray-900">
            {recipe.rating}
          </span>
        </div>
      </div>

      {/* Recipe Info */}
      <div className="p-4">
        {/* Title and Cuisine */}
        <div className="mb-3">
          <h3 className="font-semibold text-[#0B1F3A] mb-1 line-clamp-1">
            {recipe.title}
          </h3>
          <p className="text-sm text-gray-600">
            {recipe.cuisine} • by {recipe.author.name}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-[#F8F9FA] text-xs font-medium text-gray-600 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span className="px-2 py-1 bg-[#F8F9FA] text-xs font-medium text-gray-600 rounded-full">
              +{recipe.tags.length - 3}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.cookingTime}m</span>
          </div>
          <div className="flex items-center space-x-1">
            <Flame className="w-4 h-4" />
            <span>
              {recipe.nutrition?.calories || recipe.calories || 0} cal
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleClick}
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
      </div>
    </div>
  );
}
