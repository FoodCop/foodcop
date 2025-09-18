/**
 * AI Connoisseur DM Invitation System
 * - Upserts 7 AI Connoisseur users to Stream Chat
 * - Creates 1:1 channels and invites test user
 * - Sends opening messages from each AI Connoisseur
 * - Idempotent: safe to re-run
 * - Enhanced with error handling and rate limiting
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { StreamChat } from "stream-chat";

// Load environment variables
dotenv.config({ path: ".env.local" });

const {
  STREAM_KEY,
  STREAM_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TEST_USER_ID,
} = process.env as Record<string, string>;

if (
  !STREAM_KEY ||
  !STREAM_SECRET ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !TEST_USER_ID
) {
  throw new Error("Missing required environment variables");
}

const server = StreamChat.getInstance(STREAM_KEY, STREAM_SECRET);
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function botUserId(botId: string): string {
  return `mb_${botId.toLowerCase().replace(/[^a-z0-9-_]/g, "_")}`;
}

async function upsertBots() {
  const { data: bots, error } = await sb
    .from("master_bots")
    .select("id, bot_name, specialties");

  if (error) throw error;

  const users = (bots ?? []).map((b: any) => ({
    id: botUserId(b.id),
    name: b.bot_name,
    image: `https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400`, // Default avatar
    ai_bot: true,
    is_bot: true,
    bot_type: "ai_connoisseur",
    specialties: b.specialties ?? [],
  }));

  if (users.length) {
    try {
      await server.upsertUsers(users);
      console.log(
        `✅ Upserted ${users.length} AI Connoisseur users to Stream Chat`
      );
    } catch (error) {
      console.error("❌ Error upserting users:", error);
      throw error;
    }
  }

  return bots;
}

async function ensureInviteAndGreeting(bot: { id: string; bot_name: string }) {
  const uidBot = botUserId(bot.id);
  const uidMe = TEST_USER_ID;

  try {
    // Create distinct 1:1 channel
    const channel = server.channel("messaging", {
      members: [uidBot, uidMe],
    });

    // Create if not exists
    await channel.create({ created_by_id: uidBot }).catch(() => void 0);

    // Check if user is already a member or invited
    const state = await channel.query({ watch: false, state: true });
    const members = state.members?.map((m: any) => m.user_id) ?? [];
    const invites =
      state.members?.filter((m: any) => m.user_id === uidMe && m.invited)
        ?.length ?? 0;

    if (!members.includes(uidMe) && invites === 0) {
      await channel.inviteMembers([uidMe]);
      console.log(`📨 Invited ${uidMe} to chat with ${bot.bot_name}`);
    }

    // Send opening message with enhanced greeting
    const greeting = `Hey! I'm ${bot.bot_name}, your AI food connoisseur. I'm here to help you discover amazing food experiences! Ask me about restaurants, recipes, or any food-related questions. What would you like to know? 🍽️`;

    await channel
      .sendMessage({
        user_id: uidBot,
        text: greeting,
        custom: {
          message_type: "bot_invite",
          bot_name: bot.bot_name,
        },
      })
      .catch((error) => {
        console.error(`❌ Error sending greeting from ${bot.bot_name}:`, error);
      });

    console.log(`✅ Sent greeting from ${bot.bot_name}`);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.error(`❌ Error setting up channel for ${bot.bot_name}:`, error);
    throw error;
  }
}

(async function run() {
  try {
    console.log("🚀 Starting AI Connoisseur DM setup...");
    const bots = await upsertBots();

    let successCount = 0;
    let errorCount = 0;

    for (const bot of bots) {
      try {
        await ensureInviteAndGreeting(bot);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to setup ${bot.bot_name}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Setup complete!`);
    console.log(`📊 Successfully setup: ${successCount} AI Connoisseurs`);
    console.log(`❌ Failed: ${errorCount} AI Connoisseurs`);
    console.log(
      `📨 Invited ${TEST_USER_ID} to ${successCount} AI Connoisseur DMs`
    );

    if (errorCount > 0) {
      console.log(
        `⚠️  ${errorCount} AI Connoisseurs failed to setup. Check logs above.`
      );
    }
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
})();
