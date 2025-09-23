import { getSupabaseClient } from "../../utils/supabase";

export type ItemType = "restaurant" | "recipe" | "photo" | "other";

export interface EnsureSavedParams {
  tenantId: string;
  userId: string;
  itemType: ItemType;
  itemId: string;
  meta?: Record<string, any>;
}

export interface EnsureRemovedParams {
  tenantId: string;
  userId: string;
  itemType: ItemType;
  itemId: string;
}

export interface SavedItem {
  id: string;
  tenant_id: string;
  user_id: string;
  item_type: ItemType;
  item_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Ensure an item is saved to the user's plate (final-state semantics)
 * Idempotent: multiple calls with same parameters result in exactly one row
 */
export async function ensureSaved({
  tenantId,
  userId,
  itemType,
  itemId,
  meta = {},
}: EnsureSavedParams): Promise<SavedItem> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Set tenant context for RLS
  await supabase.rpc("set_tenant_context", { tenant_id: tenantId });

  const { data, error } = await supabase
    .from("saved_items")
    .upsert(
      [
        {
          tenant_id: tenantId,
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
          metadata: meta,
        },
      ],
      { onConflict: "tenant_id,user_id,item_type,item_id" }
    )
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to ensure saved: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to save item - no data returned");
  }

  return data;
}

/**
 * Ensure an item is removed from the user's plate (final-state semantics)
 * Idempotent: deleting a non-existent item is not an error
 */
export async function ensureRemoved({
  tenantId,
  userId,
  itemType,
  itemId,
}: EnsureRemovedParams): Promise<{ removed: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Set tenant context for RLS
  await supabase.rpc("set_tenant_context", { tenant_id: tenantId });

  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  if (error) {
    throw new Error(`Failed to ensure removed: ${error.message}`);
  }

  return { removed: true };
}

/**
 * Check if an item is saved (with tenant isolation)
 */
export async function isItemSaved({
  tenantId,
  userId,
  itemType,
  itemId,
}: EnsureRemovedParams): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Set tenant context for RLS
  await supabase.rpc("set_tenant_context", { tenant_id: tenantId });

  const { data, error } = await supabase
    .from("saved_items")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check if saved: ${error.message}`);
  }

  return Boolean(data && data.length > 0);
}

/**
 * List saved items for a user (with tenant isolation)
 */
export async function listSavedItems({
  tenantId,
  userId,
  itemType,
  limit = 50,
  offset = 0,
}: {
  tenantId: string;
  userId: string;
  itemType?: ItemType;
  limit?: number;
  offset?: number;
}): Promise<SavedItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Set tenant context for RLS
  await supabase.rpc("set_tenant_context", { tenant_id: tenantId });

  let query = supabase
    .from("saved_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list saved items: ${error.message}`);
  }

  return data || [];
}
