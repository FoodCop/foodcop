import axios from 'axios';
import config from '../config/config';

export const YouTubeService = {
  async searchVideos(q: string, maxResults = 8) {
    try {
      // Check if API key is available
      if (!config.youtube.apiKey) {
        console.warn('YouTube API key not found. Please set VITE_YOUTUBE_API_KEY in your environment variables.');
        return { 
          success: false, 
          error: 'API key not configured. Please check your environment variables.' 
        };
      }

      // Vary the order to get different results each time
      const orders = ['relevance', 'viewCount', 'date'];
      const randomOrder = orders[Math.floor(Math.random() * orders.length)];

      const res = await axios.get(`${config.youtube.baseUrl}${config.youtube.endpoints.search}`, {
        params: {
          q,
          key: config.youtube.apiKey,
          part: 'snippet',
          maxResults,
          type: 'video',
          videoDuration: 'short', // Focus on short videos for Trims
          order: randomOrder, // Randomize sort order for variety
          relevanceLanguage: 'en', // English content
        },
        timeout: config.api.timeout,
      });

      return { success: true, data: res.data };
    } catch (error) {
      console.error('YouTube searchVideos error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          return { success: false, error: 'YouTube API quota exceeded or invalid API key.' };
        }
      }
      
      return { success: false, error: (error as Error).message };
    }
  },

  async getVideoDetails(videoId: string) {
    try {
      const res = await axios.get(`${config.youtube.baseUrl}${config.youtube.endpoints.videos}`, {
        params: {
          key: config.youtube.apiKey,
          id: videoId,
          part: 'snippet,statistics',
        },
        timeout: config.api.timeout,
      });
      return { success: true, data: res.data };
    } catch (error) {
      console.error('YouTube getVideoDetails error:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default YouTubeService;