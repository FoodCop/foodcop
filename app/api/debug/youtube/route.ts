import { NextResponse } from "next/server";

export async function GET() {
  try {
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    
    if (!youtubeKey) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API key not configured',
        message: 'YOUTUBE_API_KEY environment variable is missing'
      });
    }

    // Test YouTube API with a simple search
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=cooking&type=video&maxResults=1&key=${youtubeKey}`);
    const data = await response.json();

    if (response.ok && data.items) {
      return NextResponse.json({
        success: true,
        message: 'YouTube API is accessible',
        results_count: data.items.length,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'YouTube API request failed',
          message: data.error?.message || 'API request failed',
          status: response.status
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('YouTube API test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'YouTube API request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}