"use client";
import {
  AuthUser,
  getCurrentUser,
  signInWithGoogle,
  signOut,
} from "@/lib/auth/auth";
import { supabaseBrowser } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeAuth = async () => {
      const supabase = supabaseBrowser();
      
      // Get initial session directly from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Initial session check:', { session, error });
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name,
          avatar_url:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const supabase = supabaseBrowser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name,
          avatar_url:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [mounted]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = supabaseBrowser();
      const { data: profileData, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          username,
          display_name,
          first_name,
          last_name,
          avatar_url,
          cover_photo_url,
          location_city,
          location_state,
          location_country,
          is_verified
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching updated profile:', error);
        return;
      }

      if (profileData) {
        // Update the user object with fresh profile data
        setUser(prevUser => ({
          ...prevUser!,
          name: profileData.display_name || profileData.first_name || prevUser!.name,
          email: profileData.email || prevUser!.email,
          avatar_url: profileData.avatar_url || prevUser!.avatar_url,
          // Add any other fields you want to update
        }));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
