import { NextResponse } from 'next/server';

// Server-side YouTube Data API v3 proxy. Mirrors /api/places/[action] and
// /api/gemini - a direct Next.js Route Handler using a server-only env var
// (YOUTUBE_API_KEY, already present in .env), not a Supabase Edge Function.
// Replaces the youtube-proxy Edge Function reference in youtubeService.ts,
// which 503s because that function was never deployed to this Supabase
// project - same "assume an edge function exists" trap the Gemini route was
// already written to avoid (see STATUS_REPORT.md).

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ success: false, error: 'YOUTUBE_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const { action } = await params;
  const { searchParams } = new URL(req.url);

  try {
    if (action === 'search') {
      const q = searchParams.get('q');
      if (!q) {
        return NextResponse.json({ success: false, error: 'Query parameter "q" is required' }, { status: 400 });
      }
      const maxResults = searchParams.get('maxResults') || '8';
      const order = searchParams.get('order') || 'relevance';

      const url = new URL(`${YOUTUBE_BASE_URL}/search`);
      url.searchParams.set('q', q);
      url.searchParams.set('key', YOUTUBE_API_KEY);
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('maxResults', maxResults);
      url.searchParams.set('type', 'video');
      url.searchParams.set('videoDuration', 'short');
      url.searchParams.set('order', order);
      url.searchParams.set('relevanceLanguage', 'en');

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ success: false, error: data?.error?.message || 'YouTube API error' }, { status: res.status });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'video-details') {
      const videoId = searchParams.get('videoId');
      if (!videoId) {
        return NextResponse.json({ success: false, error: 'Parameter "videoId" is required' }, { status: 400 });
      }

      const url = new URL(`${YOUTUBE_BASE_URL}/videos`);
      url.searchParams.set('key', YOUTUBE_API_KEY);
      url.searchParams.set('id', videoId);
      url.searchParams.set('part', 'snippet,statistics');

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ success: false, error: data?.error?.message || 'YouTube API error' }, { status: res.status });
      }
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: `Unknown action "${action}"` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'YouTube request failed' }, { status: 502 });
  }
}
