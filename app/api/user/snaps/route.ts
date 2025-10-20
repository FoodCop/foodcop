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

    // Get user's photo posts (snaps) from posts table
    const { data: posts, error: postsError } = await sb
      .from("posts")
      .select(`
        id,
        content,
        images,
        rating,
        visit_date,
        dish_names,
        likes_count,
        shares_count,
        created_at,
        updated_at,
        restaurants(
          id,
          name,
          address,
          coordinates
        )
      `)
      .eq("user_id", user.id)
      .eq("post_type", "photo")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching photo posts:", postsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch photos", details: postsError.message },
        { status: 500 }
      );
    }

    // Transform posts data to match expected FoodSnap format
    const snaps = posts?.map(post => {
      const firstImage = post.images?.[0];
      return {
        id: post.id,
        image_url: firstImage?.url || '',
        image_path: firstImage?.path,
        restaurant_name: (post.restaurants as any)?.name || 'Unknown Restaurant',
        restaurant_address: (post.restaurants as any)?.address,
        rating: post.rating,
        food_tags: post.dish_names || [],
        additional_tags: [], // Can be extracted from saved_items metadata if needed
        review: post.content,
        price_range: null, // Can be extracted from saved_items metadata if needed
        visit_date: post.visit_date,
        location_address: (post.restaurants as any)?.address,
        likes_count: post.likes_count || 0,
        shares_count: post.shares_count || 0,
        created_at: post.created_at,
        updated_at: post.updated_at,
        source: 'snap'
      };
    }) || [];

    console.log(`✅ Found ${snaps.length} photo snaps for user`);

    return NextResponse.json({ 
      success: true, 
      data: snaps
    });

  } catch (error) {
    console.error("User snaps fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}