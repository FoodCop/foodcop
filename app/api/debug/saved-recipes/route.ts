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

    // Fetch all saved recipes from the saved_items table
    const { data: savedRecipes, error } = await supabase
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
      .eq('item_type', 'recipe')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    // Process and format the recipes
    const formattedRecipes = savedRecipes?.map(item => ({
      id: item.id,
      user_id: item.user_id,
      recipe_id: item.item_id,
      recipe_data: item.metadata,
      saved_at: item.created_at,
      updated_at: item.updated_at,
      // Extract key recipe info from metadata
      title: item.metadata?.title || 'Unknown Recipe',
      image: item.metadata?.image || null,
      readyInMinutes: item.metadata?.readyInMinutes || null,
      servings: item.metadata?.servings || null,
      diets: item.metadata?.diets || [],
      saved_from: item.metadata?.saved_from || 'unknown',
      saved_method: item.metadata?.saved_method || 'unknown'
    })) || [];

    return NextResponse.json({
      success: true,
      recipes: formattedRecipes,
      count: formattedRecipes.length,
      message: `Found ${formattedRecipes.length} saved recipes`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}