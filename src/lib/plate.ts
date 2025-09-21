import { getSupabaseClient } from "../../utils/supabase";

export type PlateItemType = "restaurant" | "recipe" | "photo" | "video";

export interface PlateItem {
  id: string;
  plate_id: string;
  item_type: PlateItemType;
  item_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SaveToPlateParams {
  itemId: string;
  itemType: PlateItemType;
  metadata?: Record<string, any>;
}

export interface PlateListOptions {
  itemType?: PlateItemType;
  limit?: number;
  offset?: number;
}

/**
 * Save an item to the user's plate with idempotency
 * Treats duplicate saves as success (no error thrown)
 */
export async function plateSave(
  params: SaveToPlateParams
): Promise<{ ok: true }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { itemId, itemType, metadata = {} } = params;

  try {
    // First, get the current user's plate_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if plates table exists by trying to query it
    let plateId: string | null = null;

    try {
      const { data: plate, error: plateError } = await supabase
        .from("plates")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (plateError && plateError.code !== "PGRST116") {
        // If it's a table doesn't exist error, we'll handle it below
        if (
          plateError.code === "PGRST301" ||
          (plateError.message.includes("relation") &&
            plateError.message.includes("does not exist"))
        ) {
          console.warn(
            "Plates table doesn't exist yet. Please run the database migrations."
          );
          throw new Error(
            "Database tables not set up. Please run migrations first."
          );
        }
        throw new Error(`Failed to get plate: ${plateError.message}`);
      }

      plateId = plate?.id;

      // Create plate if it doesn't exist
      if (!plateId) {
        console.log("Creating new plate for user:", user.id);
        const { data: newPlate, error: createError } = await supabase
          .from("plates")
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || "User",
            username: user.email?.split("@")[0] || "user",
            bio: "",
            avatar_url: null,
            cover_photo_url: null,
            location_city: null,
            location_state: null,
            location_country: null,
            dietary_preferences: [],
            cuisine_preferences: [],
            total_points: 0,
            current_level: 1,
            streak_count: 0,
            friends_count: 0,
            saved_places_count: 0,
            saved_recipes_count: 0,
            saved_photos_count: 0,
            saved_videos_count: 0,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating plate:", createError);
          throw new Error(`Failed to create plate: ${createError.message}`);
        }

        plateId = newPlate.id;
        console.log("Created new plate with ID:", plateId);
      } else {
        console.log("Using existing plate with ID:", plateId);
      }
    } catch (error) {
      console.error("Database error:", error);
      throw new Error(
        "Database not set up. Please run the migrations to create the required tables."
      );
    }

    // Insert the plate item with idempotency
    const { error: insertError } = await supabase.from("plate_items").insert({
      plate_id: plateId,
      item_type: itemType,
      item_id: itemId,
      metadata: {
        ...metadata,
        saved_at: new Date().toISOString(),
      },
    });

    // Handle unique constraint violation as success (idempotency)
    if (insertError) {
      if (insertError.code === "23505") {
        // Unique constraint violation - item already saved
        return { ok: true };
      }
      throw new Error(`Failed to save item: ${insertError.message}`);
    }

    return { ok: true };
  } catch (error) {
    console.error("Error saving to plate:", error);
    throw error;
  }
}

/**
 * Get items from the user's plate
 */
export async function plateList(
  options: PlateListOptions = {}
): Promise<PlateItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { itemType, limit = 50, offset = 0 } = options;

  try {
    // Get the current user's plate_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the user's plate
    const { data: plate, error: plateError } = await supabase
      .from("plates")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (plateError) {
      if (plateError.code === "PGRST116") {
        // No plate found, return empty array
        return [];
      }
      if (
        plateError.code === "PGRST301" ||
        (plateError.message.includes("relation") &&
          plateError.message.includes("does not exist"))
      ) {
        console.warn(
          "Plates table doesn't exist yet. Please run the database migrations."
        );
        return [];
      }
      throw new Error(`Failed to get plate: ${plateError.message}`);
    }

    // Build query
    let query = supabase
      .from("plate_items")
      .select("*")
      .eq("plate_id", plate.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by item type if specified
    if (itemType) {
      query = query.eq("item_type", itemType);
    }

    const { data: items, error: itemsError } = await query;

    if (itemsError) {
      throw new Error(`Failed to get plate items: ${itemsError.message}`);
    }

    return items || [];
  } catch (error) {
    console.error("Error getting plate items:", error);
    throw error;
  }
}

/**
 * Remove an item from the user's plate
 */
export async function plateRemove(
  itemId: string,
  itemType: PlateItemType
): Promise<{ ok: true }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // Get the current user's plate_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the user's plate
    const { data: plate, error: plateError } = await supabase
      .from("plates")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (plateError) {
      throw new Error(`Failed to get plate: ${plateError.message}`);
    }

    // Delete the plate item
    const { error: deleteError } = await supabase
      .from("plate_items")
      .delete()
      .eq("plate_id", plate.id)
      .eq("item_id", itemId)
      .eq("item_type", itemType);

    if (deleteError) {
      throw new Error(`Failed to remove item: ${deleteError.message}`);
    }

    return { ok: true };
  } catch (error) {
    console.error("Error removing from plate:", error);
    throw error;
  }
}

/**
 * Check if an item is saved to the user's plate
 */
export async function plateIsSaved(
  itemId: string,
  itemType: PlateItemType
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    // Get the current user's plate_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    // Get the user's plate
    const { data: plate, error: plateError } = await supabase
      .from("plates")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (plateError) {
      return false;
    }

    // Check if item exists
    const { data: item, error: itemError } = await supabase
      .from("plate_items")
      .select("id")
      .eq("plate_id", plate.id)
      .eq("item_id", itemId)
      .eq("item_type", itemType)
      .single();

    return !itemError && !!item;
  } catch (error) {
    console.error("Error checking if item is saved:", error);
    return false;
  }
}
