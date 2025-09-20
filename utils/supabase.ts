import { createClient } from "@supabase/supabase-js";

// Global singleton to prevent multiple instances
declare global {
  var __fuzo_supabase_client: ReturnType<typeof createClient> | undefined;
}

// Singleton Supabase client to prevent multiple instances
export function getSupabaseClient() {
  // Check if we already have a client in the global scope
  if (typeof window !== "undefined" && window.__fuzo_supabase_client) {
    console.log("♻️ Reusing existing global Supabase client instance");
    return window.__fuzo_supabase_client;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log("🔍 Supabase environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    url: supabaseUrl?.substring(0, 30) + "...",
  });

  if (!supabaseUrl || !supabaseKey) {
    console.warn("❌ Supabase environment variables not configured", {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseKey ? "Set" : "Missing",
    });
    return null;
  }

  console.log("🔧 Creating new Supabase client instance");
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "fuzo-auth-token", // Custom storage key to avoid conflicts
    },
  });

  // Store in global scope to prevent multiple instances
  if (typeof window !== "undefined") {
    window.__fuzo_supabase_client = client;
    console.log("✅ Supabase client stored in global scope");
  }

  return client;
}
