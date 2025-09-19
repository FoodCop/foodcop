import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Master Bot configurations
const masterBots = [
  {
    id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    username: "spice_scholar_anika",
    display_name: "Anika Kapoor",
  },
  {
    id: "78de3261-040d-492e-b511-50f71c0d9986",
    username: "sommelier_seb",
    display_name: "Sebastian LeClair",
  },
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    username: "plant_pioneer_lila",
    display_name: "Lila Cheng",
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    username: "zen_minimalist_jun",
    display_name: "Jun Tanaka",
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    username: "coffee_pilgrim_omar",
    display_name: "Omar Darzi",
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    username: "adventure_rafa",
    display_name: "Rafael Mendez",
  },
  {
    id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
  },
];

// Function to upload image to Supabase Storage
async function uploadImageToStorage(localPath, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(localPath);

    const { data, error } = await supabase.storage
      .from("master-bot-posts")
      .upload(storagePath, fileBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error uploading ${storagePath}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("master-bot-posts")
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error reading file ${localPath}:`, error.message);
    return null;
  }
}

// Function to determine content type from post content
function getContentType(content) {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes("pro tip") || lowerContent.includes("tip:")) {
    return "tip";
  } else if (
    lowerContent.includes("learned") ||
    lowerContent.includes("discovered") ||
    lowerContent.includes("story")
  ) {
    return "story";
  } else if (
    lowerContent.includes("while") ||
    lowerContent.includes("traveling") ||
    lowerContent.includes("adventure")
  ) {
    return "travel";
  } else if (
    lowerContent.includes("philosophy") ||
    lowerContent.includes("tradition") ||
    lowerContent.includes("essence")
  ) {
    return "philosophy";
  } else {
    return "review";
  }
}

// Function to process posts for a bot
async function processBotPosts(bot) {
  console.log(`\n🌍 Processing posts for ${bot.display_name}...`);

  // Load posts from JSON file
  const postsFile = path.join(
    __dirname,
    `../public/masterbot-posts/${bot.username}-posts.json`
  );

  if (!fs.existsSync(postsFile)) {
    console.log(`   ⚠️  No posts file found for ${bot.username}`);
    return;
  }

  const postsData = JSON.parse(fs.readFileSync(postsFile, "utf8"));
  const posts = postsData;

  console.log(`   📊 Found ${posts.length} posts to process`);

  // Create storage bucket if it doesn't exist
  const { error: bucketError } = await supabase.storage.createBucket(
    "master-bot-posts",
    {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      fileSizeLimit: 5242880, // 5MB
    }
  );

  if (bucketError && bucketError.message !== "Bucket already exists") {
    console.error("❌ Error creating storage bucket:", bucketError.message);
  }

  const processedPosts = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`   📝 Processing post ${i + 1}/${posts.length}: ${post.id}`);

    // Upload image to Supabase Storage
    let imageUrl = null;
    if (post.imageLocalPath && fs.existsSync(post.imageLocalPath)) {
      const storagePath = `${bot.username}/${path.basename(
        post.imageLocalPath
      )}`;
      imageUrl = await uploadImageToStorage(post.imageLocalPath, storagePath);

      if (imageUrl) {
        console.log(`   📸 Uploaded image: ${storagePath}`);
      }
    }

    // Prepare post data for database
    const postData = {
      master_bot_id: bot.id,
      title: post.title,
      content: post.content,
      image_url: imageUrl,
      image_storage_path: imageUrl
        ? `${bot.username}/${path.basename(post.imageLocalPath)}`
        : null,
      restaurant_id: post.restaurant.id,
      restaurant_name: post.restaurant.name,
      restaurant_location: post.restaurant.location,
      restaurant_rating: post.restaurant.rating,
      restaurant_price_range: post.restaurant.priceRange,
      restaurant_cuisine: post.restaurant.cuisine,
      tags: post.tags,
      engagement_likes: post.engagement.likes,
      engagement_comments: post.engagement.comments,
      engagement_shares: post.engagement.shares,
      personality_trait: post.personality,
      content_type: getContentType(post.content),
      is_published: true,
      created_at: post.createdAt,
    };

    processedPosts.push(postData);
  }

  // Insert posts into database
  console.log(
    `   💾 Inserting ${processedPosts.length} posts into database...`
  );

  const { data, error } = await supabase
    .from("master_bot_posts")
    .insert(processedPosts)
    .select();

  if (error) {
    console.error(
      `   ❌ Error inserting posts for ${bot.display_name}:`,
      error.message
    );
  } else {
    console.log(
      `   ✅ Successfully inserted ${data.length} posts for ${bot.display_name}`
    );
  }

  return processedPosts.length;
}

// Main function
async function uploadPostsToSupabase() {
  console.log("🚀 Starting upload of master bot posts to Supabase...");

  try {
    // First, run the migration
    console.log("📋 Running database migration...");
    const migrationFile = path.join(
      __dirname,
      "../database/migrations/20250120_create_master_bot_posts.sql"
    );
    const migrationSQL = fs.readFileSync(migrationFile, "utf8");

    const { error: migrationError } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (migrationError) {
      console.error("❌ Migration error:", migrationError.message);
      // Continue anyway, table might already exist
    } else {
      console.log("✅ Migration completed successfully");
    }

    let totalPosts = 0;

    // Process each bot
    for (const bot of masterBots) {
      const postCount = await processBotPosts(bot);
      totalPosts += postCount || 0;
    }

    console.log(
      `\n🎉 Successfully processed ${totalPosts} posts across all master bots!`
    );

    // Get final statistics
    const { data: stats } = await supabase
      .from("master_bot_posts")
      .select("master_bot_id, content_type")
      .eq("is_published", true);

    if (stats) {
      const byBot = {};
      const byType = {};

      stats.forEach((post) => {
        byBot[post.master_bot_id] = (byBot[post.master_bot_id] || 0) + 1;
        byType[post.content_type] = (byType[post.content_type] || 0) + 1;
      });

      console.log("\n📊 Final Statistics:");
      console.log(`   Total posts in database: ${stats.length}`);
      console.log("   Posts by bot:", byBot);
      console.log("   Posts by type:", byType);
    }
  } catch (error) {
    console.error("❌ Error during upload process:", error.message);
    process.exit(1);
  }
}

// Run the script
uploadPostsToSupabase().catch(console.error);
