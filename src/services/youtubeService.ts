import axios from 'axios';

const cleanEnv = (value: string | undefined) => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  const withoutLeading = (trimmed.startsWith('"') || trimmed.startsWith("'")) ? trimmed.slice(1) : trimmed;
  return (withoutLeading.endsWith('"') || withoutLeading.endsWith("'")) ? withoutLeading.slice(0, -1) : withoutLeading;
};

const SUPABASE_URL = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
const YOUTUBE_PROXY_URL = `${SUPABASE_URL}/functions/v1/youtube-proxy`;

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
    };
  };
}

export const YouTubeService = {
  async searchVideos(query: string, maxResults = 12): Promise<ServiceResult<{ items: YouTubeSearchItem[] }>> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        success: false,
        error: 'Supabase env vars missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
      };
    }

    try {
      const response = await axios.get(YOUTUBE_PROXY_URL, {
        params: {
          action: 'search',
          q: query,
          maxResults,
          order: 'relevance',
        },
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        timeout: 10000,
      });

      if (!response.data?.success) {
        return { success: false, error: response.data?.error || 'YouTube proxy request failed' };
      }

      return { success: true, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },
};

export default YouTubeService;
