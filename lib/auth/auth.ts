import { supabaseBrowser } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export async function signInWithGoogle() {
  const supabase = supabaseBrowser();
  
  // Use the improved redirect URL and options from auth flow docs
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Google OAuth error:', error);
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = supabaseBrowser();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
}

export function transformSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
}
