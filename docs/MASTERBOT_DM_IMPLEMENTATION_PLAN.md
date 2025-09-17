# Masterbot DM System Implementation Plan
**Date**: January 2025  
**Priority**: High  
**Estimated Time**: 6-8 hours  

## 🎯 **Objective**
Implement a complete masterbot DM system where 7 AI food connoisseurs can DM users, send invites, and respond intelligently with food-focused conversations while politely deflecting off-topic queries.

---

## 📋 **Phase 1: Environment & Dependencies Setup** (1 hour)

### **1.1 Stream Chat Account Setup**
- [ ] Create Stream Chat account at [getstream.io](https://getstream.io)
- [ ] Create new app in Stream dashboard
- [ ] Note down `STREAM_KEY` and `STREAM_SECRET`
- [ ] Configure webhook endpoint (we'll set this up later)

### **1.2 Environment Variables**
Add to `.env.local`:
```bash
# Stream Chat Configuration
STREAM_KEY=your_stream_key_here
STREAM_SECRET=your_stream_secret_here
STREAM_WEBHOOK_SECRET=your_webhook_secret_here
TEST_USER_ID=test_user_123

# Existing Supabase vars (already configured)
VITE_SUPABASE_URL=https://lgladnskxmbkhcnrsfxv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for bot responses)
OPENAI_API_KEY=your_openai_key_here
```

### **1.3 Install Dependencies**
```bash
npm install stream-chat
npm install --save-dev @types/stream-chat
```

---

## 📋 **Phase 2: Database Schema Updates** (30 minutes)

### **2.1 Create Bot Prompts Table**
```sql
-- File: database/migrations/005_bot_prompts.sql
CREATE TABLE IF NOT EXISTS bot_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES master_bots(id) ON DELETE CASCADE,
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert system prompts for each masterbot
INSERT INTO bot_prompts (bot_id, system_prompt) VALUES
  ((SELECT id FROM master_bots WHERE display_name = 'Street Food'), 
   'You are Street Food, an expert in street food and hawker culture. Domain: FOOD ONLY — restaurants, dishes, street food, hawker, cafe, bakery, patisserie, sushi, omakase, bbq, grill, vegan, vegetarian, nutrition, tips. Rules: If user asks non-food questions, deflect politely and pivot to food. Keep replies ≤ 2 sentences. Be factual, specific, no hype.'),
  -- ... (repeat for all 7 bots)
;
```

### **2.2 Apply Migration**
```bash
# Apply via Supabase dashboard or CLI
supabase db push
```

---

## 📋 **Phase 3: Server-Side Bot Management** (2 hours)

### **3.1 Create Bot Invitation Script**
**File**: `src/bots/inviteMe.ts`
```typescript
/**
 * Masterbot DM Invitation System
 * - Upserts 7 bot users to Stream Chat
 * - Creates 1:1 channels and invites test user
 * - Sends opening messages from each bot
 * - Idempotent: safe to re-run
 */

import { StreamChat } from "stream-chat";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const {
  STREAM_KEY,
  STREAM_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TEST_USER_ID,
} = process.env as Record<string, string>;

if (!STREAM_KEY || !STREAM_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TEST_USER_ID) {
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
    .select("id, display_name, avatar_url, specialties");
  
  if (error) throw error;

  const users = (bots ?? []).map((b: any) => ({
    id: botUserId(b.id),
    name: b.display_name,
    image: b.avatar_url ?? undefined,
    ai_bot: true,
    specialties: b.specialties ?? [],
  }));

  if (users.length) {
    await server.upsertUsers(users);
    console.log(`✅ Upserted ${users.length} bot users to Stream Chat`);
  }
  
  return bots;
}

async function ensureInviteAndGreeting(bot: { id: string; display_name: string }) {
  const uidBot = botUserId(bot.id);
  const uidMe = TEST_USER_ID;

  // Create distinct 1:1 channel
  const channel = server.channel("messaging", {
    members: [uidBot, uidMe],
  });

  // Create if not exists
  await channel.create({ created_by_id: uidBot }).catch(() => void 0);

  // Check if user is already a member or invited
  const state = await channel.query({ watch: false, state: true });
  const members = state.members?.map((m: any) => m.user_id) ?? [];
  const invites = state.members?.filter((m: any) => m.user_id === uidMe && m.invited)?.length ?? 0;

  if (!members.includes(uidMe) && invites === 0) {
    await channel.inviteMembers([uidMe]);
    console.log(`📨 Invited ${uidMe} to chat with ${bot.display_name}`);
  }

  // Send opening message
  await channel
    .sendMessage({
      user_id: uidBot,
      text: `Hey! I'm ${bot.display_name}. Want to be food friends? I'll DM you daily picks & tips. 👋`,
    })
    .catch(() => void 0);
}

(async function run() {
  try {
    console.log("🚀 Starting masterbot DM setup...");
    const bots = await upsertBots();
    
    for (const bot of bots) {
      await ensureInviteAndGreeting(bot);
    }
    
    console.log(`✅ Setup complete! Invited ${TEST_USER_ID} to ${bots.length} bot DMs.`);
  } catch (error) {
    console.error("❌ Setup failed:", error);
  }
})();
```

### **3.2 Add Package.json Script**
```json
{
  "scripts": {
    "setup:masterbot-dms": "npx tsx src/bots/inviteMe.ts"
  }
}
```

---

## 📋 **Phase 4: Topic Classification & Guardrails** (1.5 hours)

### **4.1 Create Guardrails System**
**File**: `src/bots/guardrails.ts`
```typescript
export type Topic = "food" | "non_food" | "unsafe";

const NON_FOOD_HINTS: Record<string, string> = {
  weather: "For weather updates, try weather.com",
  time: "For local time, check time.is",
  news: "For news, check a trusted news site",
  sports: "For scores, try espn.com",
  finance: "For markets, try finance.yahoo.com",
  coding: "For coding help, try Stack Overflow",
  homework: "For general study help, try khanacademy.org",
  travel: "For transit or routes, try Google Maps",
  health: "I can't provide medical advice",
};

const FOOD_KEYWORDS = [
  "restaurant", "eat", "dish", "menu", "street food", "hawker", "cafe", "bakery", 
  "patisserie", "sushi", "omakase", "bbq", "grill", "vegan", "vegetarian", 
  "gluten", "dairy", "allergy", "halal", "kosher", "dessert", "pastry", 
  "croissant", "taco", "biryani", "dosa", "chaat", "ramen", "pho", "kebab", 
  "shawarma", "steak", "pizza", "pasta", "burger", "salad", "bowl", "nutrition", "calories"
];

const NON_FOOD_KEYWORDS = [
  "weather", "rain", "temperature", "forecast", "time", "clock", "news", 
  "politics", "election", "stock", "market", "bitcoin", "match", "game", 
  "football", "cricket", "basketball", "code", "bug", "programming", 
  "homework", "math", "physics", "medicine", "diagnosis", "covid", "flu", 
  "symptoms", "workout", "exercise", "travel visa", "flight", "hotel"
];

export function classifyTopic(text: string): Topic {
  const s = (text || "").toLowerCase();
  const foodHit = FOOD_KEYWORDS.some(k => s.includes(k));
  const nonFoodHit = NON_FOOD_KEYWORDS.some(k => s.includes(k));

  if (nonFoodHit && !foodHit) return "non_food";
  if (foodHit) return "food";
  if (s.trim().length < 3) return "non_food";
  if (s.includes("recommend") || s.includes("hungry")) return "food";
  
  return "non_food";
}

export function deflectionFor(text: string): string {
  const s = (text || "").toLowerCase();
  for (const [k, msg] of Object.entries(NON_FOOD_HINTS)) {
    if (s.includes(k)) return msg;
  }
  return "I'm here for food talk";
}

export function deflectAndPivot(botDisplay: string, specialty: string[], userText: string): string {
  const deflect = deflectionFor(userText);
  const spec = (specialty?.[0] ?? "good eats").replace(/\_/g, " ");
  return `${deflect}. Meanwhile, how about a ${spec} tip?`;
}
```

---

## 📋 **Phase 5: Supabase Edge Function for Bot Responses** (2 hours)

### **5.1 Create Edge Function**
**File**: `supabase/functions/bots-chat/index.ts`
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const STREAM_WEBHOOK_SECRET = Deno.env.get("STREAM_WEBHOOK_SECRET")!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Inline guardrails functions (same as above)
function classifyTopic(text: string): "food" | "non_food" | "unsafe" {
  // ... (copy from guardrails.ts)
}

function deflectAndPivot(botDisplay: string, specialty: string[], userText: string): string {
  // ... (copy from guardrails.ts)
}

async function fetchBot(botUserId: string) {
  const id = botUserId.replace(/^mb_/, "");
  const { data, error } = await sb
    .from("master_bots")
    .select("id, display_name, specialties")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function composeFoodReply(systemPrompt: string, userText: string): Promise<string> {
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText }
    ],
    max_tokens: 120,
    temperature: 0.5,
  };
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { 
      "content-type": "application/json", 
      "authorization": `Bearer ${OPENAI_API_KEY}` 
    },
    body: JSON.stringify(body)
  });
  
  const j = await res.json();
  return j?.choices?.[0]?.message?.content?.trim() ?? "Here's a tasty idea near you.";
}

Deno.serve(async (req) => {
  try {
    const event = await req.json();
    
    if (event.type !== "message.new") {
      return new Response("ignored", { status: 200 });
    }

    const msg = event.message;
    if (!msg || msg.user?.id?.startsWith("mb_")) {
      return new Response("ignore-bot-msg", { status: 200 });
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
    
    const systemPrompt = prompt?.system_prompt ?? `You are ${bot.display_name}, food-only. Keep it short.`;

    const text = String(msg.text || "");
    const topic = classifyTopic(text);

    let reply: string;
    if (topic !== "food") {
      reply = deflectAndPivot(bot.display_name, bot.specialties || [], text);
    } else {
      reply = await composeFoodReply(systemPrompt, text);
    }

    // Return response for Stream to process
    return new Response(JSON.stringify({ 
      action: "send", 
      user_id: botUserId, 
      text: reply 
    }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 200 });
  }
});
```

### **5.2 Deploy Edge Function**
```bash
supabase functions deploy bots-chat
```

---

## 📋 **Phase 6: Client-Side Integration** (1 hour)

### **6.1 Update ChatPage.tsx**
Add Stream Chat integration to existing chat system:

```typescript
// Add to components/ChatPage.tsx
import { StreamChat } from "stream-chat";
import { useEffect, useState } from "react";

// Add Stream client state
const [streamClient, setStreamClient] = useState<StreamChat | null>(null);
const [isStreamConnected, setIsStreamConnected] = useState(false);

// Initialize Stream Chat
useEffect(() => {
  const initStreamChat = async () => {
    const client = StreamChat.getInstance(import.meta.env.VITE_STREAM_KEY);
    
    try {
      // Connect as test user
      await client.connectUser(
        {
          id: import.meta.env.VITE_TEST_USER_ID,
          name: "Test User",
        },
        import.meta.env.VITE_STREAM_TOKEN // You'll need to generate this server-side
      );
      
      setStreamClient(client);
      setIsStreamConnected(true);
      
      // Auto-accept pending invites
      const pending = await client.queryChannels({ invite: "pending" });
      for (const ch of pending) {
        await ch.acceptInvite({ message: { text: "Accepted! 👋" } });
      }
      
    } catch (error) {
      console.error("Stream Chat connection failed:", error);
    }
  };

  initStreamChat();
}, []);

// Add Stream Chat UI integration
// (This will require integrating Stream's React components)
```

### **6.2 Add Stream Chat UI Components**
```bash
npm install @stream-io/stream-chat-react
```

---

## 📋 **Phase 7: Testing & Validation** (1 hour)

### **7.1 Test Checklist**
- [ ] Run `npm run setup:masterbot-dms` - should create bots and send invites
- [ ] Check Stream Chat dashboard - should see 7 bot users created
- [ ] Open chat UI - should see pending invites from all 7 bots
- [ ] Accept invites - should be able to chat with each bot
- [ ] Test food queries: "Best sushi in Tokyo?" → should get food-focused response
- [ ] Test off-topic queries: "What's the weather?" → should get deflection + food pivot
- [ ] Test edge cases: empty messages, very long messages, special characters

### **7.2 Debug Common Issues**
- **Bots not appearing**: Check Stream API keys and user creation
- **Invites not working**: Verify channel creation and member invitation logic
- **No responses**: Check Edge Function deployment and webhook configuration
- **Wrong responses**: Verify topic classification and system prompts

---

## 📋 **Phase 8: Production Polish** (30 minutes)

### **8.1 Error Handling**
- Add comprehensive error logging
- Implement retry logic for failed API calls
- Add user-friendly error messages

### **8.2 Performance Optimization**
- Cache bot responses for common queries
- Implement rate limiting for bot responses
- Add response time monitoring

### **8.3 Security**
- Validate webhook signatures
- Sanitize user input
- Implement request rate limiting

---

## 🚀 **Execution Order**

1. **Morning (2 hours)**: Phases 1-2 (Setup & Database)
2. **Mid-morning (2 hours)**: Phases 3-4 (Server Scripts & Guardrails)
3. **Afternoon (2 hours)**: Phases 5-6 (Edge Function & Client Integration)
4. **Late afternoon (1 hour)**: Phases 7-8 (Testing & Polish)

---

## 📊 **Success Metrics**

- ✅ 7 masterbots successfully created in Stream Chat
- ✅ Test user receives 7 DM invites
- ✅ All invites can be accepted and conversations started
- ✅ Food queries get relevant, helpful responses
- ✅ Off-topic queries get polite deflections with food pivots
- ✅ System handles edge cases gracefully
- ✅ Response time < 2 seconds for bot replies

---

## 🔧 **Troubleshooting Quick Reference**

| Issue | Solution |
|-------|----------|
| Stream API errors | Check API keys and permissions |
| Bot users not created | Verify Supabase connection and master_bots table |
| Invites not sent | Check channel creation logic and member invitation |
| No bot responses | Verify Edge Function deployment and webhook URL |
| Wrong topic classification | Review guardrails keywords and logic |
| OpenAI API errors | Check API key and rate limits |

---

**Next Steps**: Start with Phase 1 (Environment Setup) and work through each phase systematically. Each phase builds on the previous one, so don't skip ahead!
