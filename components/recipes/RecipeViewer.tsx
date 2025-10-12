import React, { useState, useEffect, useCallback } from 'react';
import type { Recipe } from '@/components/recipes/types';
import { convertSpoonacularRecipe } from '@/components/recipes/types';
import { RecipeDetail } from '@/components/recipes/RecipeDetail';
import { toast } from 'sonner';
import { savedItemsService } from '@/lib/savedItemsService';
import { useAuth } from '@/components/auth/AuthProvider';

interface RecipeViewerProps {
  recipe: Recipe | any; // Accept either our Recipe type or Spoonacular recipe
  onBack: () => void;
  onShare?: (recipe: Recipe) => void;
}

export function RecipeViewer({ recipe: rawRecipe, onBack, onShare }: RecipeViewerProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const checkIfSaved = useCallback(async (recipeId: string) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await savedItemsService.isItemSaved({ 
        itemType: 'recipe',
        itemId: recipeId
      });
      
      if (result.success && result.data !== undefined) {
        setIsSaved(result.data);
      }
    } catch (error) {
      console.error('Error checking if recipe is saved:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Convert the recipe to our format if needed
    if (rawRecipe) {
      let convertedRecipe: Recipe;
      
      // Check if it's already in our format or needs conversion from Spoonacular
      if (rawRecipe.spoonacularSourceUrl || !rawRecipe.author) {
        convertedRecipe = convertSpoonacularRecipe(rawRecipe);
      } else {
        convertedRecipe = rawRecipe;
      }
      
      setRecipe(convertedRecipe);
      checkIfSaved(convertedRecipe.id.toString());
    }
  }, [rawRecipe, checkIfSaved]);

  const handleSave = async () => {
    if (!recipe || !user) {
      toast.error('Please sign in to save recipes');
      return;
    }

    try {
      if (isSaved) {
        // Remove from saved
        const removeResult = await savedItemsService.unsaveItem({
          itemType: 'recipe',
          itemId: recipe.id.toString()
        });
        
        if (removeResult.success) {
          setIsSaved(false);
          toast.success('Recipe removed from your plate');
        } else {
          toast.error('Failed to remove recipe');
        }
      } else {
        // Save to plate
        const saveResult = await savedItemsService.saveItem({
          itemId: recipe.id.toString(),
          itemType: 'recipe',
          metadata: {
            spoonacularId: recipe.id,
            title: recipe.title,
            image: recipe.image,
            readyInMinutes: recipe.readyInMinutes,
            servings: recipe.servings,
            healthScore: recipe.healthScore,
            diets: recipe.diets,
            cuisines: recipe.cuisines,
            summary: recipe.summary,
            sourceUrl: recipe.sourceUrl || recipe.spoonacularSourceUrl,
            difficulty: recipe.difficulty,
            calories: recipe.calories,
            nutrition: recipe.nutrition
          }
        });

        if (saveResult.success) {
          setIsSaved(true);
          toast.success('Recipe saved to your plate!');
        } else {
          toast.error('Failed to save recipe');
        }
      }
    } catch (error) {
      console.error('Error saving/removing recipe:', error);
      toast.error('An error occurred');
    }
  };

  const handleShare = () => {
    if (!recipe) return;
    
    if (onShare) {
      onShare(recipe);
    } else {
      // Default share behavior
      if (navigator.share) {
        navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: recipe.sourceUrl || recipe.spoonacularSourceUrl || window.location.href,
        }).catch(console.error);
      } else {
        // Fallback to copying to clipboard
        const shareText = `Check out this recipe: ${recipe.title}\n${recipe.sourceUrl || recipe.spoonacularSourceUrl || window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
          toast.success('Recipe link copied to clipboard!');
        }).catch(() => {
          toast.error('Failed to copy link');
        });
      }
    }
  };

  if (isLoading || !recipe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F14C35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  return (
    <RecipeDetail
      recipe={recipe}
      onBack={onBack}
      onSave={handleSave}
      onShare={handleShare}
      isSaved={isSaved}
    />
  );
}