import { supabaseServer } from "@/lib/supabase/server";
import fs from "node:fs";
import path from "node:path";

export type Bite = {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  media_url?: string;
  item_type: "video" | "bite";
  item_id?: string;
};

export async function getBites(): Promise<Bite[]> {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from("master_bot_posts")
      .select("*")
      .in("item_type", ["video", "bite"])
      .limit(30);
    if (!error && data?.length) {
      return data.map((d: any) => ({
        id: d.id,
        title: d.title ?? d.heading ?? "Untitled",
        subtitle: d.subtitle ?? d.snippet ?? "",
        image_url: d.image_url ?? d.image ?? "",
        media_url: d.media_url ?? "",
        item_type: (d.item_type as "video" | "bite") ?? "bite",
        item_id: d.item_id ?? d.slug ?? d.place_id ?? "",
      }));
    }
  } catch {}
  const seedsDir = path.resolve(process.cwd(), "../../public/masterbot-posts");
  const files = fs.existsSync(seedsDir)
    ? fs.readdirSync(seedsDir).filter((f) => f.endsWith(".json"))
    : [];
  const out: Bite[] = [];
  for (const f of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(seedsDir, f), "utf-8"));
    for (const p of arr) {
      const t = (p.item_type ?? p.type ?? "").toLowerCase();
      if (t === "video" || t === "bite") {
        out.push({
          id: p.id ?? `${f}-${p.slug ?? Math.random().toString(36).slice(2)}`,
          title: p.title ?? p.heading ?? "Untitled",
          subtitle: p.subtitle ?? p.snippet ?? "",
          image_url: p.image_url ?? p.image ?? "",
          media_url: p.media_url ?? "",
          item_type: (t as "video" | "bite") ?? "bite",
          item_id: p.item_id ?? p.slug ?? "",
        });
        if (out.length >= 30) return out;
      }
    }
  }
  return out;
}
