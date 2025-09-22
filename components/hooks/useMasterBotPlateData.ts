import { useEffect, useState } from "react";
import { supabaseContentService } from "../services/supabaseContentService";

export interface MasterBotPlateData {
  savedPlaces: any[];
  savedRecipes: any[];
  photos: any[];
  videos: any[];
  posts: any[];
  crew: any[];
}

export function useMasterBotPlateData(masterBotId: string | null) {
  const [plateData, setPlateData] = useState<MasterBotPlateData>({
    savedPlaces: [],
    savedRecipes: [],
    photos: [],
    videos: [],
    posts: [],
    crew: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!masterBotId) {
      setPlateData({
        savedPlaces: [],
        savedRecipes: [],
        photos: [],
        videos: [],
        posts: [],
        crew: [],
      });
      return;
    }

    fetchMasterBotPlateData();
  }, [masterBotId]);

  const fetchMasterBotPlateData = async () => {
    if (!masterBotId) return;

    try {
      setLoading(true);
      setError(null);

      // Map masterBotId to database username
      const usernameMap: { [key: string]: string } = {
        "aurelia-voss": "nomad_aurelia",
        "sebastian-leclair": "sommelier_seb",
        "lila-cheng": "plant_pioneer_lila",
        "rafael-mendez": "adventure_rafa",
        "anika-kapoor": "spice_scholar_anika",
        "omar-darzi": "coffee_pilgrim_omar",
        "jun-tanaka": "zen_minimalist_jun",
      };

      const botUsername = usernameMap[masterBotId];
      if (!botUsername) {
        throw new Error(`Unknown Masterbot ID: ${masterBotId}`);
      }

      // Fetch all posts for this Masterbot
      const posts = await supabaseContentService.getPosts({
        botUsername,
        limit: 70, // All 70 posts
        sortBy: "recent",
      });

      console.log(
        `🔍 Fetched ${posts.length} posts for ${botUsername}:`,
        posts.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.title,
          restaurant_name: p.restaurant_name,
          content_type: p.content_type,
        }))
      );

      // Convert all 70 posts to places format for the Places tab
      // Each post should be unique, so we'll use post-specific data
      const savedPlaces = posts.map((post, index) => ({
        id: post.id,
        // Use post title as the main name, with restaurant name as subtitle if available
        name: post.title || `Food Discovery #${index + 1}`,
        // Add restaurant name as part of the description if available
        restaurant_name: post.restaurant_name,
        location: post.restaurant_location || "Various Locations",
        rating: post.restaurant_rating || 4.5,
        price_range: post.restaurant_price_range || "$$",
        cuisine: post.restaurant_cuisine || "International",
        image: post.image_url,
        description: post.content.substring(0, 200) + "...",
        saved_at: post.created_at,
        tags: post.tags || [],
        // Additional post data for display
        title: post.title,
        content: post.content,
        content_type: post.content_type,
        personality_trait: post.personality_trait,
        // Add unique identifier to prevent duplicates
        post_id: post.id,
        post_index: index,
      }));

      // Keep other categories empty for now
      const savedRecipes: any[] = [];
      const photos: any[] = [];

      const videos: any[] = []; // Masterbots don't have videos yet

      const crew: any[] = []; // Masterbots don't have crew yet

      console.log(
        `🔍 Converted ${savedPlaces.length} places for ${botUsername}:`,
        savedPlaces.slice(0, 3).map((p) => ({
          id: p.id,
          name: p.name,
          restaurant_name: p.restaurant_name,
          post_index: p.post_index,
        }))
      );

      setPlateData({
        savedPlaces,
        savedRecipes,
        photos,
        videos,
        posts,
        crew,
      });
    } catch (err) {
      console.error("Error fetching Masterbot plate data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch plate data"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    plateData,
    loading,
    error,
    refetch: fetchMasterBotPlateData,
  };
}
