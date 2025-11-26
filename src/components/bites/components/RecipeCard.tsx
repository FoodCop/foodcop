import { Clock } from "lucide-react";
import React from "react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { ImageWithFallback } from "../../ui/image-with-fallback";
import { CardHeading } from "../../ui/card-heading";

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
    name?: string;
    amount?: number;
    unit?: string;
  }[];
  // Additional fields from Spoonacular detail endpoint
  sourceUrl?: string;
  aggregateLikes?: number;
  healthScore?: number;
  pricePerServing?: number;
  analyzedInstructions?: {
    name: string;
    steps: {
      number: number;
      step: string;
      ingredients?: { id: number; name: string; image: string }[];
      equipment?: { id: number; name: string; image: string }[];
    }[];
  }[];
  winePairing?: {
    pairedWines?: string[];
    pairingText?: string;
    productMatches?: {
      title: string;
      description: string;
      price: string;
      imageUrl: string;
      link: string;
    }[];
  };
  nutrition?: {
    nutrients?: { name: string; amount: number; unit: string }[];
  };
  preparationMinutes?: number;
  cookingMinutes?: number;
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
        <CardHeading variant="accent" size="md" lineClamp={2} className="mb-3">{recipe.title}</CardHeading>
        <div className="flex items-center gap-4 text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{recipe.readyInMinutes} min</span>
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
