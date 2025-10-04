import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log('🔥 Save-to-plate API called');
    const body = await req.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    const { itemId, itemType, metadata } = body;

    // Validate required fields
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "itemId is required" },
        { status: 400 }
      );
    }

    if (!itemType || !['restaurant', 'recipe', 'photo', 'other'].includes(itemType)) {
      return NextResponse.json(
        { success: false, error: "Valid itemType is required (restaurant, recipe, photo, other)" },
        { status: 400 }
      );
    }

    // Initialize server-side Supabase client
    console.log('🔐 Initializing server-side Supabase client...');
    const supabase = await supabaseServer();
    
    // Check if user is authenticated
    console.log('👤 Checking user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 Auth result:', { user: user ? { id: user.id, email: user.email } : null, error: authError });
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Save the item directly to the database
    console.log('💾 Attempting to save to database with:', {
      user_id: user.id,
      item_type: itemType,
      item_id: itemId.toString(),
      metadata: metadata ? 'provided' : 'null'
    });
    
    // Use a consistent tenant_id for all users in this single-tenant application
    const appTenantId = '00000000-0000-4000-8000-000000000001';
    
    const { data, error } = await supabase
      .from('saved_items')
      .upsert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId.toString(),
        metadata: metadata || {},
        tenant_id: appTenantId
      }, {
        onConflict: 'tenant_id,user_id,item_type,item_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving item to database:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Successfully saved item:', data);
    return NextResponse.json({
      success: true,
      data: data,
      message: `${itemType} saved to plate successfully`
    });

  } catch (error) {
    console.error('💥 Unexpected error in save-to-plate API:', error);
    console.error('📊 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
