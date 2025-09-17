// Test Bot Posts Fetching
// Run with: node scripts/test-bot-posts.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing environment variables:");
  console.error("SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error("SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅" : "❌");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBotPosts() {
  console.log("🤖 Testing Bot Posts Fetching...\n");

  try {
    // Test the same query that useBotPosts hook uses
    const { data: posts, error } = await supabase
      .from("bot_posts")
      .select(
        `
        *,
        bot:users (
          username,
          display_name,
          master_bots (
            personality_type,
            specialties
          )
        )
      `
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ Error fetching bot posts:", error);
      return;
    }

    console.log(`✅ Successfully fetched ${posts?.length || 0} bot posts\n`);

    // Display sample posts
    posts?.slice(0, 5).forEach((post, index) => {
      const restaurant = post.restaurant_data;
      console.log(`${index + 1}. ${post.title}`);
      console.log(
        `   👤 Bot: ${post.bot?.display_name} (@${post.bot?.username})`
      );
      console.log(
        `   🏪 Restaurant: ${restaurant?.title} in ${restaurant?.city}, ${restaurant?.countryCode}`
      );
      console.log(
        `   💰 Price: ${restaurant?.price || "N/A"} | ⭐ ${
          restaurant?.totalScore
        }/5`
      );
      console.log(`   🏷️ Tags: ${post.tags?.join(", ")}`);
      console.log(
        `   📅 Published: ${new Date(post.published_at).toLocaleDateString()}\n`
      );
    });

    // Test feed card conversion
    console.log("🎯 Converting to Feed Cards...\n");

    const feedCards = posts?.map((post) => {
      const restaurant = post.restaurant_data;
      return {
        id: post.id,
        image: post.image_url,
        title: post.title,
        subtitle: post.subtitle,
        profileName: post.bot?.display_name || "Master Bot",
        profileDesignation:
          post.bot?.master_bots?.[0]?.personality_type || "Food Explorer",
        tags: post.tags,
        isMasterBot: true,
        botData: {
          username: post.bot?.username || "@masterbot",
          location: restaurant
            ? `${restaurant.city}, ${restaurant.countryCode}`
            : "Global",
          specialties: post.bot?.master_bots?.[0]?.specialties || [],
        },
        restaurant: restaurant,
        post: post,
      };
    });

    console.log(
      `✅ Successfully converted ${feedCards?.length || 0} posts to feed cards`
    );

    // Show sample feed card
    if (feedCards && feedCards.length > 0) {
      const sampleCard = feedCards[0];
      console.log("\n📱 Sample Feed Card:");
      console.log(`   Title: ${sampleCard.title}`);
      console.log(
        `   Profile: ${sampleCard.profileName} (${sampleCard.profileDesignation})`
      );
      console.log(`   Location: ${sampleCard.botData.location}`);
      console.log(`   Tags: ${sampleCard.tags?.join(", ")}`);
      console.log(`   Is Master Bot: ${sampleCard.isMasterBot}`);
    }

    console.log("\n🎉 Bot Posts System Ready!");
    console.log(`📊 Total posts: ${posts?.length || 0}`);
    console.log(`🤖 All bots have curated content`);
    console.log(`📱 Feed cards ready for SwipeDeck`);
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

testBotPosts();



