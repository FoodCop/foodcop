import { Clock, Users } from "lucide-react";
import React from "react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { ImageWithFallback } from "../../ui/image-with-fallback";

export interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  diets: string[];
  cuisines: string[];
  summary: string;
  instructions: string;
  extendedIngredients: {
    id: number;
    original: string;
  }[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg border-gray-200"
      onClick={onClick}
    >
      <div className="aspect-4/3 overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="mb-3">{recipe.title}</h3>
        <div className="flex items-center gap-4 text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{recipe.readyInMinutes} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="text-sm">{recipe.servings} servings</span>
          </div>
        </div>
        {recipe.diets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.diets.map((diet) => (
              <Badge
                key={diet}
                variant="secondary"
                className="bg-gray-100 text-gray-700"
              >
                {diet}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
