import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { imageData, filename, metadata } = await req.json();
    
    if (!imageData?.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, error: "Invalid image data" },
        { status: 400 }
      );
    }

    const sb = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: authError } = await sb.auth.getUser();
    
    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication failed", details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No authenticated user found. Please sign in to save snaps." },
        { status: 401 }
      );
    }

    // Generate a unique item_id for this snap
    const snapId = randomUUID();
    let imageUrl = imageData; // Fallback to base64 data URL
    let imagePath = `temp/snap_${snapId}.jpg`;

    // Try to upload to Supabase Storage first, but have fallback
    try {
      // Extract base64 data and convert to buffer
      const base64 = imageData.split(",")[1];
      const bytes = Buffer.from(base64, "base64");
      const name = filename ?? `snap_${Date.now()}.jpg`;
      const path = `snaps/${user.id}/${name}`;

      console.log(`Attempting to upload to: ${path}`);
      const { data: uploadData, error: uploadError } = await sb.storage
        .from("snaps")
        .upload(path, bytes, { 
          contentType: "image/jpeg", 
          upsert: true 
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        console.log("Using fallback storage method (base64 in database)");
        // Continue with base64 fallback instead of failing
      } else {
        // Get public URL for the uploaded image
        const { data: urlData } = sb.storage
          .from("snaps")
          .getPublicUrl(path);
        
        imageUrl = urlData.publicUrl;
        imagePath = path;
        console.log("✅ Successfully uploaded to Supabase Storage");
      }
    } catch (storageError) {
      console.error("Storage operation failed, using fallback:", storageError);
      // Continue with base64 fallback
    }

    // No need for tenant context - posts table uses auth.uid() for RLS

    // Handle restaurant - find existing or create new one
    let restaurantId = null;
    if (metadata?.restaurantName) {
      // Try to find existing restaurant by name
      const { data: existingRestaurant } = await sb
        .from("restaurants")
        .select("id")
        .ilike("name", metadata.restaurantName)
        .single();

      if (existingRestaurant) {
        restaurantId = existingRestaurant.id;
      } else {
        // Create new restaurant entry
        const { data: newRestaurant, error: restaurantError } = await sb
          .from("restaurants")
          .insert({
            name: metadata.restaurantName,
            address: metadata.location?.address || "Location from user snap",
            coordinates: metadata.location?.latitude && metadata.location?.longitude 
              ? `(${metadata.location.longitude},${metadata.location.latitude})`
              : null,
            city: metadata.location?.city,
            state: metadata.location?.state,
            country: metadata.location?.country,
            is_verified: false
          })
          .select("id")
          .single();

        if (!restaurantError && newRestaurant) {
          restaurantId = newRestaurant.id;
        }
      }
    }

    // Create image array for posts table
    const imageArray = [{
      url: imageUrl,
      path: imagePath,
      caption: metadata?.review || "Food snap",
      storage_type: imageUrl.startsWith("data:") ? "base64" : "supabase"
    }];

    // Save to posts table (integrates with existing Photos section)
    const { data: savedPost, error: saveError } = await sb
      .from("posts")
      .insert({
        id: snapId,
        user_id: user.id,
        restaurant_id: restaurantId,
        post_type: "photo",
        content: metadata?.review || `Food snap at ${metadata?.restaurantName || 'restaurant'}`,
        images: imageArray,
        rating: metadata?.rating || null,
        visit_date: metadata?.visitDate ? new Date(metadata.visitDate).toISOString().split('T')[0] : null,
        dish_names: metadata?.foodTags || [],
        visibility: "public"
      })
      .select()
      .single();

    if (saveError) {
      console.error("Database save error:", saveError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to save snap to database",
          details: saveError.message 
        },
        { status: 500 }
      );
    }

    // Also save to saved_items for user's plate (personal collection)
    try {
      await sb
        .from("saved_items")
        .insert({
          item_id: snapId,
          user_id: user.id,
          item_type: "photo",
          metadata: {
            title: metadata?.restaurantName ? `${metadata.restaurantName} - Food Snap` : "Food Snap",
            image_url: imageUrl,
            image_path: imagePath,
            source: "snap",
            post_id: snapId,
            restaurant_name: metadata?.restaurantName,
            rating: metadata?.rating,
            food_tags: metadata?.foodTags,
            additional_tags: metadata?.additionalTags,
            review: metadata?.review,
            price_range: metadata?.priceRange,
            visit_date: metadata?.visitDate,
            location: metadata?.location,
            captured_at: new Date().toISOString(),
            camera_type: "user_camera",
            storage_type: imageUrl.startsWith("data:") ? "base64" : "supabase"
          }
        });
    } catch (plateError) {
      console.error("Failed to save to plate, but post saved successfully:", plateError);
      // Don't fail the whole operation if plate save fails
    }

    console.log("✅ Snap saved successfully to posts table:", savedPost.id);
    return NextResponse.json({ 
      success: true, 
      item: savedPost,
      post_id: savedPost.id,
      restaurant_id: restaurantId,
      message: imageUrl.startsWith("data:") 
        ? "Snap saved with temporary storage (base64). Will show in Photos section!" 
        : "Snap saved successfully! Check your Photos section to see it."
    });

  } catch (error) {
    console.error("Snap save API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}