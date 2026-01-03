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

// Generate random aspect ratio for variety
const getRandomAspectRatio = () => {
  const ratios = [
    'aspect-square',      // 1:1
    'aspect-[3/4]',       // 3:4 (vertical)
    'aspect-[4/3]',       // 4:3 (landscape)
    'aspect-[3/4]',       // More vertical for variety
    'aspect-[4/5]',       // Slightly vertical
  ];
  return ratios[Math.floor(Math.random() * ratios.length)];
};

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  // Use recipe ID to create varied card sizes for masonry effect
  const cardVariant = React.useMemo(() => {
    const seed = recipe.id;
    const variants = [
      { name: 'compact', imageClass: 'h-40', showDiets: false },     // Very short
      { name: 'medium', imageClass: 'h-64', showDiets: true },       // Medium
      { name: 'tall', imageClass: 'h-80', showDiets: true },         // Tall
      { name: 'extra-tall', imageClass: 'h-96', showDiets: true },   // Extra tall
    ];
    return variants[seed % variants.length];
  }, [recipe.id]);

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg border-gray-200 w-full"
      onClick={onClick}
    >
      <div className={`${cardVariant.imageClass} w-full overflow-hidden bg-gray-100`}>
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <div className="p-4">
        <CardHeading variant="accent" size="md" lineClamp={2} className="mb-3">{recipe.title}</CardHeading>
        
        {/* Source Attribution with Avatar */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full bg-[#8DC63F] flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <span className="text-xs text-gray-500">Spoonacular</span>
        </div>
      </div>
    </Card>
  );
}
