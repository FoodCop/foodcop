import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Users,
  ChefHat,
  Send,
  Bookmark,
  Heart,
  Check
} from 'lucide-react';
import { SpoonacularService } from '../../../services/spoonacular';
import type { Recipe } from './RecipeCard';
import { toast } from 'sonner';
import { savedItemsService } from '../../../services/savedItemsService';
import { useAuth } from '../../auth/AuthProvider';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  const { user } = useAuth();
  const [fullRecipe, setFullRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadFullRecipe();
  }, [recipe.id]);

  const loadFullRecipe = async () => {
    setLoading(true);
    try {
      const result = await SpoonacularService.getRecipeInformation(recipe.id, true);
      if (result.success && result.data) {
        setFullRecipe(result.data);
      }
    } catch (err) {
      console.error('Error loading full recipe:', err);
      toast.error('Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToPlate = async () => {
    if (!user) {
      toast.error('Please sign in to save recipes');
      return;
    }

    try {
      await savedItemsService.saveItem({
        itemId: `spoonacular_${recipe.id}`,
        itemType: 'recipe',
        metadata: {
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
          healthScore: recipe.healthScore,
          cuisines: recipe.cuisines,
          diets: recipe.diets
        }
      });
      toast.success('Recipe saved to Plate!');
    } catch (err) {
      toast.error('Failed to save recipe');
      console.error('Error saving recipe:', err);
    }
  };

  const handleSendToFriend = () => {
    toast.success('Share feature coming soon!');
  };

  const getMacros = () => {
    if (!fullRecipe?.nutrition?.nutrients) return null;
    
    const protein = fullRecipe.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0;
    const carbs = fullRecipe.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
    const fat = fullRecipe.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0;
    
    return { protein, carbs, fat };
  };

  const getSteps = () => {
    if (!fullRecipe?.analyzedInstructions?.[0]?.steps) return [];
    return fullRecipe.analyzedInstructions[0].steps;
  };

  const steps = getSteps();
  const ingredients = fullRecipe?.extendedIngredients || [];
  const macros = getMacros();
  const isDietary = recipe.diets && recipe.diets.length > 0;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#EEE] px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-[#0f172a]">{recipe.title}</h2>
            {recipe.diets && recipe.diets.length > 0 && (
              <span className="px-3 py-1 bg-[#FFD500]/20 text-[#0f172a] text-sm font-medium rounded-full border border-[#FFD500]/30">
                {recipe.diets[0]}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#FAFAFA] rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-[#0f172a]" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-8">
            {/* Left Column (3/5) */}
            <div className="lg:col-span-3 space-y-8">
              {/* Hero Image */}
              <div className="relative h-96 rounded-2xl overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#FAFAFA] rounded-xl p-4 text-center border border-[#EEE]">
                  <Clock className="w-6 h-6 text-[#FFD500] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#0f172a]">
                    {recipe.readyInMinutes || 30}
                  </p>
                  <p className="text-sm text-[#8A8A8A]">Minutes</p>
                </div>
                <div className="bg-[#FAFAFA] rounded-xl p-4 text-center border border-[#EEE]">
                  <Users className="w-6 h-6 text-[#FFD500] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#0f172a]">
                    {fullRecipe?.servings || 4}
                  </p>
                  <p className="text-sm text-[#8A8A8A]">Servings</p>
                </div>
                <div className="bg-[#FAFAFA] rounded-xl p-4 text-center border border-[#EEE]">
                  <p className="text-2xl font-bold text-[#0f172a] mb-2">🔥</p>
                  <p className="text-2xl font-bold text-[#0f172a]">
                    {fullRecipe?.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount.toFixed(0) || 0}
                  </p>
                  <p className="text-sm text-[#8A8A8A]">Calories</p>
                </div>
                <div className="bg-[#FAFAFA] rounded-xl p-4 text-center border border-[#EEE]">
                  <Heart className="w-6 h-6 text-[#FFD500] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#0f172a]">
                    {recipe.healthScore ? (recipe.healthScore / 20).toFixed(1) : '4.0'}
                  </p>
                  <p className="text-sm text-[#8A8A8A]">Rating</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSendToFriend}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-white rounded-xl transition-colors font-medium shadow-sm"
                >
                  <Send className="w-5 h-5" />
                  Send to Friend
                </button>
                <button
                  onClick={handleSaveToPlate}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[#ef4444] hover:bg-[#ef4444]/90 text-white rounded-xl transition-colors font-medium shadow-sm"
                >
                  <Bookmark className="w-5 h-5" />
                  Save to Plate
                </button>
              </div>

              {/* Ingredients */}
              <div className="bg-white rounded-xl p-6 border border-[#EEE] shadow-sm">
                <h4 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#FFD500]" />
                  Ingredients
                </h4>
                <ul className="space-y-3">
                  {ingredients.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-[#FFD500] rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-[#0f172a]">{ingredient.original}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#FFD500]" />
                  Instructions
                </h4>
                <div className="space-y-4">
                  {steps.map((step) => (
                    <div key={step.number} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FFD500] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#8A8A8A] font-bold">{step.number}</span>
                      </div>
                      <div className="bg-white rounded-xl p-5 flex-1 border border-[#EEE] shadow-sm">
                        <p className="text-[#0f172a]">{step.step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (2/5) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Nutrition Facts */}
              {macros && (
                <div className="bg-white rounded-2xl p-6 border border-[#EEE] shadow-sm">
                  <h4 className="text-lg font-bold text-[#0f172a] mb-4">Nutrition Facts</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#0f172a]">Protein</span>
                      <span className="font-bold text-[#FFD500]">{macros.protein.toFixed(1)}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#0f172a]">Carbs</span>
                      <span className="font-bold text-[#f59e0b]">{macros.carbs.toFixed(1)}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#0f172a]">Fat</span>
                      <span className="font-bold text-[#64748b]">{macros.fat.toFixed(1)}g</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Nutrition Table */}
              {fullRecipe?.nutrition?.nutrients && (
                <div className="bg-white rounded-2xl p-6 border border-[#EEE] shadow-sm">
                  <h4 className="text-lg font-bold text-[#0f172a] mb-4">Nutrition Details</h4>
                  <div className="space-y-3">
                    {fullRecipe.nutrition.nutrients.slice(0, 10).map((nutrient, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-[#EEE] pb-2">
                        <span className="text-sm text-[#0f172a]">{nutrient.name}</span>
                        <span className="text-sm font-medium text-[#0f172a]">
                          {nutrient.amount.toFixed(1)} {nutrient.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Information */}
              <div className="bg-white rounded-2xl p-6 border border-[#EEE] shadow-sm">
                <h4 className="text-lg font-bold text-[#0f172a] mb-4">Dietary Information</h4>
                <div className="space-y-3">
                  {recipe.diets && recipe.diets.length > 0 ? (
                    recipe.diets.map((diet, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-[#FFD500]" />
                        <span className="text-[#0f172a] capitalize">{diet}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#8A8A8A]">No specific dietary restrictions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeModal;
