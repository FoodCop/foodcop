// Temporarily disabled due to TypeScript configuration issues
// import { ChefHat, Clock, Loader2, Sparkles, Star } from "lucide-react";
// import React, { useState } from "react";
// import { useFoodRecommendations } from "../../hooks/useAI";
// import { Badge } from "../ui/badge";
// import { Button } from "../ui/button";
// import { Card } from "../ui/card";
// import { Input } from "../ui/input";

interface AIFoodRecommendationsProps {
  onRecommendationSelect?: (recommendation: any) => void;
}

export function AIFoodRecommendations({
  onRecommendationSelect,
}: AIFoodRecommendationsProps) {
  // Temporarily disabled due to TypeScript configuration issues
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#0B1F3A] mb-4">
          AI Food Recommendations
        </h2>
        <p className="text-gray-600 mb-6">
          AI food recommendation features are temporarily disabled while fixing
          TypeScript configuration.
        </p>
      </div>
    </div>
  );
}
