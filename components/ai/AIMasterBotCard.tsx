import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { useMasterBotAI } from "../../hooks/useAI";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface AIMasterBotCardProps {
  bot: {
    id: string;
    display_name: string;
    bio: string;
    avatar_url?: string;
    username: string;
  };
  onStartChat: (botId: string) => void;
}

export function AIMasterBotCard({ bot, onStartChat }: AIMasterBotCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPost, setAiPost] = useState<string | null>(null);
  const { generatePost, isLoading } = useMasterBotAI();

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    try {
      const post = await generatePost(
        bot.bio || "Food Expert",
        "latest food discovery",
        "Global"
      );
      setAiPost(post);
    } catch (error) {
      console.error("Failed to generate AI post:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getBotSpecialty = (bio: string) => {
    if (bio.toLowerCase().includes("street")) return "Street Food Explorer";
    if (bio.toLowerCase().includes("fine")) return "Fine Dining Expert";
    if (bio.toLowerCase().includes("vegan")) return "Vegan Specialist";
    if (bio.toLowerCase().includes("adventure")) return "Adventure Foodie";
    if (bio.toLowerCase().includes("spice")) return "Spice Master";
    if (bio.toLowerCase().includes("coffee")) return "Coffee Culture Expert";
    if (bio.toLowerCase().includes("zen")) return "Japanese Cuisine Master";
    return "Food Expert";
  };

  const specialty = getBotSpecialty(bot.bio || "");

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <Avatar className="w-16 h-16">
          <img
            src={bot.avatar_url || ""}
            alt={bot.display_name}
            className="w-full h-full object-cover"
          />
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-[#0B1F3A] truncate">
              {bot.display_name}
            </h3>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>

          <p className="text-sm text-gray-600 mb-2">@{bot.username}</p>

          <p className="text-sm text-gray-700 mb-4">
            {bot.bio ||
              "AI-powered food expert ready to help you discover amazing culinary experiences."}
          </p>

          {/* AI-Generated Post Preview */}
          {aiPost && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">
                  AI-Generated Post
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{aiPost}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleGeneratePost}
              disabled={isLoading || isGenerating}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              {isLoading || isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Generate Post</span>
            </Button>

            <Button
              onClick={() => onStartChat(bot.id)}
              className="bg-[#F14C35] hover:bg-[#d63e2a] flex items-center space-x-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Start Chat</span>
            </Button>
          </div>

          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI Enhanced</span>
            </span>
            <span>{specialty}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
