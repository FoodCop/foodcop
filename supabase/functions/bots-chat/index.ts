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
  const lastMessage = rateLimitCache.get(key) || 0;

  // 1 message per second per channel
  if (now - lastMessage < 1000) {
    return false;
  }

  rateLimitCache.set(key, now);
  return true;
}

// Timeout wrapper for OpenAI calls
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 2500,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

// Moderation check
function isUnsafeContent(text: string): boolean {
  const UNSAFE_PATTERNS = [
    /violence|harm|hurt|kill/i,
    /hate|racist|discrimination/i,
    /sexual|explicit|nsfw/i,
    /drugs|cocaine|heroin/i,
    /suicide|self.harm/i,
    /bomb|terrorist|attack/i,
  ];

  return UNSAFE_PATTERNS.some((pattern) => pattern.test(text));
}

// Enhanced topic classification
function classifyTopic(text: string): "food" | "non_food" | "unsafe" {
  if (isUnsafeContent(text)) return "unsafe";

  const FOOD_KEYWORDS = [
    "restaurant",
    "eat",
    "dish",
    "menu",
    "street food",
    "hawker",
    "cafe",
    "bakery",
    "patisserie",
    "sushi",
    "omakase",
    "bbq",
    "grill",
    "vegan",
    "vegetarian",
    "gluten",
    "dairy",
    "allergy",
    "halal",
    "kosher",
    "dessert",
    "pastry",
    "croissant",
    "taco",
    "biryani",
    "dosa",
    "chaat",
    "ramen",
    "pho",
    "kebab",
    "shawarma",
    "steak",
    "pizza",
    "pasta",
    "burger",
    "salad",
    "bowl",
    "nutrition",
    "calories",
    "recipe",
    "cooking",
    "chef",
    "cuisine",
    "flavor",
    "taste",
    "delicious",
    "yummy",
    "food",
    "meal",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "appetizer",
    "main course",
    "side dish",
    "beverage",
    "drink",
  ];

  const NON_FOOD_KEYWORDS = [
    "weather",
    "rain",
    "temperature",
    "forecast",
    "time",
    "clock",
    "news",
    "politics",
    "election",
    "stock",
    "market",
    "bitcoin",
    "match",
    "game",
    "football",
    "cricket",
    "basketball",
    "code",
    "bug",
    "programming",
    "homework",
    "math",
    "physics",
    "medicine",
    "diagnosis",
    "covid",
    "flu",
    "symptoms",
    "workout",
    "exercise",
    "travel visa",
    "flight",
    "hotel",
  ];

  const s = (text || "").toLowerCase();
  const foodHit = FOOD_KEYWORDS.some((k) => s.includes(k));
  const nonFoodHit = NON_FOOD_KEYWORDS.some((k) => s.includes(k));

  if (nonFoodHit && !foodHit) return "non_food";
  if (foodHit) return "food";
  if (s.trim().length < 3) return "non_food";
  if (s.includes("recommend") || s.includes("hungry")) return "food";

  return "non_food";
}

// Localized deflection with country support
function deflectAndPivot(
  botDisplay: string,
  specialty: string[],
  userText: string,
  userCountry?: string
): string {
  const NON_FOOD_HINTS: Record<string, Record<string, string>> = {
    weather: {
      IN: "For weather updates, try weather.gov.in",
      US: "For weather updates, try weather.gov",
      default: "For weather updates, try weather.com",
    },
    time: {
      default: "For local time, check time.is",
    },
    news: {
      IN: "For news, try thehindu.com or indianexpress.com",
      US: "For news, try reuters.com or cnn.com",
      default: "For news, try reuters.com",
    },
    sports: {
      default: "For scores, try espn.com",
    },
    finance: {
      default: "For markets, try finance.yahoo.com",
    },
    coding: {
      default: "For coding help, try Stack Overflow",
    },
    homework: {
      default: "For general study help, try khanacademy.org",
    },
    travel: {
      default: "For transit or routes, try Google Maps",
    },
    health: {
      default: "I can't provide medical advice",
    },
  };

  const s = (userText || "").toLowerCase();
  let deflect = "I'm here for food talk";

  for (const [category, countryMap] of Object.entries(NON_FOOD_HINTS)) {
    if (s.includes(category)) {
      deflect = countryMap[userCountry || "default"] || countryMap.default;
      break;
    }
  }

  const spec = (specialty?.[0] ?? "good eats").replace(/\_/g, " ");
  return `${deflect}. Meanwhile, how about a ${spec} tip?`;
}

// Fetch bot data with error handling
async function fetchBot(botUserId: string) {
  try {
    const id = botUserId.replace(/^mb_/, "");
    const { data, error } = await sb
      .from("master_bots")
      .select("id, bot_name, specialties")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching bot:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Exception fetching bot:", error);
    return null;
  }
}

// Enhanced OpenAI call with timeout and fallback
async function composeFoodReply(
  systemPrompt: string,
  userText: string
): Promise<string> {
  const fallbackResponse = "Here's a tasty idea near you!";

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ],
    max_tokens: 120,
    temperature: 0.5,
  };

  const openAICall = async () => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API error: ${res.status}`);
    }

    const j = await res.json();
    return j?.choices?.[0]?.message?.content?.trim() ?? fallbackResponse;
  };

  return withTimeout(openAICall(), 2500, fallbackResponse);
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
    await client.channel("messaging", channelId).sendMessage({
      text,
      user_id: botUserId,
    });

    return true;
  } catch (error) {
    console.error("Error sending message to Stream:", error);
    return false;
  }
}

// Main Edge Function
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

    if (event.type !== "message.new") {
      return new Response("ignored", { status: 200 });
    }

    const msg = event.message;
    if (!msg || msg.user?.id?.startsWith("mb_")) {
      return new Response("ignore-bot-msg", { status: 200 });
    }

    // Rate limiting check
    const channelId = event.channel?.id;
    if (!checkRateLimit(channelId)) {
      console.log("Rate limited for channel:", channelId);
      return new Response("rate-limited", { status: 200 });
    }

    // Find bot member in the channel
    const channel = event.channel || {};
    const members: any[] = channel.members || [];
    const botMember = members.find((m) => m.user?.id?.startsWith("mb_"));
    if (!botMember) return new Response("no-bot", { status: 200 });

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
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    });
  }
});
