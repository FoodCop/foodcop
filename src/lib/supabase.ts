import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../../utils/env";

// Helper to safely read server env vars
export function safeServerEnv() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    throw new Error("Missing Supabase secrets in server environment");
  }
  return { url, anon, service };
}

// Browser client (anon key only) - Using Vite environment variables
export function sbAnon() {
  // Try multiple ways to get environment variables
  const supabaseUrl =
    getEnv("VITE_SUPABASE_URL") || import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    getEnv("VITE_SUPABASE_ANON_KEY") || import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log("🔍 Supabase environment check:", {
    url: supabaseUrl ? "✅ Set" : "❌ Missing",
    anonKey: supabaseAnonKey ? "✅ Set" : "❌ Missing",
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "undefined",
    anonKeyValue: supabaseAnonKey
      ? `${supabaseAnonKey.substring(0, 10)}...`
      : "undefined",
    importMetaEnv: {
      url: import.meta.env.VITE_SUPABASE_URL ? "✅" : "❌",
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅" : "❌",
    },
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables:");
    console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
    console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅" : "❌");
    console.error(
      "Available env vars:",
      Object.keys(import.meta.env).filter((k) => k.startsWith("VITE_"))
    );
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server client (service role)
export function sbService() {
  const { url, service } = safeServerEnv();
  return createClient(url, service);
}
