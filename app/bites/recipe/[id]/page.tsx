'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { RecipeViewer } from '@/components/recipes';
import { toast } from 'sonner';

export default function RecipeViewerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recipe, setRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecipeFromAPI = useCallback(async (recipeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/debug/bites-recipe-search?id=${recipeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setRecipe(data.data);
      } else {
        throw new Error(data.error || 'Recipe not found');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Failed to load recipe');
      router.push('/bites');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const recipeId = params.id as string;
    
    // Try to get recipe data from search params first (when navigating from Bites)
    const recipeData = searchParams.get('data');
    if (recipeData) {
      try {
        const decodedRecipe = JSON.parse(decodeURIComponent(recipeData));
        setRecipe(decodedRecipe);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing recipe data from URL:', error);
      }
    }

    // Fallback: fetch recipe from Spoonacular API
    fetchRecipeFromAPI(recipeId);
  }, [params.id, searchParams, fetchRecipeFromAPI]);

  const handleBack = () => {
    router.push('/bites');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F14C35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recipe not found</h1>
          <p className="text-gray-600 mb-4">The recipe you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            onClick={handleBack}
            className="bg-[#F14C35] text-white px-4 py-2 rounded-lg hover:bg-[#E63E26] transition-colors"
          >
            Back to Bites
          </button>
        </div>
      </div>
    );
  }

  return (
    <RecipeViewer
      recipe={recipe}
      onBack={handleBack}
      onShare={(recipe) => {
        if (navigator.share) {
          navigator.share({
            title: recipe.title,
            text: `Check out this recipe: ${recipe.title}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => {
            toast.success('Recipe link copied to clipboard!');
          });
        }
      }}
    />
  );
}