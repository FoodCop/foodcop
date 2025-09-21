import { createClient } from "@supabase/supabase-js";

type SupabaseClientInstance = ReturnType<typeof createClient>;

declare global {
  // eslint-disable-next-line no-var
  var __fuzo_supabase_client: SupabaseClientInstance | undefined;
}

const SUPABASE_STORAGE_KEY = "fuzo-auth-token";

export function getSupabaseClient(): SupabaseClientInstance | null {
  if (globalThis.__fuzo_supabase_client) {
    console.debug("[Supabase] Reusing existing client instance");
    return globalThis.__fuzo_supabase_client;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Supabase] Environment variables are missing", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
    });
    return null;
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: SUPABASE_STORAGE_KEY,
    },
  });

  globalThis.__fuzo_supabase_client = client;
  console.debug("[Supabase] Created client instance");
  return client;
}
