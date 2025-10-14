import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Use service role key to bypass RLS for debugging
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Service role key not configured"
      });
    }

    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: "Supabase URL not configured"
      });
    }

    // Create service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all users from the public.users table
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        display_name,
        bio,
        avatar_url,
        location_city,
        location_country,
        total_points,
        followers_count,
        following_count,
        is_master_bot,
        last_seen,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    // Process users to add online status
    const processedUsers = (users || []).map(user => {
      const lastSeenAt = user.last_seen ? new Date(user.last_seen) : null;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return {
        ...user,
        is_online: lastSeenAt ? lastSeenAt > fiveMinutesAgo : false,
        last_seen: user.last_seen
      };
    });

    return NextResponse.json({
      success: true,
      users: processedUsers,
      count: processedUsers.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}
