import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session and handle OAuth callback
    const getSession = async () => {
      // Check for OAuth tokens in URL (Supabase OAuth redirects use hash fragments)
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
              
              // IMPORTANT: Log current origin to debug redirect issues
              console.log('🔍 AuthProvider: Current origin:', window.location.origin);
              console.log('🔍 AuthProvider: Current pathname:', window.location.pathname);
              console.log('🔍 AuthProvider: Current full URL:', window.location.href);
              
              // Clean URL - remove hash fragments and navigate to /auth using React Router
              // AuthPage will handle the redirect to the appropriate page
              const currentPath = window.location.pathname;
              const targetPath = '/auth';
              
              // Clean the hash from URL first
              window.history.replaceState(null, '', window.location.pathname);
              
              // Only navigate if we're not already on /auth
              if (currentPath !== targetPath) {
                // Use React Router navigate to ensure proper routing
                // Use setTimeout to ensure React Router is ready
                setTimeout(() => {
                  navigate(targetPath, { replace: true });
                  console.log('✅ AuthProvider: Navigated to', targetPath, 'using React Router');
                }, 0);
              } else {
                // Already on /auth, just ensure hash is cleaned
                console.log('✅ AuthProvider: Already on /auth, hash cleaned');
              }
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
  }, [navigate]);

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