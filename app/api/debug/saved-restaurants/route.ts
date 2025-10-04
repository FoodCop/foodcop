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

    // Fetch all saved restaurants from the saved_items table
    const { data: savedRestaurants, error } = await supabase
      .from('saved_items')
      .select(`
        id,
        user_id,
        item_id,
        item_type,
        metadata,
        created_at,
        updated_at
      `)
      .eq('item_type', 'restaurant')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    // Process and format the restaurants
    const formattedRestaurants = savedRestaurants?.map(item => ({
      id: item.id,
      user_id: item.user_id,
      restaurant_id: item.item_id,
      restaurant_data: item.metadata,
      saved_at: item.created_at,
      updated_at: item.updated_at,
      // Extract key restaurant info from metadata
      name: item.metadata?.name || 'Unknown Restaurant',
      address: item.metadata?.address || 'Address not available',
      latitude: item.metadata?.latitude || null,
      longitude: item.metadata?.longitude || null,
      rating: item.metadata?.rating || null,
      price_level: item.metadata?.price_level || null,
      types: item.metadata?.types || [],
      photos: item.metadata?.photos || [],
      saved_from: item.metadata?.saved_from || 'unknown',
      saved_method: item.metadata?.saved_method || 'unknown'
    })) || [];

    return NextResponse.json({
      success: true,
      restaurants: formattedRestaurants,
      count: formattedRestaurants.length,
      message: `Found ${formattedRestaurants.length} saved restaurants`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}