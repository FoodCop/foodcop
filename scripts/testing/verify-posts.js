import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPosts() {
  console.log("🔍 Verifying redistributed posts...");

  const { data: posts, error } = await supabase
    .from("bot_posts")
    .select("id, bot_id, title, subtitle")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("❌ Error:", error);
    return;
  }

  console.log("📊 Total posts:", posts.length);
  console.log("\n📝 Recent posts:");
  posts.slice(0, 5).forEach((post, i) => {
    console.log(i + 1 + ". " + post.title);
    console.log("   Bot ID: " + post.bot_id);
    console.log("   Subtitle: " + post.subtitle);
    console.log("");
  });
}

verifyPosts().catch(console.error);

