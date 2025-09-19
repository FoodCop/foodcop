import { useCallback, useEffect, useState } from "react";
import { contentBankService, Post } from "../services/contentBankService";

export interface UseContentBankOptions {
  botUsername?: string;
  count?: number;
  tag?: string;
  personality?: string;
  sortBy?: "recent" | "engagement" | "random";
}

export function useContentBank(options: UseContentBankOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let fetchedPosts: Post[] = [];

      if (options.botUsername) {
        if (options.count) {
          fetchedPosts = await contentBankService.getPostsForBotByCount(
            options.botUsername,
            options.count
          );
        } else {
          fetchedPosts = await contentBankService.getPostsForBot(
            options.botUsername
          );
        }
      } else if (options.tag) {
        fetchedPosts = await contentBankService.getPostsByTag(
          options.tag,
          options.count || 20
        );
      } else if (options.personality) {
        fetchedPosts = await contentBankService.getPostsByPersonality(
          options.personality,
          options.count || 20
        );
      } else {
        // Get mixed feed from all bots
        const botUsernames = [
          "spice_scholar_anika",
          "sommelier_seb",
          "plant_pioneer_lila",
          "zen_minimalist_jun",
          "coffee_pilgrim_omar",
          "adventure_rafa",
          "nomad_aurelia",
        ];
        fetchedPosts = await contentBankService.getMixedFeed(
          botUsernames,
          options.count || 20
        );
      }

      // Apply sorting
      if (options.sortBy === "recent") {
        fetchedPosts = fetchedPosts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (options.sortBy === "engagement") {
        fetchedPosts = fetchedPosts.sort((a, b) => {
          const aEngagement =
            a.engagement.likes + a.engagement.comments + a.engagement.shares;
          const bEngagement =
            b.engagement.likes + b.engagement.comments + b.engagement.shares;
          return bEngagement - aEngagement;
        });
      } else if (options.sortBy === "random") {
        fetchedPosts = fetchedPosts.sort(() => Math.random() - 0.5);
      }

      setPosts(fetchedPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [
    options.botUsername,
    options.count,
    options.tag,
    options.personality,
    options.sortBy,
  ]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const refresh = useCallback(() => {
    loadPosts();
  }, [loadPosts]);

  const getRandomPost = useCallback(async (): Promise<Post | null> => {
    if (options.botUsername) {
      return await contentBankService.getRandomPostForBot(options.botUsername);
    }
    return null;
  }, [options.botUsername]);

  const getPostById = useCallback(
    async (postId: string): Promise<Post | null> => {
      return await contentBankService.getPostById(postId);
    },
    []
  );

  return {
    posts,
    loading,
    error,
    refresh,
    getRandomPost,
    getPostById,
  };
}

export function useRandomPost(botUsername?: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRandomPost = useCallback(async () => {
    if (!botUsername) return;

    setLoading(true);
    setError(null);

    try {
      const randomPost = await contentBankService.getRandomPostForBot(
        botUsername
      );
      setPost(randomPost);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load random post"
      );
    } finally {
      setLoading(false);
    }
  }, [botUsername]);

  useEffect(() => {
    loadRandomPost();
  }, [loadRandomPost]);

  return {
    post,
    loading,
    error,
    refresh: loadRandomPost,
  };
}

export function useTopEngagedPosts(count: number = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const topPosts = await contentBankService.getTopEngagedPosts(count);
      setPosts(topPosts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load top posts");
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    loadTopPosts();
  }, [loadTopPosts]);

  return {
    posts,
    loading,
    error,
    refresh: loadTopPosts,
  };
}

export function useRecentPosts(count: number = 20) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecentPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const recentPosts = await contentBankService.getRecentPosts(count);
      setPosts(recentPosts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recent posts"
      );
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    loadRecentPosts();
  }, [loadRecentPosts]);

  return {
    posts,
    loading,
    error,
    refresh: loadRecentPosts,
  };
}
