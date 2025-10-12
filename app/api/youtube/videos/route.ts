import { NextRequest, NextResponse } from "next/server";

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  viewCount?: string;
  tags?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'cooking food recipe';
    const maxResults = searchParams.get('maxResults') || '25';
    const category = searchParams.get('category') || '';
    
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeKey) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API key not configured',
        videos: []
      }, { status: 500 });
    }

    // Build search query with category filter
    let searchQuery = query;
    if (category) {
      searchQuery = `${category} ${query}`;
    }

    // Search for videos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&videoCategoryId=26&` + // Category 26 is "Howto & Style" which includes cooking
      `q=${encodeURIComponent(searchQuery)}&` +
      `maxResults=${maxResults}&` +
      `order=relevance&` +
      `key=${youtubeKey}`
    );

    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
        message: 'No videos found'
      });
    }

    // Get video IDs for additional details
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    // Get video details (duration, view count, etc.)
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics&` +
      `id=${videoIds}&` +
      `key=${youtubeKey}`
    );

    const detailsData = detailsResponse.ok ? await detailsResponse.json() : { items: [] };
    
    // Combine search results with details
    const videos: YouTubeVideo[] = searchData.items.map((item: any) => {
      const details = detailsData.items?.find((d: any) => d.id === item.id.videoId);
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.maxresdefault?.url || 
                  item.snippet.thumbnails?.high?.url || 
                  item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt,
        duration: details?.contentDetails?.duration || 'PT0S',
        viewCount: details?.statistics?.viewCount,
        tags: item.snippet.tags || []
      };
    });

    return NextResponse.json({
      success: true,
      videos,
      totalResults: searchData.pageInfo?.totalResults || videos.length,
      query: searchQuery
    });

  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch YouTube videos',
      message: error instanceof Error ? error.message : 'Unknown error',
      videos: []
    }, { status: 500 });
  }
}