import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const STREAM_WEBHOOK_SECRET = Deno.env.get("STREAM_WEBHOOK_SECRET")!;
const STREAM_KEY = Deno.env.get("STREAM_KEY")!;
const STREAM_SECRET = Deno.env.get("STREAM_SECRET")!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Rate limiting cache (in production, use Redis/Upstash)
const rateLimitCache = new Map<string, number>();

// Webhook signature verification
async function verifyStreamSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

// Rate limiting check
function checkRateLimit(channelId: string): boolean {
  const key = `rl:${channelId}`;
  const now = Date.now();
  const lastRequest = rateLimitCache.get(key) || 0;
  const timeDiff = now - lastRequest;

  if (timeDiff < 2000) {
    // 2 second rate limit
    return false;
  }

  rateLimitCache.set(key, now);
  return true;
}

// Fetch bot data from database
async function fetchBot(botUserId: string) {
  try {
    const { data, error } = await sb
      .from("master_bots")
      .select("*")
      .eq("stream_user_id", botUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching bot:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchBot:", error);
    return null;
  }
}

// Classify message topic for bot responses
function classifyTopic(text: string): string {
  const lowerText = text.toLowerCase();

  // Unsafe content detection
  const unsafePatterns = [
    /violence|fight|attack|hurt|kill/i,
    /hate|racist|discriminat/i,
    /sexual|explicit|nsfw/i,
    /illegal|drug|weapon/i,
  ];

  if (unsafePatterns.some((pattern) => pattern.test(lowerText))) {
    return "unsafe";
  }

  // Food-related keywords
  const foodKeywords = [
    "food", "eat", "restaurant", "recipe", "cook", "kitchen", "meal", "dinner",
    "lunch", "breakfast", "snack", "taste", "flavor", "ingredient", "dish",
    "cuisine", "chef", "menu", "delicious", "yummy", "tasty", "hungry",
    "pizza", "pasta", "burger", "salad", "soup", "dessert", "cake", "bread",
    "meat", "chicken", "beef", "fish", "vegetable", "fruit", "spice", "herb"
  ];

  const hasFoodKeywords = foodKeywords.some(keyword => 
    lowerText.includes(keyword)
  );

  return hasFoodKeywords ? "food" : "other";
}

// Deflect non-food topics and pivot to food
function deflectAndPivot(
  botName: string,
  specialties: string[],
  userMessage: string,
  userCountry?: string
): string {
  const specialty = specialties[0] || "food";
  const country = userCountry ? ` in ${userCountry}` : "";
  
  const responses = [
    `That's interesting! As a ${specialty} expert, I'd love to talk about amazing ${specialty}${country} instead. What's your favorite ${specialty}?`,
    `I'm all about ${specialty}! Let's chat about the best ${specialty} spots${country}. What do you think?`,
    `As a ${specialty} connoisseur, I'm curious about your ${specialty} preferences${country}. Tell me more!`,
    `That's cool! But I'm really passionate about ${specialty}${country}. What's your go-to ${specialty}?`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// Compose food-related reply using OpenAI
async function composeFoodReply(
  systemPrompt: string,
  userText: string
): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'd love to help with that!";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "I'm having trouble thinking right now, but I'd love to chat about food!";
  }
}

// Send message to Stream Chat
async function sendStreamMessage(
  channelId: string,
  botUserId: string,
  text: string
): Promise<boolean> {
  try {
    // Create Stream Chat client
    const StreamChat = (await import("https://esm.sh/stream-chat@9.19.1"))
      .StreamChat;
    const client = StreamChat.getInstance(STREAM_KEY, STREAM_SECRET);

    // Send message
    await client.sendMessage({
      channel_id: channelId,
      user_id: botUserId,
      text: text,
    });

    return true;
  } catch (error) {
    console.error("Error sending message to Stream:", error);
    return false;
  }
}

// Main Edge Function - Now handles all Stream Chat events
Deno.serve(async (req) => {
  try {
    // Verify webhook signature
    const signature =
      req.headers.get("x-signature") || req.headers.get("x-stream-signature");
    const body = await req.clone().text();

    if (!verifyStreamSignature(body, signature || "", STREAM_WEBHOOK_SECRET)) {
      console.error("Invalid webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Stream Chat webhook event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "message.new":
        return await handleMessageNew(event);
      
      case "user.presence.changed":
        return await handleUserPresenceChanged(event);
      
      case "channel.updated":
        return await handleChannelUpdated(event);
      
      case "member.added":
        return await handleMemberAdded(event);
      
      case "member.removed":
        return await handleMemberRemoved(event);
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response("ignored", { status: 200 });
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    });
  }
});

// Handle new message events
async function handleMessageNew(event: any): Promise<Response> {
  const msg = event.message;
  
  // Skip bot messages
  if (!msg || msg.user?.id?.startsWith("mb_")) {
    return new Response("ignore-bot-msg", { status: 200 });
  }

  // Rate limiting check
  const channelId = event.channel?.id;
  if (!checkRateLimit(channelId)) {
    console.log("Rate limited for channel:", channelId);
    return new Response("rate-limited", { status: 200 });
  }

  // Check if there's a bot in the channel
  const channel = event.channel || {};
  const members: any[] = channel.members || [];
  const botMember = members.find((m) => m.user?.id?.startsWith("mb_"));
  
  if (!botMember) {
    // No bot in channel, just log the message
    console.log("User message in channel without bot:", {
      channelId,
      userId: msg.user?.id,
      message: msg.text
    });
    return new Response("no-bot", { status: 200 });
  }

  // Handle bot response
  const botUserId = botMember.user.id as string;
  const bot = await fetchBot(botUserId);
  if (!bot) return new Response("bot-not-found", { status: 200 });

  // Load system prompt
  const { data: prompt } = await sb
    .from("bot_prompts")
    .select("system_prompt")
    .eq("bot_id", bot.id)
    .maybeSingle();

  const systemPrompt =
    prompt?.system_prompt ??
    `You are ${bot.bot_name}, a food expert. Keep responses under 2 sentences and food-focused.`;

  const text = String(msg.text || "");
  const topic = classifyTopic(text);

  let reply: string;

  if (topic === "unsafe") {
    reply = "I can't help with that. Let's talk about food instead!";
  } else if (topic !== "food") {
    // Get user country from profile if available
    const userCountry = msg.user?.country || undefined;
    reply = deflectAndPivot(
      bot.bot_name,
      bot.specialties || [],
      text,
      userCountry
    );
  } else {
    reply = await composeFoodReply(systemPrompt, text);
  }

  // Send message to Stream Chat
  const messageSent = await sendStreamMessage(channelId, botUserId, reply);

  if (!messageSent) {
    console.error("Failed to send message to Stream Chat");
    return new Response("send-failed", { status: 500 });
  }

  // Log metrics
  console.log(
    JSON.stringify({
      event: "bot_reply_sent",
      bot_id: bot.id,
      channel_id: channelId,
      topic: topic,
      response_time: Date.now(),
    })
  );

  return new Response("success", { status: 200 });
}

// Handle user presence changes
async function handleUserPresenceChanged(event: any): Promise<Response> {
  console.log("User presence changed:", {
    userId: event.user?.id,
    status: event.user?.status
  });
  
  // You can add custom logic here for presence changes
  // For example, update user status in your database
  
  return new Response("success", { status: 200 });
}

// Handle channel updates
async function handleChannelUpdated(event: any): Promise<Response> {
  console.log("Channel updated:", {
    channelId: event.channel?.id,
    updates: event.channel
  });
  
  // You can add custom logic here for channel updates
  // For example, sync channel data with your database
  
  return new Response("success", { status: 200 });
}

// Handle member added to channel
async function handleMemberAdded(event: any): Promise<Response> {
  console.log("Member added:", {
    channelId: event.channel?.id,
    userId: event.user?.id,
    memberId: event.member?.user_id
  });
  
  // You can add custom logic here for new members
  // For example, send welcome messages or update permissions
  
  return new Response("success", { status: 200 });
}

// Handle member removed from channel
async function handleMemberRemoved(event: any): Promise<Response> {
  console.log("Member removed:", {
    channelId: event.channel?.id,
    userId: event.user?.id,
    memberId: event.member?.user_id
  });
  
  // You can add custom logic here for removed members
  // For example, cleanup or notifications
  
  return new Response("success", { status: 200 });
}