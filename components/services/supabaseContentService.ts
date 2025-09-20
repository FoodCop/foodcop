import { getSupabaseClient } from "../../utils/supabase";

export interface Post {
  id: string;
  master_bot_id: string;
  bot_username: string;
  bot_display_name: string;
  bot_avatar_url: string;
  title: string;
  content: string;
  image_url: string | null;
  restaurant_name: string;
  restaurant_location: string;
  restaurant_rating: number;
  restaurant_price_range: string;
  restaurant_cuisine: string;
  tags: string[];
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  total_engagement: number;
  personality_trait: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

export interface PostFilters {
  botUsername?: string;
  contentType?: string;
  personalityTrait?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: "recent" | "engagement" | "random";
}

export class SupabaseContentService {
  private static instance: SupabaseContentService;
  private supabase;

  private constructor() {
    this.supabase = getSupabaseClient()!;
  }

  public static getInstance(): SupabaseContentService {
    if (!SupabaseContentService.instance) {
      SupabaseContentService.instance = new SupabaseContentService();
    }
    return SupabaseContentService.instance;
  }

  // Get posts with filters
  async getPosts(filters: PostFilters = {}): Promise<Post[]> {
    let query = this.supabase.from("public_master_bot_posts").select("*");

    // Apply filters
    if (filters.botUsername) {
      query = query.eq("bot_username", filters.botUsername);
    }

    if (filters.contentType) {
      query = query.eq("content_type", filters.contentType);
    }

    if (filters.personalityTrait) {
      query = query.eq("personality_trait", filters.personalityTrait);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags);
    }

    // Apply sorting
    if (filters.sortBy === "recent") {
      query = query.order("created_at", { ascending: false });
    } else if (filters.sortBy === "engagement") {
      query = query.order("total_engagement", { ascending: false });
    } else if (filters.sortBy === "random") {
      // For random, we'll get all and shuffle in memory
      // This is not ideal for large datasets, but works for our use case
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }

    let posts = data || [];

    // Apply random sorting if needed
    if (filters.sortBy === "random") {
      posts = posts.sort(() => Math.random() - 0.5);
    }

    return posts;
  }

  // Get posts for a specific bot
  async getPostsForBot(botUsername: string, limit?: number): Promise<Post[]> {
    return this.getPosts({
      botUsername,
      limit,
      sortBy: "recent",
    });
  }

  // Get random post for a bot
  async getRandomPostForBot(botUsername: string): Promise<Post | null> {
    const posts = await this.getPosts({
      botUsername,
      limit: 1,
      sortBy: "random",
    });

    return posts[0] || null;
  }

  // Get mixed feed from multiple bots
  async getMixedFeed(
    botUsernames: string[],
    limit: number = 20
  ): Promise<Post[]> {
    const allPosts: Post[] = [];

    // Get posts from each bot
    for (const botUsername of botUsernames) {
      const posts = await this.getPostsForBot(
        botUsername,
        Math.ceil(limit / botUsernames.length)
      );
      allPosts.push(...posts);
    }

    // Shuffle and return requested count
    const shuffled = allPosts.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  // Get post by ID
  async getPostById(postId: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from("public_master_bot_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error) {
      console.error("Error fetching post by ID:", error);
      return null;
    }

    return data;
  }

  // Get posts by tag
  async getPostsByTag(tag: string, limit: number = 20): Promise<Post[]> {
    return this.getPosts({
      tags: [tag],
      limit,
      sortBy: "recent",
    });
  }

  // Get posts by personality trait
  async getPostsByPersonality(
    trait: string,
    limit: number = 20
  ): Promise<Post[]> {
    return this.getPosts({
      personalityTrait: trait,
      limit,
      sortBy: "recent",
    });
  }

  // Get top engaged posts
  async getTopEngagedPosts(limit: number = 20): Promise<Post[]> {
    return this.getPosts({
      limit,
      sortBy: "engagement",
    });
  }

  // Get recent posts
  async getRecentPosts(limit: number = 20): Promise<Post[]> {
    return this.getPosts({
      limit,
      sortBy: "recent",
    });
  }

  // Get posts by content type
  async getPostsByContentType(
    contentType: string,
    limit: number = 20
  ): Promise<Post[]> {
    return this.getPosts({
      contentType,
      limit,
      sortBy: "recent",
    });
  }

  // Get posts by restaurant
  async getPostsByRestaurant(
    restaurantName: string,
    limit: number = 20
  ): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from("public_master_bot_posts")
      .select("*")
      .ilike("restaurant_name", `%${restaurantName}%`)
      .limit(limit)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts by restaurant:", error);
      return [];
    }

    return data || [];
  }

  // Search posts
  async searchPosts(searchTerm: string, limit: number = 20): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from("public_master_bot_posts")
      .select("*")
      .or(
        `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,restaurant_name.ilike.%${searchTerm}%`
      )
      .limit(limit)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching posts:", error);
      return [];
    }

    return data || [];
  }

  // Get statistics
  async getStatistics(): Promise<{
    totalPosts: number;
    postsByBot: Record<string, number>;
    postsByType: Record<string, number>;
    postsByTrait: Record<string, number>;
  }> {
    const { data, error } = await this.supabase
      .from("public_master_bot_posts")
      .select("bot_username, content_type, personality_trait");

    if (error) {
      console.error("Error fetching statistics:", error);
      return {
        totalPosts: 0,
        postsByBot: {},
        postsByType: {},
        postsByTrait: {},
      };
    }

    const posts = data || [];
    const stats = {
      totalPosts: posts.length,
      postsByBot: {} as Record<string, number>,
      postsByType: {} as Record<string, number>,
      postsByTrait: {} as Record<string, number>,
    };

    posts.forEach((post) => {
      stats.postsByBot[post.bot_username] =
        (stats.postsByBot[post.bot_username] || 0) + 1;
      stats.postsByType[post.content_type] =
        (stats.postsByType[post.content_type] || 0) + 1;
      stats.postsByTrait[post.personality_trait] =
        (stats.postsByTrait[post.personality_trait] || 0) + 1;
    });

    return stats;
  }

  // Update post engagement (for likes, comments, shares)
  async updatePostEngagement(
    postId: string,
    updates: {
      likes?: number;
      comments?: number;
      shares?: number;
    }
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("master_bot_posts")
      .update({
        engagement_likes: updates.likes,
        engagement_comments: updates.comments,
        engagement_shares: updates.shares,
      })
      .eq("id", postId);

    if (error) {
      console.error("Error updating post engagement:", error);
      return false;
    }

    return true;
  }

  // Increment engagement counters
  async incrementEngagement(
    postId: string,
    type: "likes" | "comments" | "shares"
  ): Promise<boolean> {
    const { error } = await this.supabase.rpc("increment_engagement", {
      post_id: postId,
      engagement_type: type,
    });

    if (error) {
      console.error("Error incrementing engagement:", error);
      return false;
    }

    return true;
  }
}

export const supabaseContentService = SupabaseContentService.getInstance();
