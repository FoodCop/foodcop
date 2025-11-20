import axios from 'axios';
import config from '../config/config';

// Use Supabase Edge Function proxy for YouTube API to keep API key secure
const YOUTUBE_PROXY_URL = `${config.supabase.url}/functions/v1/youtube-proxy`;

export const YouTubeService = {
  async searchVideos(q: string, maxResults = 8) {
    try {
      // Vary the order to get different results each time
      const orders = ['relevance', 'viewCount', 'date'];
      const randomOrder = orders[Math.floor(Math.random() * orders.length)];

      const res = await axios.get(YOUTUBE_PROXY_URL, {
        params: {
          action: 'search',
          q,
          maxResults,
          order: randomOrder,
        },
        headers: {
          'apikey': config.supabase.anonKey,
        },
        timeout: config.api.timeout,
      });

      // The proxy returns { success: true, data: ... } format
      if (res.data.success) {
        return { success: true, data: res.data.data };
      } else {
        return { success: false, error: res.data.error };
      }
    } catch (error) {
      console.error('YouTube searchVideos error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          return { success: false, error: 'YouTube API quota exceeded or invalid API key.' };
        }
        if (error.response?.data?.error) {
          return { success: false, error: error.response.data.error };
        }
      }
      
      return { success: false, error: (error as Error).message };
    }
  },

  async getVideoDetails(videoId: string) {
    try {
      const res = await axios.get(YOUTUBE_PROXY_URL, {
        params: {
          action: 'video-details',
          videoId,
        },
        headers: {
          'apikey': config.supabase.anonKey,
        },
        timeout: config.api.timeout,
      });

      // The proxy returns { success: true, data: ... } format
      if (res.data.success) {
        return { success: true, data: res.data.data };
      } else {
        return { success: false, error: res.data.error };
      }
    } catch (error) {
      console.error('YouTube getVideoDetails error:', error);
      
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return { success: false, error: error.response.data.error };
      }
      
      return { success: false, error: (error as Error).message };
    }
  },
};

export default YouTubeService;