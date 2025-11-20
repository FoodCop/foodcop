import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'YouTube API key not configured on server' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'search') {
      // Search videos
      const q = url.searchParams.get('q');
      const maxResults = url.searchParams.get('maxResults') || '8';
      const order = url.searchParams.get('order') || 'relevance';

      if (!q) {
        return new Response(
          JSON.stringify({ success: false, error: 'Query parameter "q" is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const youtubeUrl = new URL(`${YOUTUBE_BASE_URL}/search`);
      youtubeUrl.searchParams.set('q', q);
      youtubeUrl.searchParams.set('key', YOUTUBE_API_KEY);
      youtubeUrl.searchParams.set('part', 'snippet');
      youtubeUrl.searchParams.set('maxResults', maxResults);
      youtubeUrl.searchParams.set('type', 'video');
      youtubeUrl.searchParams.set('videoDuration', 'short');
      youtubeUrl.searchParams.set('order', order);
      youtubeUrl.searchParams.set('relevanceLanguage', 'en');

      const response = await fetch(youtubeUrl.toString());
      const data = await response.json();

      if (!response.ok) {
        console.error('YouTube API error:', data);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: data.error?.message || 'YouTube API error',
            details: data 
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (action === 'video-details') {
      // Get video details
      const videoId = url.searchParams.get('videoId');

      if (!videoId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Parameter "videoId" is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const youtubeUrl = new URL(`${YOUTUBE_BASE_URL}/videos`);
      youtubeUrl.searchParams.set('key', YOUTUBE_API_KEY);
      youtubeUrl.searchParams.set('id', videoId);
      youtubeUrl.searchParams.set('part', 'snippet,statistics');

      const response = await fetch(youtubeUrl.toString());
      const data = await response.json();

      if (!response.ok) {
        console.error('YouTube API error:', data);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: data.error?.message || 'YouTube API error',
            details: data 
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid action. Use "search" or "video-details"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in youtube-proxy:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
