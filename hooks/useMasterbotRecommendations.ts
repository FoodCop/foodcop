import { useEffect, useState } from "react";
import { MasterbotPost } from "../components/dashboard/MasterbotPostCard";
import { supabaseContentService } from "../components/services/supabaseContentService";

interface UseMasterbotRecommendationsReturn {
  posts: MasterbotPost[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMasterbotRecommendations(): UseMasterbotRecommendationsReturn {
  const [posts, setPosts] = useState<MasterbotPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // All seven Masterbots
      const masterBots = [
        "nomad_aurelia",
        "spice_scholar_anika",
        "sommelier_seb",
        "plant_pioneer_lila",
        "zen_minimalist_jun",
        "coffee_pilgrim_omar",
        "adventure_rafa",
      ];

      // Fetch one random post from each Masterbot
      const allPosts: MasterbotPost[] = [];

      for (const botUsername of masterBots) {
        try {
          const botPosts = await supabaseContentService.getPosts({
            botUsername,
            limit: 10, // Get 10 posts to have options for random selection
            sortBy: "random",
          });

          if (botPosts.length > 0) {
            // Pick a random post from this bot's posts
            const randomPost =
              botPosts[Math.floor(Math.random() * botPosts.length)];

            // Convert to MasterbotPost format
            const masterbotPost: MasterbotPost = {
              id: randomPost.id,
              type: randomPost.content_type as
                | "restaurant"
                | "recipe"
                | "story",
              title: randomPost.title || "Untitled",
              content: randomPost.content || "",
              image: randomPost.image_url || "/images/placeholder-food.jpg",
              location: randomPost.location,
              cuisine: randomPost.cuisine,
              rating: randomPost.rating,
              tags: randomPost.tags || [],
              timestamp: randomPost.created_at,
              likes: randomPost.likes_count || 0,
              comments: randomPost.comments_count || 0,
              voice: randomPost.personality_trait || "friendly",
              bot_username: randomPost.bot_username,
              bot_name: getBotDisplayName(randomPost.bot_username),
              bot_avatar: getBotAvatar(randomPost.bot_username),
              restaurant_name: randomPost.restaurant_name,
              price_range: randomPost.price_range,
              delivery_time: randomPost.delivery_time,
            };

            allPosts.push(masterbotPost);
          }
        } catch (botError) {
          console.warn(`Failed to fetch posts for ${botUsername}:`, botError);
          // Continue with other bots even if one fails
        }
      }

      // Shuffle the posts to randomize the order
      const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);

      setPosts(shuffledPosts);
      console.log(
        `✅ Fetched ${shuffledPosts.length} Masterbot recommendations`
      );
    } catch (err) {
      console.error("❌ Error fetching Masterbot recommendations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch recommendations"
      );
    } finally {
      setLoading(false);
    }
  };

  const getBotDisplayName = (username: string): string => {
    const nameMap: { [key: string]: string } = {
      nomad_aurelia: "Aurelia Voss",
      spice_scholar_anika: "Anika Kapoor",
      sommelier_seb: "Sebastian Leclair",
      plant_pioneer_lila: "Lila Cheng",
      zen_minimalist_jun: "Jun Tanaka",
      coffee_pilgrim_omar: "Omar Darzi",
      adventure_rafa: "Rafael Mendez",
    };
    return nameMap[username] || username;
  };

  const getBotAvatar = (username: string): string => {
    const avatarMap: { [key: string]: string } = {
      nomad_aurelia:
        "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=100&h=100&fit=crop&crop=face",
      spice_scholar_anika:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      sommelier_seb:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      plant_pioneer_lila:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      zen_minimalist_jun:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      coffee_pilgrim_omar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      adventure_rafa:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    };
    return avatarMap[username] || "/images/placeholder-avatar.jpg";
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return {
    posts,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}
