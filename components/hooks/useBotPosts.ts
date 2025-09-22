import { useEffect, useState } from "react";
import { supabaseContentService } from "../services/supabaseContentService";

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
    avatar_url?: string;
    restaurant?: {
      name: string;
      location: string;
      rating: number;
      price_range: string;
      cuisine: string;
      reviews_count: number;
    };
  };
  restaurant?: any;
  post?: BotPost;
}

export function useBotPosts() {
  const [botPosts, setBotPosts] = useState<BotPost[]>([]);
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("🔄 useBotPosts: Hook initialized", {
    loading,
    error,
    feedCardsLength: feedCards.length,
  });

  useEffect(() => {
    console.log("🔄 useBotPosts: useEffect triggered, calling fetchBotPosts");
    fetchBotPosts();
  }, []);

  const fetchBotPosts = async () => {
    try {
      setLoading(true);
      console.log("🔄 useBotPosts: Starting to fetch posts...");

      // Get posts from all Masterbots to ensure diversity
      const allMasterBots = [
        "nomad_aurelia",
        "spice_scholar_anika",
        "sommelier_seb",
        "plant_pioneer_lila",
        "zen_minimalist_jun",
        "coffee_pilgrim_omar",
        "adventure_rafa",
      ];

      // Fetch posts from each Masterbot and mix them
      const postsPerBot = Math.ceil(20 / allMasterBots.length);
      const allPosts = [];

      for (const botUsername of allMasterBots) {
        const botPosts = await supabaseContentService.getPosts({
          botUsername,
          limit: postsPerBot,
          sortBy: "random",
        });
        allPosts.push(...botPosts);
      }

      // Shuffle the mixed posts and take the first 20
      const shuffledPosts = allPosts
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);
      console.log(
        "📊 useBotPosts: Fetched",
        shuffledPosts.length,
        "posts from all Masterbots"
      );

      // Convert to BotPost format for compatibility
      const formattedPosts: BotPost[] = shuffledPosts.map((post) => ({
        id: post.id,
        bot_id: post.master_bot_id,
        user_id: post.master_bot_id,
        restaurant_id: post.restaurant_id,
        title: post.title,
        subtitle: post.content.substring(0, 200) + "...", // Use content as subtitle
        content: post.content,
        hero_url: post.image_url,
        images: post.image_url ? [post.image_url] : [],
        videos: [],
        rating: post.restaurant_rating,
        visit_date: post.created_at,
        dish_names: post.tags || [],
        spent_amount: 0,
        likes_count: post.engagement_likes,
        comments_count: post.engagement_comments,
        shares_count: post.engagement_shares,
        saves_count: 0,
        visibility: "public",
        is_featured: false,
        is_verified: true,
        kind: post.content_type,
        payload: {},
        cta_label: "",
        cta_url: "",
        tags: post.tags || [],
        posted_at: post.created_at,
        created_at: post.created_at,
        updated_at: post.updated_at,
        restaurant_data: {
          name: post.restaurant_name || "Restaurant",
          location: post.restaurant_location || "Location",
          rating: post.restaurant_rating || 4.5,
          price_range: post.restaurant_price_range || "$$$",
          cuisine: post.restaurant_cuisine || "Restaurant",
          reviews_count:
            post.engagement_likes +
            post.engagement_comments +
            post.engagement_shares,
        },
        bot: {
          username: post.bot_username,
          display_name: post.bot_display_name,
          avatar_url: getCorrectAvatarUrl(post.bot_username),
          personality_type: post.personality_trait || "Food Expert",
          specialties: [post.personality_trait || "Food Expert"],
        },
      }));

      setBotPosts(formattedPosts);
      console.log("✅ useBotPosts: Set bot posts", formattedPosts.length);

      // Convert to feed cards
      const cards = formattedPosts.map((post) => convertPostToFeedCard(post));
      setFeedCards(cards);
      console.log("✅ useBotPosts: Set feed cards", cards.length);
    } catch (err) {
      console.error("❌ useBotPosts: Error fetching bot posts:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch bot posts"
      );
    } finally {
      console.log("🏁 useBotPosts: Setting loading to false");
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
    image: post.hero_url || "", // Use hero_url from bot_posts table
    title: restaurant?.name || "Restaurant", // Use restaurant name as title
    subtitle: post.subtitle || "Amazing food experience",
    profileName: post.bot?.display_name || "Master Bot",
    profileDesignation: post.bot?.personality_type || "Food Expert", // Fixed: use flattened data
    tags: post.tags || [],
    isMasterBot: true,
    botData: {
      username: post.bot?.username || "",
      location: restaurant?.location || "Location",
      specialties: post.bot?.specialties || [], // Fixed: use flattened data
      avatar_url: post.bot?.avatar_url || "",
      restaurant: {
        name: restaurant?.name || "Restaurant",
        location: restaurant?.location || "Location",
        rating: restaurant?.rating || 4.5,
        price_range: restaurant?.price_range || "$$$",
        cuisine: restaurant?.cuisine || "Restaurant",
        reviews_count: restaurant?.reviews_count || 0,
      },
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

// Get the correct avatar URL for each Masterbot using local images
function getCorrectAvatarUrl(username: string): string {
  const avatarMap: { [key: string]: string } = {
    nomad_aurelia: "/images/users/Aurelia Voss.png",
    sommelier_seb: "/images/users/Sebastian LeClair.png",
    plant_pioneer_lila: "/images/users/Lila Cheng.png",
    adventure_rafa: "/images/users/Rafael Mendez.png",
    spice_scholar_anika: "/images/users/Anika Kapoor.png",
    coffee_pilgrim_omar: "/images/users/Omar Darzi.png",
    zen_minimalist_jun: "/images/users/Jun Tanaka.png",
  };

  return avatarMap[username] || "/images/users/Aurelia Voss.png";
}
