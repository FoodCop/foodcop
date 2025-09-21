import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "../utils/supabase";
import { getOAuthRedirectUrl } from "../utils/authRedirect";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Profile {
  id: string;
  email: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  dietary_preferences?: string[];
  cuisine_preferences?: string[];
  total_points?: number;
  onboarding_completed?: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Get singleton Supabase client
  const supabase = getSupabaseClient();

  // Check for existing session on mount
  useEffect(() => {
    const getInitialSession = async () => {
      console.log("🔍 AuthContext: Getting initial session...");
      if (!supabase) {
        console.log("❌ AuthContext: No Supabase client available");
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ AuthContext: Session error:", error);
          setLoading(false);
          return;
        }

        console.log("🔍 AuthContext: Session data:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
        });
        
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("❌ AuthContext: Error getting initial session:", error);
      } finally {
        console.log("✅ AuthContext: Initial session check complete");
        setLoading(false);
      }
    };

    getInitialSession();
  }, [supabase]);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AuthContext: Auth state change:", { event, hasSession: !!session, hasUser: !!session?.user });
      
      // Prevent race conditions by checking if we're already loading
      if (loading) {
        console.log("⏳ AuthContext: Still loading initial session, skipping state change");
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ AuthContext: User signed in");
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        console.log("👋 AuthContext: User signed out");
        setUser(null);
        setProfile(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("🔄 AuthContext: Token refreshed");
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loading]);

  // Fetch user profile from backend
  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch("/make-server-5976446e/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) return;

    const redirectUrl = getOAuthRedirectUrl();
    console.log("🔗 OAuth redirect URL:", redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
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
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!supabase || !user) throw new Error("Not authenticated");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("No access token");

    const response = await fetch("/make-server-5976446e/auth/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update profile");
    }

    const data = await response.json();
    setProfile(data.profile);
  };

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
