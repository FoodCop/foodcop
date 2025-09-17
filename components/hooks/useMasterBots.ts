import { useEffect, useState } from "react";
import { sbAnon } from "../../src/lib/supabase";

export interface DatabaseMasterBot {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  location_city: string;
  location_country: string;
  total_points: number;
  followers_count: number;
  following_count: number;
  is_master_bot: boolean;
  created_at: string;

  // From master_bots table
  bot_name?: string;
  personality_type?: string;
  specialties?: string[];
  system_prompt?: string;
  is_active?: boolean;
}

export interface FeedCard {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  profileName: string;
  profileDesignation: string;
  tags: string[];
  isMasterBot: boolean;
  botData: {
    username: string;
    location?: string;
    specialties?: string[];
  };
}

export function useMasterBots() {
  const [masterBots, setMasterBots] = useState<DatabaseMasterBot[]>([]);
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMasterBots();
  }, []);

  const fetchMasterBots = async () => {
    try {
      setLoading(true);

      // Fetch Master Bot users with their configurations
      const { data: users, error: usersError } = await sbAnon()
        .from("users")
        .select(
          `
          *,
          master_bots (
            bot_name,
            personality_type,
            specialties,
            system_prompt,
            is_active
          )
        `
        )
        .eq("is_master_bot", true)
        .eq("master_bots.is_active", true)
        .order("total_points", { ascending: false });

      if (usersError) {
        throw usersError;
      }

      const formattedBots: DatabaseMasterBot[] =
        users?.map((user) => ({
          ...user,
          bot_name: user.master_bots?.[0]?.bot_name,
          personality_type: user.master_bots?.[0]?.personality_type,
          specialties: user.master_bots?.[0]?.specialties || [],
          system_prompt: user.master_bots?.[0]?.system_prompt,
          is_active: user.master_bots?.[0]?.is_active,
        })) || [];

      setMasterBots(formattedBots);

      // Convert to simple feed cards for compatibility
      const fallbackCards = formattedBots.map((bot) =>
        convertBotToFeedCard(bot)
      );
      setFeedCards(fallbackCards);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch Master Bots"
      );
      console.error("Error fetching Master Bots:", err);
    } finally {
      setLoading(false);
    }
  };

  return { masterBots, feedCards, loading, error, refetch: fetchMasterBots };
}

// Convert database Master Bot to feed card format
function convertBotToFeedCard(bot: DatabaseMasterBot): FeedCard {
  // Generate sample content based on bot personality
  const sampleContent = generateSampleContent(bot);

  return {
    id: bot.id,
    image: bot.avatar_url || getDefaultAvatar(bot.personality_type),
    title: sampleContent.title,
    subtitle: sampleContent.subtitle,
    profileName: bot.display_name,
    profileDesignation: bot.personality_type || "Food Explorer",
    tags: bot.specialties?.slice(0, 4) || ["food", "discovery"],
    isMasterBot: true,
    botData: {
      username: bot.username,
      location: `${bot.location_city}, ${bot.location_country}`,
      specialties: bot.specialties || [],
    },
  };
}

// Generate sample content based on bot personality
function generateSampleContent(bot: DatabaseMasterBot) {
  const contentTemplates = {
    "Street Food Explorer": {
      title: "Hidden Street Food Gem",
      subtitle: `${bot.display_name} discovers authentic flavors in bustling markets and local food stalls.`,
    },
    "Fine Dining Expert": {
      title: "Exquisite Culinary Experience",
      subtitle: `${bot.display_name} reviews exceptional dining with perfect wine pairings and refined technique.`,
    },
    "Vegan Specialist": {
      title: "Plant-Based Innovation",
      subtitle: `${bot.display_name} explores creative vegan cuisine that challenges traditional cooking methods.`,
    },
    "Adventure Foodie": {
      title: "Epic Food Adventure",
      subtitle: `${bot.display_name} finds amazing dishes in the most adventurous and scenic locations.`,
    },
    "Indian/Asian Cuisine Expert": {
      title: "Spice Master Discovery",
      subtitle: `${bot.display_name} shares knowledge of traditional spice combinations and authentic recipes.`,
    },
    "Coffee Culture Expert": {
      title: "Coffee Culture Journey",
      subtitle: `${bot.display_name} documents the ritual and craft behind exceptional coffee experiences.`,
    },
    "Japanese Cuisine Master": {
      title: "Zen Culinary Art",
      subtitle: `${bot.display_name} appreciates the minimalist beauty and traditional craft of Japanese cuisine.`,
    },
  };

  const template =
    contentTemplates[bot.personality_type as keyof typeof contentTemplates];
  return (
    template || {
      title: "Culinary Discovery",
      subtitle: `${bot.display_name} shares their latest food discovery and culinary insights.`,
    }
  );
}

function getDefaultAvatar(personalityType?: string): string {
  const avatarMap = {
    "Street Food Explorer":
      "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400",
    "Fine Dining Expert":
      "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400",
    "Vegan Specialist":
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    "Adventure Foodie":
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400",
    "Indian/Asian Cuisine Expert":
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
    "Coffee Culture Expert":
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    "Japanese Cuisine Master":
      "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400",
  };

  return (
    avatarMap[personalityType as keyof typeof avatarMap] ||
    "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400"
  );
}
