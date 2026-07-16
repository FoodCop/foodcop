import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(url && anonKey);

// Returns null until NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set (new project
// credentials pending) - callers must handle the null case rather than crash.
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(url!, anonKey!);
}
