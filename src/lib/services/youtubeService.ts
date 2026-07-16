/**
 * ============================================================================
 * YOUTUBE SERVICE — Video Discovery & Channel Integration
 * ============================================================================
 *
 * Provides a typed interface to the YouTube Data API v3, routed through
 * /api/youtube/[action] - a server-side Next.js Route Handler using
 * YOUTUBE_API_KEY (same pattern as /api/gemini and /api/places), not a
 * Supabase Edge Function. The youtube-proxy Edge Function this used to call
 * was never deployed to this project (confirmed: 503s), so it's replaced
 * entirely rather than left as a silent dead path.
 */

import type { ServiceResult } from '../types/serviceResult';

const YOUTUBE_PROXY_URL = '/api/youtube';

interface LocalizedTrimsRequest {
  userHash: string;
  location?: string;
  cuisine?: string;
  diet?: string;
  regionCode?: string;
  queries?: string[];
  maxResultsPerQuery?: number;
}

interface LocalizedTrimsResponse {
  items: YouTubeSearchItem[];
  source?: 'live' | 'cache' | 'fallback';
  reason?: string;
  queryCount?: number;
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

interface YouTubeVideoDetails {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    thumbnails?: Record<string, { url?: string }>;
    publishedAt?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

/**
 * Shared fetch wrapper with timeout and error handling.
 */
async function proxyFetch<T>(url: string, init?: RequestInit): Promise<ServiceResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      return { success: false, error: data?.error || `YouTube request failed (${response.status})` };
    }

    return { success: true, data: data.data ?? data };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { success: false, error: 'YouTube request timed out (10s)' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  } finally {
    clearTimeout(timeout);
  }
}

export const YouTubeService = {
  async searchVideos(query: string, maxResults = 12): Promise<ServiceResult<{ items: YouTubeSearchItem[] }>> {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(maxResults),
      order: 'relevance',
    });

    return proxyFetch(`${YOUTUBE_PROXY_URL}/search?${params}`);
  },

  /**
   * Not implemented server-side yet - nothing in the app calls this today
   * (kept for API-shape parity with the legacy service). Wire up a
   * `personalized-trims` action on /api/youtube/[action] if/when a caller
   * needs it.
   */
  async getLocalizedTrimsFeed(payload: LocalizedTrimsRequest): Promise<ServiceResult<LocalizedTrimsResponse>> {
    return proxyFetch(`${YOUTUBE_PROXY_URL}/personalized-trims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetches the user's YouTube channel handle using a Google Access Token.
   * This goes directly to Google's API (not through the proxy) because it
   * uses the user's own OAuth token, not our server-side API key.
   */
  async getMyChannel(accessToken: string): Promise<ServiceResult<{ handle: string; url: string; title: string }>> {
    try {
      const params = new URLSearchParams({ part: 'snippet', mine: 'true' });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: data?.error?.message || `YouTube API failed (${response.status})` };
      }

      const items = data?.items || [];
      if (items.length === 0) {
        return { success: false, error: 'No YouTube channel found for this Google account.' };
      }

      const channel = items[0];
      const title = channel.snippet?.title || '';
      const handle = channel.snippet?.customUrl || '';
      const channelId = channel.id;
      const url = handle ? `https://youtube.com/${handle}` : `https://youtube.com/channel/${channelId}`;

      return { success: true, data: { handle, url, title } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async getVideoDetails(videoId: string): Promise<ServiceResult<{ items: YouTubeVideoDetails[] }>> {
    const params = new URLSearchParams({ videoId });
    return proxyFetch(`${YOUTUBE_PROXY_URL}/video-details?${params}`);
  },
};

export default YouTubeService;
