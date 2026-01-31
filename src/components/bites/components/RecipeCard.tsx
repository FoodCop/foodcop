import React from "react";
import { Card } from "../../ui/card";
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
  const cardVariant = React.useMemo(() => {
    const seed = recipe?.id || 0;
    const variants = [
      { name: "compact", imageClass: "h-40" },
      { name: "medium", imageClass: "h-64" },
      { name: "tall", imageClass: "h-80" },
      { name: "extra-tall", imageClass: "h-96" },
    ];
    return variants[seed % variants.length];
  }, [recipe?.id]);

  const imageClass = cardVariant?.imageClass || "h-64";

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg w-full"
      style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-secondary)", borderWidth: "2px", borderStyle: "solid" }}
      onClick={onClick}
    >
      <div className={`${imageClass} w-full overflow-hidden bg-gray-100`}>
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <div className="p-4">
        <CardHeading variant="accent" size="md" lineClamp={2} className="mb-3 text-black">
          {recipe.title}
        </CardHeading>

        {/* Source Attribution with Avatar */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <span className="text-xs text-black">Spoonacular</span>
        </div>
      </div>
    </Card>
  );
}
