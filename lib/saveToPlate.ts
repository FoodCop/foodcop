import { supabaseServer } from "./supabase/server";

export async function saveToPlate(opts: {
  userId: string;
  itemType: "restaurant" | "recipe" | "video";
  itemId: string;
  source?: string;
}) {
  const sb = await supabaseServer();
  return await sb.from("saved_items").insert({
    user_id: opts.userId,
    item_type: opts.itemType,
    item_id: opts.itemId,
    source: opts.source ?? "next-mvp",
  });
}
