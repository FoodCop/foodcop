import { useEffect, useState } from "react";
import { sbAnon } from "../../src/lib/supabase";

export interface BotPost {
  id: string;
  bot_id: string;
  user_id: string;
  restaurant_id?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  hero_url?: string;
  images?: string[];
  videos?: string[];
  rating?: number;
  visit_date?: string;
  dish_names?: string[];
  spent_amount?: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  visibility: string;
  is_featured: boolean;
  is_verified: boolean;
  kind?: string;
  payload?: any;
  cta_label?: string;
  cta_url?: string;
  tags?: string[];
  posted_at: string;
  created_at: string;
  updated_at: string;

  // Restaurant data (if restaurant_id is present)
  restaurant_data?: any;

  // Joined bot data
  bot?: {
    username: string;
    display_name: string;
    avatar_url?: string;
    personality_type: string;
    specialties: string[];
  };
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
  restaurant?: any;
  post?: BotPost;
}

export function useBotPosts() {
  const [botPosts, setBotPosts] = useState<BotPost[]>([]);
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBotPosts();
  }, []);

  const fetchBotPosts = async () => {
    try {
      setLoading(true);

      // Fetch bot posts from bot_posts table
      const { data: posts, error: postsError } = await sbAnon()
        .from("bot_posts")
        .select(
          `
          *,
          bot:users!bot_id (
            username,
            display_name,
            avatar_url,
            master_bots (
              personality_type,
              specialties
            )
          )
        `
        )
        .eq("is_published", true) // Only published posts
        .order("published_at", { ascending: false })
        .limit(20); // Get latest 20 posts

      if (postsError) {
        throw postsError;
      }

      // Format the posts
      const formattedPosts: BotPost[] =
        posts?.map((post) => ({
          ...post,
          bot: {
            username: post.bot?.username || "",
            display_name: post.bot?.display_name || "",
            personality_type:
              post.bot?.master_bots?.[0]?.personality_type || "",
            specialties: post.bot?.master_bots?.[0]?.specialties || [],
          },
        })) || [];

      setBotPosts(formattedPosts);

      // Convert to feed cards
      const cards = formattedPosts.map((post) => convertPostToFeedCard(post));
      setFeedCards(cards);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch bot posts"
      );
      console.error("Error fetching bot posts:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    botPosts,
    feedCards,
    loading,
    error,
    refetch: fetchBotPosts,
  };
}

function convertPostToFeedCard(post: BotPost): FeedCard {
  const restaurant = post.restaurant_data;

  return {
    id: post.id,
    image: post.image_url || post.hero_url || "", // Use image_url from bot_posts table
    title: post.title || "Food Discovery",
    subtitle: post.subtitle || "",
    profileName: post.bot?.display_name || "Master Bot",
    profileDesignation: post.bot?.personality_type || "Food Explorer",
    tags: post.tags || [],
    isMasterBot: true,
    botData: {
      username: post.bot?.username || "@masterbot",
      location: restaurant
        ? `${restaurant.city || restaurant.name}, ${getCountryName(
            restaurant.countryCode
          )}`
        : "Global",
      specialties: post.bot?.specialties || [],
    },
    restaurant: restaurant,
    post: post,
  };
}

// Convert country code to readable name
function getCountryName(countryCode: string): string {
  const countryMap: { [key: string]: string } = {
    US: "USA",
    GB: "UK",
    FR: "France",
    DE: "Germany",
    IT: "Italy",
    ES: "Spain",
    JP: "Japan",
    CN: "China",
    IN: "India",
    TH: "Thailand",
    VN: "Vietnam",
    KR: "South Korea",
    AU: "Australia",
    CA: "Canada",
    BR: "Brazil",
    MX: "Mexico",
    AR: "Argentina",
    NL: "Netherlands",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    CH: "Switzerland",
    AT: "Austria",
    BE: "Belgium",
    PT: "Portugal",
    GR: "Greece",
    TR: "Turkey",
    MA: "Morocco",
    EG: "Egypt",
    ZA: "South Africa",
    NZ: "New Zealand",
    SG: "Singapore",
    MY: "Malaysia",
    HK: "Hong Kong",
  };

  return countryMap[countryCode] || countryCode;
}
