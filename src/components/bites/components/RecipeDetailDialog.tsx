import { Clock, Users, Bookmark, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Separator } from "../../ui/separator";
import { Button } from "../../ui/button";
import type { Recipe } from "./RecipeCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { savedItemsService } from "../../../services";
import { useAuth } from "../../auth/AuthProvider";
import { toast } from "sonner";

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
  
  if (!recipe) return null;

  // Strip HTML from summary
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleSaveToPlate = async () => {
    console.log('🍽️ Save Recipe to Plate triggered');
    console.log('👤 Current user from useAuth:', user);
    console.log('🍳 Selected recipe:', recipe);

    if (!user) {
      toast.error('Please sign in to save recipes');
      console.log('❌ No user found in useAuth hook');
      return;
    }

    if (!recipe) {
      toast.error('No recipe selected');
      console.log('❌ No recipe selected');
      return;
    }

    try {
      console.log('💾 Attempting to save recipe...');
      
      const recipeMetadata = {
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        diets: recipe.diets || [],
        cuisines: recipe.cuisines || [],
        summary: recipe.summary ? stripHtml(recipe.summary).substring(0, 300) : null,
        instructions: recipe.instructions ? stripHtml(recipe.instructions) : null,
        extendedIngredients: recipe.extendedIngredients || []
      };

      console.log('📊 Recipe data to save:', recipeMetadata);

      const result = await savedItemsService.saveItem({
        itemId: recipe.id.toString(),
        itemType: 'recipe',
        metadata: recipeMetadata
      });

      console.log('📤 Save result:', result);

      if (result.success) {
        toast.success(`${recipe.title} saved to your plate!`);
        console.log('✅ Recipe saved successfully');
      } else {
        if (result.error === 'Item already saved') {
          toast.info(`${recipe.title} is already in your plate`);
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
    console.log("Sharing recipe:", recipe.title);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-white">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="pr-8">{recipe.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Recipe details for {recipe.title}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-4rem)]">
          <div className="p-6 pt-4">
            <div className="aspect-video overflow-hidden rounded-lg mb-6 bg-gray-100">
              <ImageWithFallback
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>{recipe.readyInMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span>{recipe.servings} servings</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={handleSaveToPlate}
                  variant="outline"
                  className="gap-2 border-gray-300 flex-1 sm:flex-none"
                >
                  <Bookmark className="w-4 h-4" />
                  SAVE TO PLATE
                </Button>
                <Button
                  onClick={handleShareWithFriend}
                  variant="outline"
                  className="gap-2 border-gray-300 flex-1 sm:flex-none"
                >
                  <Share2 className="w-4 h-4" />
                  SHARE WITH FRIEND
                </Button>
              </div>
            </div>

            {(recipe.diets.length > 0 || recipe.cuisines.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.diets.map((diet) => (
                  <Badge
                    key={diet}
                    variant="secondary"
                    className="bg-gray-100 text-gray-700"
                  >
                    {diet}
                  </Badge>
                ))}
                {recipe.cuisines.map((cuisine) => (
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
              <p className="text-gray-700">{stripHtml(recipe.summary)}</p>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h4 className="mb-3">Ingredients</h4>
              <ul className="space-y-2">
                {recipe.extendedIngredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1.5">•</span>
                    <span className="text-gray-700">{ingredient.original}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator className="my-6" />

            <div>
              <h4 className="mb-3">Instructions</h4>
              <div className="text-gray-700 whitespace-pre-line">
                {stripHtml(recipe.instructions)}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}