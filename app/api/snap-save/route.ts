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
    
    // Get current user - with better error handling
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

    // Extract base64 data and convert to buffer
    const base64 = imageData.split(",")[1];
    const bytes = Buffer.from(base64, "base64");
    const name = filename ?? `snap_${Date.now()}.jpg`;
    const path = `snaps/${user.id}/${name}`;

    // Upload image to storage
    const { data: uploadData, error: uploadError } = await sb.storage
      .from("snaps")
      .upload(path, bytes, { 
        contentType: "image/jpeg", 
        upsert: true 
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded image
    const { data: urlData } = sb.storage
      .from("snaps")
      .getPublicUrl(path);

    // Set tenant context for RLS
    const appTenantId = "00000000-0000-4000-8000-000000000001";
    
    try {
      await sb.rpc('set_tenant_context', { tenant_id: appTenantId });
    } catch (tenantError) {
      console.error("Failed to set tenant context:", tenantError);
      // Continue anyway, but this might cause RLS issues
    }

    // Generate a unique item_id for this snap
    const snapId = randomUUID();

    // Save directly to saved_items table (no need for separate food_snaps table)
    const plateData = {
      user_id: user.id,
      item_type: "photo",
      item_id: snapId,
      metadata: {
        title: `${metadata.restaurantName} - Food Snap`,
        image_url: urlData.publicUrl,
        image_path: path,
        restaurant_name: metadata.restaurantName,
        rating: metadata.rating,
        food_tags: metadata.foodTags || [],
        additional_tags: metadata.additionalTags || [],
        review: metadata.review || null,
        price_range: metadata.priceRange || null,
        visit_date: metadata.visitDate,
        location: metadata.location,
        captured_at: metadata.capturedAt,
        source: "snap"
      },
      tenant_id: appTenantId
    };

    const { data: insertData, error: plateError } = await sb
      .from("saved_items")
      .upsert(plateData, {
        onConflict: 'tenant_id,user_id,item_type,item_id'
      })
      .select()
      .single();

    if (plateError) {
      console.error("Save error:", plateError);
      console.error("Data attempted:", plateData);
      return NextResponse.json(
        { success: false, error: "Failed to save snap", details: plateError.message },
        { status: 500 }
      );
    }

    console.log("✅ Successfully saved snap to plate");

    return NextResponse.json({ 
      success: true, 
      data: {
        id: snapId,
        imageUrl: urlData.publicUrl,
        path: path,
        savedItem: insertData
      }
    });

  } catch (error) {
    console.error("Snap save error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}