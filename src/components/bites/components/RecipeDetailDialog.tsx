import { Clock, Heart, Share2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import { Button } from "../../ui/button";
import type { Recipe } from "./RecipeCard";
import { ImageWithFallback } from "../../ui/image-with-fallback";
import { savedItemsService } from "../../../services";
import { useAuth } from "../../auth/AuthProvider";
import { toast } from "sonner";
import { toastHelpers } from "../../../utils/toastHelpers";
import { SpoonacularService } from "../../../services/spoonacular";

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
}: RecipeDetailDialogProps) {
  // Authentication
  const { user } = useAuth();
  
  // ✅ State for enriched recipe data
  const [enrichedRecipe, setEnrichedRecipe] = useState<Recipe | null>(recipe);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ✅ Lazy-load full recipe details when dialog opens
  useEffect(() => {
    if (!recipe || !open) {
      setEnrichedRecipe(recipe);
      return;
    }

    const needsEnrichment = 
      !recipe.instructions || 
      recipe.instructions.length === 0 || 
      !recipe.extendedIngredients || 
      recipe.extendedIngredients.length === 0;

    if (needsEnrichment) {
      loadRecipeDetails();
    } else {
      setEnrichedRecipe(recipe);
    }

    async function loadRecipeDetails() {
      try {
        setLoadingDetails(true);
        console.log('📥 Lazy-loading full recipe details for:', recipe.id);
        
        const result = await SpoonacularService.getRecipeInformation(recipe.id);
        
        if (result.success && result.data) {
          const fullRecipe = result.data;
          console.log('✅ Full recipe data loaded:', {
            id: fullRecipe.id,
            hasInstructions: !!fullRecipe.instructions,
            ingredientCount: fullRecipe.extendedIngredients?.length || 0,
            hasAnalyzedInstructions: !!fullRecipe.analyzedInstructions,
            hasWinePairing: !!fullRecipe.winePairing
          });

          // ✅ Merge full data into enriched recipe
          setEnrichedRecipe({
            ...recipe,
            instructions: fullRecipe.instructions || recipe.instructions || "",
            extendedIngredients: fullRecipe.extendedIngredients || recipe.extendedIngredients || [],
            analyzedInstructions: fullRecipe.analyzedInstructions,
            sourceUrl: fullRecipe.sourceUrl || recipe.sourceUrl,
            aggregateLikes: fullRecipe.aggregateLikes || recipe.aggregateLikes,
            healthScore: fullRecipe.healthScore || recipe.healthScore,
            pricePerServing: fullRecipe.pricePerServing || recipe.pricePerServing,
            winePairing: fullRecipe.winePairing,
            nutrition: fullRecipe.nutrition,
            preparationMinutes: fullRecipe.preparationMinutes || recipe.preparationMinutes,
            cookingMinutes: fullRecipe.cookingMinutes || recipe.cookingMinutes,
          });
        } else {
          console.warn('⚠️ Failed to load full recipe details:', result.error);
          setEnrichedRecipe(recipe);
        }
      } catch (error) {
        console.error('❌ Error loading recipe details:', error);
        setEnrichedRecipe(recipe);
      } finally {
        setLoadingDetails(false);
      }
    }
  }, [recipe, open]);
  
  if (!recipe || !enrichedRecipe) return null;

  // Strip HTML from summary
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleSaveToPlate = async () => {
    console.log('🍽️ Save Recipe to Plate triggered');
    console.log('👤 Current user from useAuth:', user);
    console.log('🍳 Selected recipe:', enrichedRecipe);

    if (!user) {
      toast.error('Please sign in to save recipes');
      console.log('❌ No user found in useAuth hook');
      return;
    }

    if (!enrichedRecipe) {
      toast.error('No recipe selected');
      console.log('❌ No recipe selected');
      return;
    }

    try {
      console.log('💾 Attempting to save recipe...');
      
      const recipeMetadata = {
        title: enrichedRecipe.title,
        image: enrichedRecipe.image,
        readyInMinutes: enrichedRecipe.readyInMinutes,
        servings: enrichedRecipe.servings,
        diets: enrichedRecipe.diets || [],
        cuisines: enrichedRecipe.cuisines || [],
        summary: enrichedRecipe.summary ? stripHtml(enrichedRecipe.summary).substring(0, 300) : null,
        instructions: enrichedRecipe.instructions ? stripHtml(enrichedRecipe.instructions) : null,
        extendedIngredients: enrichedRecipe.extendedIngredients || []
      };

      console.log('📊 Recipe data to save:', recipeMetadata);

      const result = await savedItemsService.saveItem({
        itemId: enrichedRecipe.id.toString(),
        itemType: 'recipe',
        metadata: recipeMetadata
      });

      console.log('📤 Save result:', result);

      if (result.success) {
        toastHelpers.saved(enrichedRecipe.title);
        console.log('✅ Recipe saved successfully');
      } else {
        if (result.error === 'Item already saved') {
          toast.info(`${enrichedRecipe.title} is already in your plate`);
          console.log('ℹ️ Recipe already saved');
        } else {
          toast.error(result.error || 'Failed to save recipe');
          console.log('❌ Failed to save:', result.error);
        }
      }
    } catch (error) {
      console.error('💥 Error saving recipe:', error);
      toast.error('An error occurred while saving the recipe');
    }
  };

  const handleShareWithFriend = () => {
    // Placeholder for share functionality
    console.log("Sharing recipe:", enrichedRecipe.title);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-white">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="pr-8">{enrichedRecipe.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Recipe details for {enrichedRecipe.title}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-4rem)]">
          <div className="p-6 pt-4">
            <div className="aspect-video overflow-hidden rounded-lg mb-6 bg-gray-100">
              <ImageWithFallback
                src={enrichedRecipe.image}
                alt={enrichedRecipe.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>
                    {enrichedRecipe.readyInMinutes} min
                    {enrichedRecipe.preparationMinutes && enrichedRecipe.cookingMinutes && (
                      <span className="text-sm text-gray-500 ml-1">
                        (prep: {enrichedRecipe.preparationMinutes}m, cook: {enrichedRecipe.cookingMinutes}m)
                      </span>
                    )}
                  </span>
                </div>
                {enrichedRecipe.healthScore && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-sm">Health Score: {enrichedRecipe.healthScore}/100</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Save to Plate */}
                <button
                  onClick={handleSaveToPlate}
                  className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto bg-[var(--button-bg-active)] text-[var(--button-text)] rounded-full hover:bg-[var(--button-bg-hover)] transition-colors cursor-pointer font-medium"
                >
                  <Heart size={14} />
                  <span className="text-sm whitespace-nowrap">
                    Save to Plate
                  </span>
                </button>

                {/* Share with Friend */}
                <button
                  onClick={handleShareWithFriend}
                  className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto bg-[var(--button-bg-default)] text-[var(--button-text)] rounded-full hover:bg-[var(--button-bg-hover)] transition-colors cursor-pointer font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm whitespace-nowrap">
                    Share with Friend
                  </span>
                </button>
              </div>

            </div>

            {(enrichedRecipe.diets.length > 0 || enrichedRecipe.cuisines.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {enrichedRecipe.diets.map((diet) => (
                  <Badge
                    key={diet}
                    variant="secondary"
                    className="bg-gray-100 text-gray-700"
                  >
                    {diet}
                  </Badge>
                ))}
                {enrichedRecipe.cuisines.map((cuisine) => (
                  <Badge
                    key={cuisine}
                    variant="outline"
                    className="border-gray-300"
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-700">{stripHtml(enrichedRecipe.summary)}</p>
              {enrichedRecipe.sourceUrl && (
                <a 
                  href={enrichedRecipe.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  View original recipe →
                </a>
              )}
            </div>

            <Separator className="my-6" />

            {/* ✅ Ingredients Section with Loading State */}
            <div className="mb-6">
              <h4 className="mb-3">Ingredients</h4>
              {loadingDetails ? (
                <div className="flex items-center gap-2 text-gray-500 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading ingredients...</span>
                </div>
              ) : enrichedRecipe.extendedIngredients.length > 0 ? (
                <ul className="space-y-2">
                  {enrichedRecipe.extendedIngredients.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1.5">•</span>
                      <span className="text-gray-700">{ingredient.original}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No ingredients available.</p>
              )}
            </div>

            <Separator className="my-6" />

            {/* ✅ Instructions Section with Analyzed Steps Support */}
            <div>
              <h4 className="mb-3">Instructions</h4>
              {loadingDetails ? (
                <div className="flex items-center gap-2 text-gray-500 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading instructions...</span>
                </div>
              ) : enrichedRecipe.analyzedInstructions && enrichedRecipe.analyzedInstructions.length > 0 ? (
                // ✅ Use step-by-step instructions if available
                <div className="space-y-4">
                  {enrichedRecipe.analyzedInstructions[0].steps.map((step) => (
                    <div key={step.number} className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {step.number}
                      </div>
                      <p className="text-gray-700 flex-1">{step.step}</p>
                    </div>
                  ))}
                </div>
              ) : enrichedRecipe.instructions ? (
                // ✅ Fallback to plain text instructions
                <div className="text-gray-700 whitespace-pre-line">
                  {stripHtml(enrichedRecipe.instructions)}
                </div>
              ) : (
                <p className="text-gray-500 italic">No instructions available.</p>
              )}
            </div>

            {/* ✅ Wine Pairing Section (if available) */}
            {enrichedRecipe.winePairing?.pairedWines && enrichedRecipe.winePairing.pairedWines.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h4 className="mb-3">Wine Pairing</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {enrichedRecipe.winePairing.pairedWines.map((wine) => (
                        <Badge key={wine} variant="outline" className="border-purple-300 text-purple-700">
                          {wine}
                        </Badge>
                      ))}
                    </div>
                    {enrichedRecipe.winePairing.pairingText && (
                      <p className="text-gray-700 text-sm">{enrichedRecipe.winePairing.pairingText}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}