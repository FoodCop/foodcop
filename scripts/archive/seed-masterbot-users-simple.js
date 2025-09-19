// Seed Master Bot users in the users table (simplified)
// Run with: node scripts/seed-masterbot-users-simple.js

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The 7 AI connoisseurs with essential columns only
const masterBotUsers = [
  {
    id: "1b0f0628-295d-4a4a-85ca-48594eee15b3", // Aurelia Voss - has posts
    email: "aurelia@fuzo.ai",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
    bio: "From Marrakech souks to Tokyo alleys, always chasing street food magic. 🌍✨",
    avatar_url: "https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400",
    location_city: "Global Nomad",
    location_country: "World",
    is_master_bot: true,
    total_points: 8470,
    followers_count: 12500,
    following_count: 234,
  },
  {
    id: "78de3261-040d-492e-b511-50f71c0d9986", // Sebastian LeClair - has posts
    email: "sebastian@fuzo.ai",
    username: "sommelier_seb",
    display_name: "Sebastian LeClair",
    bio: "Wine and fine dining connoisseur with a passion for Michelin-starred experiences. 🍷✨",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    location_city: "Paris",
    location_country: "France",
    is_master_bot: true,
    total_points: 9230,
    followers_count: 18900,
    following_count: 156,
  },
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3", // Lila Cheng
    email: "lila@fuzo.ai",
    username: "plant_pioneer_lila",
    display_name: "Lila Cheng",
    bio: "Plant-based innovation advocate creating sustainable culinary experiences. 🌱💚",
    avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
    location_city: "San Francisco",
    location_country: "USA",
    is_master_bot: true,
    total_points: 7890,
    followers_count: 15200,
    following_count: 298,
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474", // Rafael Mendez
    email: "rafael@fuzo.ai",
    username: "adventure_rafa",
    display_name: "Rafael Mendez",
    bio: "Adventure foodie exploring coastal cuisine and mountain dining experiences. 🏔️🌊",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    location_city: "Barcelona",
    location_country: "Spain",
    is_master_bot: true,
    total_points: 9120,
    followers_count: 16700,
    following_count: 189,
  },
  {
    id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a", // Anika Kapoor
    email: "anika@fuzo.ai",
    username: "spice_scholar_anika",
    display_name: "Anika Kapoor",
    bio: "Spice scholar mastering Indian and Asian fusion cuisine with traditional techniques. 🌶️🍛",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    location_city: "Mumbai",
    location_country: "India",
    is_master_bot: true,
    total_points: 8750,
    followers_count: 14300,
    following_count: 267,
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3", // Omar Darzi
    email: "omar@fuzo.ai",
    username: "coffee_pilgrim_omar",
    display_name: "Omar Darzi",
    bio: "Coffee culture documentarian exploring specialty brewing and café spaces worldwide. ☕🌍",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    location_city: "Melbourne",
    location_country: "Australia",
    is_master_bot: true,
    total_points: 7980,
    followers_count: 12800,
    following_count: 312,
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e", // Jun Tanaka
    email: "jun@fuzo.ai",
    username: "zen_minimalist_jun",
    display_name: "Jun Tanaka",
    bio: "Zen minimalist mastering Japanese cuisine with traditional craft appreciation. 🍣🌸",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    location_city: "Tokyo",
    location_country: "Japan",
    is_master_bot: true,
    total_points: 9560,
    followers_count: 20100,
    following_count: 145,
  },
];

async function seedMasterBotUsers() {
  console.log("🌱 Seeding Master Bot users...\n");

  try {
    // Insert users one by one to handle errors better
    let successCount = 0;
    let errorCount = 0;

    for (const user of masterBotUsers) {
      try {
        const { data, error } = await supabase
          .from("users")
          .upsert(user, { onConflict: "id" });

        if (error) {
          console.error(`❌ Error inserting ${user.display_name}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully inserted ${user.display_name}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception inserting ${user.display_name}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n🎯 Summary:`);
    console.log(`   - Successfully inserted: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);

    // Verify the seeding
    const { data: verifyUsers, error: verifyError } = await supabase
      .from("users")
      .select("id, username, display_name, is_master_bot")
      .eq("is_master_bot", true);

    if (verifyError) {
      console.error("❌ Error verifying users:", verifyError);
      return;
    }

    console.log(`\n🎉 Verification:`);
    console.log(`   - Total Master Bot users: ${verifyUsers?.length || 0}`);
    verifyUsers?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.display_name} (@${user.username})`);
    });

    if (verifyUsers?.length === 7) {
      console.log("\n🚀 All 7 AI connoisseurs are now ready!");
      console.log("   The feed should now show real Master Bot posts instead of mock data.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

seedMasterBotUsers();
