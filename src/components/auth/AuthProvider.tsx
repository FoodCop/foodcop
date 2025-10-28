import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and handle OAuth callback
    const getSession = async () => {
      // Check for OAuth tokens in URL
      const hash = window.location.hash.slice(1);
      if (hash.includes('access_token')) {
        console.log('🔑 AuthProvider: OAuth tokens detected in URL, processing...');
        
        // Extract tokens from URL
        let params;
        if (hash.includes('?')) {
          const [, paramString] = hash.split('?', 2);
          params = new URLSearchParams(paramString);
        } else if (hash.includes('auth')) {
          // Handle auth#access_token format
          const cleanParams = hash.replace('auth', '').replace(/^#/, '');
          params = new URLSearchParams(cleanParams);
        } else {
          params = new URLSearchParams(hash);
        }
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken) {
          console.log('🔑 AuthProvider: Setting session with OAuth tokens...');
          
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('❌ AuthProvider: Failed to set session:', error);
            } else if (data.session) {
              console.log('✅ AuthProvider: Session established from OAuth tokens');
              setSession(data.session);
              setUser(data.session.user);
              
              // Clean URL but don't redirect - let AuthPage handle the redirection
              // based on onboarding status
              const cleanUrl = window.location.pathname + '#auth';
              window.history.replaceState(null, '', cleanUrl);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('❌ AuthProvider: Session setup error:', err);
          }
        }
      }
      
      // Fallback to normal session check
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}