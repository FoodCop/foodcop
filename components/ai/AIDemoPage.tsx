// Temporarily disabled due to TypeScript configuration issues
// import {
//   Bot,
//   CheckCircle,
//   ChefHat,
//   MessageCircle,
//   Settings,
//   Sparkles,
//   XCircle,
// } from "lucide-react";
// import { useState } from "react";
// import { useAIStatus } from "../../hooks/useAI";
// import { useMasterBots } from "../hooks/useMasterBots";
// import { Badge } from "../ui/badge";
// import { Button } from "../ui/button";
// import { Card } from "../ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
// import { AIFoodRecommendations } from "./AIFoodRecommendations";
// import { AIMasterBotCard } from "./AIMasterBotCard";

interface AIDemoPageProps {
  onBack: () => void;
  onStartChat: (botId: string) => void;
}

export function AIDemoPage({ onBack, onStartChat }: AIDemoPageProps) {
  // Temporarily disabled due to TypeScript configuration issues
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-[#0B1F3A] mb-4">
            AI Demo Page
          </h1>
          <p className="text-gray-600 mb-6">
            AI features are temporarily disabled while fixing TypeScript
            configuration.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#d63e2a]"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
