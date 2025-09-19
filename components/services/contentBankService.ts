export interface Post {
  id: string;
  masterBotId: string;
  title: string;
  content: string;
  imageUrl: string;
  imageLocalPath: string;
  restaurant: {
    id: string;
    name: string;
    location: string;
    rating: number;
    priceRange: string;
    cuisine: string;
  };
  tags: string[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  createdAt: string;
  personality: string;
}

export interface ContentBankData {
  posts: Post[];
  metadata: {
    total_posts: number;
    generated_at: string;
    master_bot: string;
  };
}

export class ContentBankService {
  private static instance: ContentBankService;
  private postsCache: Map<string, Post[]> = new Map();
  private lastLoadTime: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ContentBankService {
    if (!ContentBankService.instance) {
      ContentBankService.instance = new ContentBankService();
    }
    return ContentBankService.instance;
  }

  private async loadPostsForBot(botUsername: string): Promise<Post[]> {
    const now = Date.now();
    const lastLoad = this.lastLoadTime.get(botUsername) || 0;

    // Return cached data if still fresh
    if (
      this.postsCache.has(botUsername) &&
      now - lastLoad < this.CACHE_DURATION
    ) {
      return this.postsCache.get(botUsername)!;
    }

    try {
      const response = await fetch(
        `/masterbot-posts/${botUsername}-posts.json`
      );
      if (!response.ok) {
        throw new Error(`Failed to load posts for ${botUsername}`);
      }

      const data: ContentBankData = await response.json();
      const posts = data.posts || [];

      // Cache the data
      this.postsCache.set(botUsername, posts);
      this.lastLoadTime.set(botUsername, now);

      return posts;
    } catch (error) {
      console.error(`Error loading posts for ${botUsername}:`, error);
      return [];
    }
  }

  public async getPostsForBot(botUsername: string): Promise<Post[]> {
    return this.loadPostsForBot(botUsername);
  }

  public async getRandomPostForBot(botUsername: string): Promise<Post | null> {
    const posts = await this.getPostsForBot(botUsername);
    if (posts.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * posts.length);
    return posts[randomIndex];
  }

  public async getPostsForBotByCount(
    botUsername: string,
    count: number
  ): Promise<Post[]> {
    const posts = await this.getPostsForBot(botUsername);
    return posts.slice(0, count);
  }

  public async getMixedFeed(
    botUsernames: string[],
    count: number = 20
  ): Promise<Post[]> {
    const allPosts: Post[] = [];

    // Load posts from all bots
    for (const botUsername of botUsernames) {
      const posts = await this.getPostsForBot(botUsername);
      allPosts.push(...posts);
    }

    // Shuffle and return requested count
    const shuffled = allPosts.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  public async getPostById(postId: string): Promise<Post | null> {
    // Search through all bots for the post
    const botUsernames = [
      "spice_scholar_anika",
      "sommelier_seb",
      "plant_pioneer_lila",
      "zen_minimalist_jun",
      "coffee_pilgrim_omar",
      "adventure_rafa",
      "nomad_aurelia",
    ];

    for (const botUsername of botUsernames) {
      const posts = await this.getPostsForBot(botUsername);
      const post = posts.find((p) => p.id === postId);
      if (post) return post;
    }

    return null;
  }

  public async getPostsByTag(tag: string, count: number = 20): Promise<Post[]> {
    const allPosts: Post[] = [];
    const botUsernames = [
      "spice_scholar_anika",
      "sommelier_seb",
      "plant_pioneer_lila",
      "zen_minimalist_jun",
      "coffee_pilgrim_omar",
      "adventure_rafa",
      "nomad_aurelia",
    ];

    for (const botUsername of botUsernames) {
      const posts = await this.getPostsForBot(botUsername);
      const filteredPosts = posts.filter((post) =>
        post.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      );
      allPosts.push(...filteredPosts);
    }

    return allPosts.slice(0, count);
  }

  public async getPostsByPersonality(
    personality: string,
    count: number = 20
  ): Promise<Post[]> {
    const allPosts: Post[] = [];
    const botUsernames = [
      "spice_scholar_anika",
      "sommelier_seb",
      "plant_pioneer_lila",
      "zen_minimalist_jun",
      "coffee_pilgrim_omar",
      "adventure_rafa",
      "nomad_aurelia",
    ];

    for (const botUsername of botUsernames) {
      const posts = await this.getPostsForBot(botUsername);
      const filteredPosts = posts.filter((post) =>
        post.personality.toLowerCase().includes(personality.toLowerCase())
      );
      allPosts.push(...filteredPosts);
    }

    return allPosts.slice(0, count);
  }

  public async getTopEngagedPosts(count: number = 20): Promise<Post[]> {
    const allPosts: Post[] = [];
    const botUsernames = [
      "spice_scholar_anika",
      "sommelier_seb",
      "plant_pioneer_lila",
      "zen_minimalist_jun",
      "coffee_pilgrim_omar",
      "adventure_rafa",
      "nomad_aurelia",
    ];

    for (const botUsername of botUsernames) {
      const posts = await this.getPostsForBot(botUsername);
      allPosts.push(...posts);
    }

    // Sort by total engagement (likes + comments + shares)
    const sorted = allPosts.sort((a, b) => {
      const aEngagement =
        a.engagement.likes + a.engagement.comments + a.engagement.shares;
      const bEngagement =
        b.engagement.likes + b.engagement.comments + b.engagement.shares;
      return bEngagement - aEngagement;
    });

    return sorted.slice(0, count);
  }

  public async getRecentPosts(count: number = 20): Promise<Post[]> {
    const allPosts: Post[] = [];
    const botUsernames = [
      "spice_scholar_anika",
      "sommelier_seb",
      "plant_pioneer_lila",
      "zen_minimalist_jun",
      "coffee_pilgrim_omar",
      "adventure_rafa",
      "nomad_aurelia",
    ];

    for (const botUsername of botUsernames) {
      const posts = await this.getPostsForBot(botUsername);
      allPosts.push(...posts);
    }

    // Sort by creation date
    const sorted = allPosts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted.slice(0, count);
  }

  public clearCache(): void {
    this.postsCache.clear();
    this.lastLoadTime.clear();
  }

  public getCacheStats(): { botCount: number; totalPosts: number } {
    let totalPosts = 0;
    for (const posts of this.postsCache.values()) {
      totalPosts += posts.length;
    }

    return {
      botCount: this.postsCache.size,
      totalPosts,
    };
  }
}

export const contentBankService = ContentBankService.getInstance();
