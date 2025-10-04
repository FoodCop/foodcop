'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChefHat, Clock, Users, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { savedItemsService } from '@/lib/savedItemsService';
import { toast } from 'sonner';

interface Recipe {
  id: string;
  recipe_id: string;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  diets?: string[];
  created_at: string;
}

interface RecipesTabProps {
  recipes: Recipe[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
}

export function RecipesTab({ recipes, loading, error, onRefresh }: RecipesTabProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (recipeId: string) => {
    setImageErrors(prev => new Set(prev).add(recipeId));
  };

  const handleRemove = async (recipeId: string, title: string) => {
    if (!confirm(`Remove "${title}" from your plate?`)) return;
    
    setRemovingId(recipeId);
    try {
      const result = await savedItemsService.unsaveItem({
        itemId: recipeId,
        itemType: 'recipe'
      });
      
      if (result.success) {
        toast.success(`"${title}" removed from your plate`);
        onRefresh(); // Refresh the data
      } else {
        toast.error(result.error || 'Failed to remove recipe');
      }
    } catch (error) {
      console.error('Failed to remove recipe:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setRemovingId(null);
    }
  };
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Saved Recipes</h2>
          <Button disabled variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes saved yet</h3>
        <p className="text-gray-600 mb-4">
          Discover and save recipes from the Bites page to see them here.
        </p>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Saved Recipes ({recipes.length})
        </h2>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
            {/* Recipe Image */}
            {recipe.image && !imageErrors.has(recipe.id) ? (
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                  onError={() => handleImageError(recipe.id)}
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            <CardContent className="p-4">
              {/* Recipe Info */}
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {recipe.title}
              </h3>
              
              {/* Recipe Details */}
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                {recipe.readyInMinutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.readyInMinutes} min</span>
                  </div>
                )}
                
                {recipe.servings && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                )}
              </div>
              
              {/* Diet Labels */}
              {recipe.diets && recipe.diets.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.diets.slice(0, 3).map((diet, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                    >
                      {diet}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // TODO: Open recipe details or link to Spoonacular
                    const spoonacularId = recipe.recipe_id;
                    const recipeSlug = recipe.title?.toLowerCase().replace(/\s+/g, '-');
                    window.open(`https://spoonacular.com/recipes/${recipeSlug}-${spoonacularId}`, '_blank');
                  }}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Recipe
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(recipe.recipe_id, recipe.title)}
                  disabled={removingId === recipe.recipe_id}
                >
                  {removingId === recipe.recipe_id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Saved Date */}
              <p className="text-xs text-gray-500 mt-2">
                Saved {new Date(recipe.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}