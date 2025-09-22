import { getSupabaseClient } from "../../utils/supabase";

export type ItemType = "restaurant" | "recipe" | "photo" | "other";

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: ItemType;
  item_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SaveItemParams {
  itemId: string;
  itemType: ItemType;
  metadata?: Record<string, any>;
}

export interface SaveItemResult {
  success: boolean;
  message: string;
  savedItem?: SavedItem;
}

export interface ListSavedItemsParams {
  itemType?: ItemType;
  limit?: number;
  offset?: number;
}

class SavedItemsService {
  private getSupabase() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase client not available");
    }
    return supabase;
  }

  /**
   * Save an item to the user's plate
   * Idempotent: duplicate saves return success
   */
  async saveItem(params: SaveItemParams): Promise<SaveItemResult> {
    const { itemId, itemType, metadata = {} } = params;

    try {
      const supabase = this.getSupabase();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          message: "Please sign in to save items",
        };
      }

      // Insert with conflict handling (idempotent)
      const { data, error } = await supabase
        .from("saved_items")
        .upsert(
          {
            user_id: user.id,
            item_type: itemType,
            item_id: itemId,
            metadata,
          },
          {
            onConflict: "user_id,item_type,item_id",
            ignoreDuplicates: false, // Update metadata if exists
          }
        )
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation as success (idempotent)
        if (error.code === "23505") {
          // Item already exists, get the existing one
          const { data: existing } = await supabase
            .from("saved_items")
            .select("*")
            .eq("user_id", user.id)
            .eq("item_type", itemType)
            .eq("item_id", itemId)
            .single();

          return {
            success: true,
            message: "Item already saved to your Plate",
            savedItem: existing,
          };
        }

        console.error("Save item error:", error);
        return {
          success: false,
          message: "Failed to save item. Please try again.",
        };
      }

      return {
        success: true,
        message: "Saved to your Plate",
        savedItem: data,
      };
    } catch (error) {
      console.error("Save item error:", error);
      return {
        success: false,
        message: "Failed to save item. Please try again.",
      };
    }
  }

  /**
   * Remove an item from the user's plate
   */
  async unsaveItem(params: SaveItemParams): Promise<SaveItemResult> {
    const { itemId, itemType } = params;

    try {
      const supabase = this.getSupabase();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          message: "Please sign in to manage your saved items",
        };
      }

      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (error) {
        console.error("Unsave item error:", error);
        return {
          success: false,
          message: "Failed to remove item. Please try again.",
        };
      }

      return {
        success: true,
        message: "Removed from your Plate",
      };
    } catch (error) {
      console.error("Unsave item error:", error);
      return {
        success: false,
        message: "Failed to remove item. Please try again.",
      };
    }
  }

  /**
   * List saved items for the current user
   */
  async listSavedItems(
    params: ListSavedItemsParams = {}
  ): Promise<SavedItem[]> {
    const { itemType, limit = 50, offset = 0 } = params;

    try {
      const supabase = this.getSupabase();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return [];
      }

      let query = supabase
        .from("saved_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (itemType) {
        query = query.eq("item_type", itemType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("List saved items error:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("List saved items error:", error);
      return [];
    }
  }

  /**
   * Check if an item is saved by the current user
   */
  async isItemSaved(params: SaveItemParams): Promise<boolean> {
    const { itemId, itemType } = params;

    try {
      const supabase = this.getSupabase();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return false;
      }

      const { data, error } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .limit(1);

      if (error) {
        console.error("Check saved item error:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Check saved item error:", error);
      return false;
    }
  }

  /**
   * Get saved items count by type
   */
  async getSavedItemsCount(): Promise<Record<ItemType, number>> {
    try {
      const supabase = this.getSupabase();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { restaurant: 0, recipe: 0, photo: 0, other: 0 };
      }

      const { data, error } = await supabase
        .from("saved_items")
        .select("item_type")
        .eq("user_id", user.id);

      if (error) {
        console.error("Get saved items count error:", error);
        return { restaurant: 0, recipe: 0, photo: 0, other: 0 };
      }

      const counts = { restaurant: 0, recipe: 0, photo: 0, other: 0 };
      data?.forEach((item) => {
        counts[item.item_type as ItemType]++;
      });

      return counts;
    } catch (error) {
      console.error("Get saved items count error:", error);
      return { restaurant: 0, recipe: 0, photo: 0, other: 0 };
    }
  }

  /**
   * Bulk check if multiple items are saved
   */
  async areItemsSaved(
    items: Array<{ itemId: string; itemType: ItemType }>
  ): Promise<Record<string, boolean>> {
    try {
      const supabase = this.getSupabase();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return {};
      }

      // Create a map for quick lookup
      const itemKeys = items.map(
        ({ itemId, itemType }) => `${itemType}:${itemId}`
      );
      const result: Record<string, boolean> = {};

      // Initialize all as false
      itemKeys.forEach((key) => {
        result[key] = false;
      });

      if (items.length === 0) return result;

      // Build query conditions
      const conditions = items.map(
        ({ itemType, itemId }) =>
          `(item_type.eq.${itemType},item_id.eq.${itemId})`
      );

      const { data, error } = await supabase
        .from("saved_items")
        .select("item_type,item_id")
        .eq("user_id", user.id)
        .or(conditions.join(","));

      if (error) {
        console.error("Bulk check saved items error:", error);
        return result;
      }

      // Mark found items as saved
      data?.forEach((item) => {
        const key = `${item.item_type}:${item.item_id}`;
        result[key] = true;
      });

      return result;
    } catch (error) {
      console.error("Bulk check saved items error:", error);
      return {};
    }
  }
}

// Export singleton instance
export const savedItemsService = new SavedItemsService();
