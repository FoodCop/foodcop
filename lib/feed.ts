import fs from "node:fs";
import path from "node:path";
import { supabaseServer } from "./supabase/server";

export type FeedPost = {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  item_type?: "restaurant" | "recipe" | "video";
  item_id?: string;
};

export async function getFeedPosts(): Promise<FeedPost[]> {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from("master_bot_posts")
      .select("*")
      .limit(30);
    if (!error && data && data.length) {
      return data.map((d: any) => ({
        id: d.id,
        title: d.title ?? d.heading ?? "Untitled",
        subtitle: d.subtitle ?? d.snippet ?? "",
        image_url: d.image_url ?? d.image ?? "",
        item_type: d.item_type ?? "restaurant",
        item_id: d.item_id ?? d.place_id ?? "",
      }));
    }
  } catch (_) {}
  // fallback to seeds in /public/masterbot-posts/*.json (root of repo)
  const seedsDir = path.resolve(process.cwd(), "../../public/masterbot-posts");
  const files = fs.existsSync(seedsDir)
    ? fs.readdirSync(seedsDir).filter((f) => f.endsWith(".json"))
    : [];
  const posts: FeedPost[] = [];
  for (const f of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(seedsDir, f), "utf-8"));
    for (const p of arr) {
      posts.push({
        id: p.id ?? `${f}-${p.slug ?? Math.random().toString(36).slice(2)}`,
        title: p.title ?? p.heading ?? "Untitled",
        subtitle: p.subtitle ?? p.snippet ?? "",
        image_url: p.image_url ?? p.image ?? "",
        item_type: p.item_type ?? "restaurant",
        item_id: p.item_id ?? p.place_id ?? "",
      });
      if (posts.length >= 30) return posts;
    }
  }
  return posts;
}
