import { motion } from "framer-motion";
import { Bot, MessageCircle, Sparkles, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllPersonalities } from "../constants/masterBotPersonalities";
import { useMasterBots } from "../hooks/useMasterBots";
import { MasterBot } from "../services/masterBotService";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
// import { MasterBotChatSystem } from '../debug/MasterBotChatSystem'; // Moved to debug folder

// Simple placeholder for MasterBotChatSystem
const MasterBotChatSystem = ({
  botId,
  onClose,
}: {
  botId: string;
  onClose?: () => void;
}) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-lg font-semibold">Bot Chat - {botId}</h2>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        ✕
      </button>
    </div>
    <div className="flex-1 p-4">
      <p className="text-gray-500">
        Chat interface temporarily disabled. Component moved to debug folder.
      </p>
    </div>
  </div>
);

interface MasterBotIntegrationProps {
  onBotSelect?: (botId: string) => void;
  showChatInterface?: boolean;
  currentBotId?: string;
  onCloseBotChat?: () => void;
}

export function MasterBotIntegration({
  onBotSelect,
  showChatInterface,
  currentBotId,
  onCloseBotChat,
}: MasterBotIntegrationProps) {
  const [featuredBots, setFeaturedBots] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const { masterBots: bots, loading: botsLoading } = useMasterBots();
  const personalities = getAllPersonalities();

  useEffect(() => {
    // Rotate featured bots periodically
    const rotateFeaturedBots = () => {
      const shuffled = [...bots].sort(() => 0.5 - Math.random());
      setFeaturedBots(shuffled.slice(0, 3).map((bot) => bot.id));
    };

    rotateFeaturedBots();
    const interval = setInterval(rotateFeaturedBots, 30000); // Rotate every 30 seconds

    return () => clearInterval(interval);
  }, [bots]);

  const handleBotSelect = (botId: string) => {
    if (onBotSelect) {
      onBotSelect(botId);
    }
  };

  if (showChatInterface && currentBotId) {
    return (
      <MasterBotChatSystem botId={currentBotId} onClose={onCloseBotChat} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-[#F14C35] to-[#A6471E] rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#0B1F3A]">Master Bot League</h3>
            <p className="text-sm text-gray-600">Chat with food experts</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#F14C35]"
        >
          {isExpanded ? "Less" : "All Bots"}
        </Button>
      </div>

      {/* Featured Bots */}
      <div className="grid grid-cols-1 gap-3">
        {(isExpanded
          ? bots
          : bots.filter((bot) => featuredBots.includes(bot.id))
        ).map((bot) => {
          const personality = personalities.find((p) => p.id === bot.id);

          return (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#F14C35]">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <img
                        src={bot.avatar_url || "/images/default-avatar.png"}
                        alt={bot.display_name}
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-[#0B1F3A] truncate">
                        {bot.display_name}
                      </h4>
                      <div className="flex items-center text-[#FFD74A]">
                        <Star className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">
                          {bot.total_points}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 truncate">
                      {getBotSpecialty(bot)}
                    </p>

                    {personality && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {personality.conversationStyle.tone.split(",")[0]}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        <span>{bot.followers_count.toLocaleString()}</span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleBotSelect(bot.id)}
                        className="bg-[#F14C35] hover:bg-[#E03A28] text-white text-xs px-3 py-1 h-auto"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Personality Preview */}
                {personality && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {personality.personalityTraits
                        .slice(0, 3)
                        .map((trait) => (
                          <Badge
                            key={trait}
                            variant="outline"
                            className="text-xs"
                          >
                            {trait}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-4 bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 border-[#F14C35]/20">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#F14C35]" />
          <h4 className="font-medium text-[#0B1F3A]">Quick Start</h4>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBotSelect("aurelia-voss")}
            className="justify-start text-left"
          >
            🌍 Ask Aurelia about street food gems
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBotSelect("sebastian-leclair")}
            className="justify-start text-left"
          >
            🍷 Get wine pairing advice from Sebastian
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBotSelect("lila-cheng")}
            className="justify-start text-left"
          >
            🌱 Discover plant-based options with Lila
          </Button>
        </div>
      </Card>

      {/* Bot Stats */}
      <Card className="p-4">
        <h4 className="font-medium text-[#0B1F3A] mb-3">League Stats</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-[#F14C35]">
              {bots.length}
            </div>
            <div className="text-xs text-gray-600">Active Bots</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[#A6471E]">
              {bots
                .reduce((sum, bot) => sum + (bot.total_points || 0), 0)
                .toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total Points</div>
          </div>
          <div>
            <div className="text-lg font-bold text-[#FFD74A]">
              {bots
                .reduce((sum, bot) => sum + bot.followers_count, 0)
                .toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Followers</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Get bot specialty based on username or display name
function getBotSpecialty(bot: MasterBot): string {
  const username = bot.username.toLowerCase();
  const displayName = bot.display_name.toLowerCase();

  if (username.includes("nomad") || username.includes("aurelia")) {
    return "Street Food Explorer";
  } else if (username.includes("sommelier") || username.includes("sebastian")) {
    return "Fine Dining Expert";
  } else if (username.includes("plant") || username.includes("lila")) {
    return "Vegan Specialist";
  } else if (username.includes("adventure") || username.includes("rafa")) {
    return "Adventure Foodie";
  } else if (username.includes("spice") || username.includes("anika")) {
    return "Indian/Asian Cuisine Expert";
  } else if (username.includes("coffee") || username.includes("omar")) {
    return "Coffee Culture Expert";
  } else if (username.includes("zen") || username.includes("jun")) {
    return "Japanese Cuisine Master";
  }

  return "Food Expert";
}

// Hook for managing master bot interactions
export function useMasterBotChat() {
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [showBotChat, setShowBotChat] = useState(false);

  const startBotChat = (botId: string) => {
    setActiveBotId(botId);
    setShowBotChat(true);
  };

  const closeBotChat = () => {
    setShowBotChat(false);
    setActiveBotId(null);
  };

  const switchBot = (botId: string) => {
    setActiveBotId(botId);
  };

  return {
    activeBotId,
    showBotChat,
    startBotChat,
    closeBotChat,
    switchBot,
  };
}
