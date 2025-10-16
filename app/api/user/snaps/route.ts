import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: authError } = await sb.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's food snaps
    const { data: snaps, error: snapsError } = await sb
      .from("food_snaps")
      .select(`
        id,
        image_url,
        restaurant_name,
        rating,
        food_tags,
        additional_tags,
        review,
        price_range,
        visit_date,
        location_address,
        likes_count,
        shares_count,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (snapsError) {
      console.error("Error fetching snaps:", snapsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch photos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: snaps || []
    });

  } catch (error) {
    console.error("User snaps fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}