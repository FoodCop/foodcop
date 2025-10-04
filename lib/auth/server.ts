import { supabaseServer } from "@/lib/supabase/server";
import { AuthUser } from "./auth";

export async function getServerUser(
  cookieStore: any
): Promise<AuthUser | null> {
  const supabase = await supabaseServer();

  try {
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
  } catch (error) {
    console.error("Error getting server user:", error);
    return null;
  }
}
