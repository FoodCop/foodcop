// Supabase MCP (Model Context Protocol) style helper endpoints
// Provides lightweight metadata & sampling access to database tables for design/dev tooling.
import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";

// Load environment variables from .env.local if available
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env.local" });
  dotenv.config(); // Also load .env as fallback
} catch {
  // dotenv not available or already loaded
}

// If running in Deno, declare global Deno type
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const app = new Hono();

// Acquire service role credentials (read/write metadata)
const SUPABASE_URL =
  typeof Deno !== "undefined"
    ? Deno.env.get("SUPABASE_URL")
    : process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  typeof Deno !== "undefined"
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
try {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log("✅ Supabase MCP: Admin client ready");
  } else {
    console.warn("⚠️ Supabase MCP: Missing URL or service role key");
  }
} catch (err) {
  console.error("❌ Supabase MCP: Failed to init client", err);
}

const KNOWN_TABLES = [
  "users",
  "user_relationships",
  "restaurants",
  "plates",
  "posts",
  "photos",
  "conversations",
  "conversation_participants",
  "messages",
  "likes",
  "comments",
  "reactions",
  "badges",
  "user_badges",
  "rewards",
  "redemptions",
  "notifications",
  "search_history",
  "master_bots",
  "recipes",
  "bot_prompts",
  "tags_map",
  "bot_history",
];

function requireClient(c: { json: Function }) {
  if (!supabase) {
    return c.json({ error: "Supabase admin client not configured" }, 503);
  }
  return null;
}

// List known tables (static list + attempt dynamic discover)
app.get("/make-server-5976446e/db/tables", async (c: { json: Function }) => {
  const clientError = requireClient(c);
  if (clientError) return clientError;
  let dynamic: any[] = [];
  try {
    // Attempt discovery via information_schema (may be blocked if RLS forbids)
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");
    if (!error && data) {
      dynamic = data.map((r: any) => r.table_name);
    }
  } catch (_) {
    /* ignore */
  }
  const unique = Array.from(new Set([...KNOWN_TABLES, ...dynamic])).sort();
  return c.json({ tables: unique, dynamic_detected: dynamic.length });
});

// Describe table columns
app.get(
  "/make-server-5976446e/db/describe/:table",
  async (c: { json: Function; req: any }) => {
    const clientError = requireClient(c);
    if (clientError) return clientError;
    const table = c.req.param("table");
    try {
      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name,data_type,is_nullable,column_default")
        .eq("table_name", table)
        .order("ordinal_position");
      if (error) {
        return c.json({ error: error.message }, 400);
      }
      if (!data || data.length === 0) {
        return c.json(
          { error: "Table not found or no visibility", table },
          404
        );
      }
      return c.json({ table, columns: data });
    } catch (err) {
      return c.json({ error: String(err), table }, 500);
    }
  }
);

// Sample rows
app.get(
  "/make-server-5976446e/db/sample/:table",
  async (c: { json: Function; req: any }) => {
    const clientError = requireClient(c);
    if (clientError) return clientError;
    const table = c.req.param("table");
    const limit = parseInt(c.req.query("limit") || "5");
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .limit(limit);
      if (error) return c.json({ error: error.message }, 400);
      return c.json({ table, count: data?.length || 0, rows: data });
    } catch (err) {
      return c.json({ error: String(err), table }, 500);
    }
  }
);

// Seed Master Bots endpoint
app.post(
  "/make-server-5976446e/db/seed/master-bots",
  async (c: { json: Function; req: any }) => {
    const clientError = requireClient(c);
    if (clientError) return clientError;

    try {
      const { seedMasterBots } = await import("../src/lib/seedMasterBots.js");
      await seedMasterBots();
      return c.json({
        success: true,
        message: "Master Bots seeded successfully",
      });
    } catch (err) {
      return c.json({ error: String(err), operation: "seed-master-bots" }, 500);
    }
  }
);

// Get Master Bot data endpoint
app.get(
  "/make-server-5976446e/db/master-bots",
  async (c: { json: Function }) => {
    const clientError = requireClient(c);
    if (clientError) return clientError;

    try {
      const { data: masterBots, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_master_bot", true);

      if (error) return c.json({ error: error.message }, 400);

      const { data: botConfigs, error: botError } = await supabase
        .from("master_bots")
        .select("*");

      if (botError) return c.json({ error: botError.message }, 400);

      return c.json({
        master_bots: masterBots,
        bot_configs: botConfigs,
        count: masterBots?.length || 0,
      });
    } catch (err) {
      return c.json({ error: String(err), operation: "get-master-bots" }, 500);
    }
  }
);

// Test database connection endpoint
app.get("/make-server-5976446e/db/health", async (c: { json: Function }) => {
  const clientError = requireClient(c);
  if (clientError) return clientError;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .single();
    if (error)
      return c.json({ error: error.message, status: "unhealthy" }, 400);

    return c.json({
      status: "healthy",
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return c.json({ error: String(err), status: "unhealthy" }, 500);
  }
});

export default app;
