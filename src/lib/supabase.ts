import { createClient } from "@supabase/supabase-js";

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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server client (service role)
export function sbService() {
  const { url, service } = safeServerEnv();
  return createClient(url, service);
}
