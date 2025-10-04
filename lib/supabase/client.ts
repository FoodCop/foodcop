import { createBrowserClient } from "@supabase/ssr";

export const supabaseBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "https://placeholder.supabase.co") {
    console.warn("Supabase not configured - using placeholder client");
    // Return a mock client for development
    return {
      auth: {
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        getSession: () => Promise.resolve({ data: { session: null } }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithOAuth: () =>
          Promise.resolve({ error: new Error("Supabase not configured") }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          data: [],
          error: new Error("Supabase not configured"),
        }),
        insert: () => ({ error: new Error("Supabase not configured") }),
        update: () => ({ error: new Error("Supabase not configured") }),
        delete: () => ({ error: new Error("Supabase not configured") }),
      }),
    } as any;
  }

  return createBrowserClient(url, key);
};
