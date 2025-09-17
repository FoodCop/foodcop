import { sbService } from "../lib/supabase";

// Get feed post metrics
export async function getFeedMetrics() {
  const supabase = sbService();
  const { data, error } = await supabase.rpc("get_feed_metrics");
  if (error) throw error;
  return data;
}

// Get user engagement metrics
export async function getUserEngagementMetrics() {
  const supabase = sbService();
  const { data, error } = await supabase.rpc("get_user_engagement_metrics");
  if (error) throw error;
  return data;
}

// Get bot performance metrics
export async function getBotPerformanceMetrics() {
  const supabase = sbService();
  const { data, error } = await supabase.rpc("get_bot_performance_metrics");
  if (error) throw error;
  return data;
}

// Admin curation tool: Approve or remove feed posts
export async function curateFeedPost(postId: string, action: "approve" | "remove") {
  const supabase = sbService();
  if (action === "approve") {
    await supabase.from("feed").update({ approved: true }).eq("id", postId);
  } else {
    await supabase.from("feed").delete().eq("id", postId);
  }
}

// Admin tool: Feature a post
export async function featureFeedPost(postId: string) {
  const supabase = sbService();
  await supabase.from("feed").update({ featured: true }).eq("id", postId);
}

// Admin tool: Get flagged posts
export async function getFlaggedPosts() {
  const supabase = sbService();
  const { data, error } = await supabase.from("feed").select("*").eq("flagged", true);
  if (error) throw error;
  return data;
}

// Usage: Call these functions from your admin dashboard or backend scripts
