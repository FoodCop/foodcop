import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get recent Master Bot posts (last 24 hours)
    const { data: recentPosts, error: postsError } = await supabase
      .from('restaurant_posts')
      .select(`
        id,
        restaurant_name,
        bot_display_name,
        created_at,
        post_content
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching recent posts:', postsError);
    }

    // Get total posts count
    const { count: totalPosts, error: countError } = await supabase
      .from('restaurant_posts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching total posts count:', countError);
    }

    // Calculate next CRON run time (8PM IST = 14:30 UTC)
    const now = new Date();
    const nextRun = new Date();
    nextRun.setUTCHours(14, 30, 0, 0);
    
    // If today's run has passed, set to next day
    if (now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    const hoursUntilRun = Math.floor(timeUntilNextRun / (1000 * 60 * 60));
    const minutesUntilRun = Math.floor((timeUntilNextRun % (1000 * 60 * 60)) / (1000 * 60));

    return NextResponse.json({
      success: true,
      cronStatus: {
        schedule: "Daily at 8:00 PM IST (2:30 PM UTC)",
        nextRun: nextRun.toISOString(),
        timeUntilNextRun: `${hoursUntilRun}h ${minutesUntilRun}m`,
        lastRunToday: now.getUTCHours() >= 14 && now.getUTCMinutes() >= 30
      },
      posts: {
        recentPosts: recentPosts || [],
        recentPostsCount: recentPosts?.length || 0,
        totalPosts: totalPosts || 0,
        last24Hours: recentPosts?.length || 0
      },
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error in CRON status API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch CRON status',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}