import { NextResponse } from 'next/server';
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    console.log('🔥 Save-restaurant API called');
    const body = await request.json();
    console.log('📦 Request body keys:', Object.keys(body));
    
    // Validate required fields
    if (!body.restaurant || !body.restaurant.id) {
      console.log('❌ Validation error: Missing restaurant or restaurant.id');
      return NextResponse.json({
        success: false,
        error: 'Restaurant data with ID is required'
      }, { status: 400 });
    }

    const restaurant = body.restaurant;
    console.log('🍽️ Restaurant to save:', { id: restaurant.id, name: restaurant.name, address: restaurant.vicinity || restaurant.formatted_address || restaurant.address });
    
    // Validate required restaurant fields (be flexible with address)
    const requiredFields = ['id', 'name'];
    const missingFields = requiredFields.filter(field => !restaurant[field]);
    
    // Check for address in multiple possible fields
    const hasAddress = restaurant.address || restaurant.vicinity || restaurant.formatted_address;
    if (!hasAddress) {
      missingFields.push('address/vicinity/formatted_address');
    }
    
    // Check for location coordinates (be flexible with all possible formats)
    const hasLocation = (restaurant.latitude && restaurant.longitude) || 
                       (restaurant.lat && restaurant.lng) ||
                       (restaurant.coordinates?.lat && restaurant.coordinates?.lng) ||
                       (restaurant.geometry?.location?.lat && restaurant.geometry?.location?.lng);
    if (!hasLocation) {
      console.log('❌ No coordinates found. Checked: latitude/longitude, lat/lng, coordinates.lat/lng, geometry.location.lat/lng');
      console.log('❌ Restaurant object keys:', Object.keys(restaurant));
      if (restaurant.coordinates) {
        console.log('❌ Coordinates object keys:', Object.keys(restaurant.coordinates));
      }
      missingFields.push('coordinates (lat/lng or latitude/longitude)');
    }
    
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return NextResponse.json({
        success: false,
        error: `Missing required restaurant fields: ${missingFields.join(', ')}`
      }, { status: 400 });
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
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    // Prepare restaurant metadata with normalized fields
    const metadata = {
      // Core restaurant data
      ...restaurant,
      // Override with specific fields to ensure consistency
      restaurant_id: restaurant.id,
      name: restaurant.name,
      // Normalize address field
      address: restaurant.address || restaurant.vicinity || restaurant.formatted_address || 'Address not available',
      // Normalize coordinates (handle all possible formats)
      latitude: restaurant.latitude || restaurant.lat || restaurant.coordinates?.lat || restaurant.geometry?.location?.lat,
      longitude: restaurant.longitude || restaurant.lng || restaurant.coordinates?.lng || restaurant.geometry?.location?.lng,
      // Metadata
      saved_at: new Date().toISOString(),
      saved_from: 'ScoutDebug',
      saved_method: restaurant.search_method || 'scout_search',
      // Ensure arrays are properly formatted
      types: restaurant.types || [],
      photos: restaurant.photos || [],
      // Set defaults for optional fields
      search_method: restaurant.search_method || 'unknown',
      restaurant_type: restaurant.restaurant_type || 'all',
      rating: restaurant.rating || null,
      price_level: restaurant.price_level || null,
      user_ratings_total: restaurant.user_ratings_total || null
    };

    // Save the restaurant directly to the database
    console.log('💾 Attempting to save to database with:', {
      user_id: user.id,
      item_type: 'restaurant',
      item_id: restaurant.id,
      metadata: 'provided'
    });

    const { data, error } = await supabase
      .from('saved_items')
      .upsert({
        user_id: user.id,
        item_type: 'restaurant',
        item_id: restaurant.id,
        metadata: metadata
      }, {
        onConflict: 'user_id,item_type,item_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`
      }, { status: 500 });
    }

    console.log('✅ Restaurant saved successfully:', { saved_item_id: data.id, restaurant_name: restaurant.name });

    return NextResponse.json({
      success: true,
      message: `Restaurant "${restaurant.name}" saved to plate`,
      data: {
        saved_item_id: data.id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        saved_at: data.created_at
      }
    });

  } catch (error) {
    console.error('💥 Save restaurant error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET endpoint to check if a restaurant is saved
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'Restaurant ID is required'
      }, { status: 400 });
    }

    // Initialize server-side Supabase client
    const supabase = await supabaseServer();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    // Check if restaurant is saved
    const { data, error: dbError } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'restaurant')
      .eq('item_id', restaurantId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({
        success: false,
        error: dbError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_saved: !!data,
      restaurant_id: restaurantId
    });

  } catch (error) {
    console.error('Check restaurant saved error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}