import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
  reset: () => void;
}

/**
 * Global Authentication Store
 * Manages user authentication state across the application
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: true,
      error: null,

      setUser: (user) => set({ user, error: null }),
      
      setSession: (session) => set({ 
        session, 
        user: session?.user || null,
        error: null 
      }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error, loading: false }),
      
      signOut: () => set({ 
        user: null, 
        session: null, 
        error: null 
      }),
      
      reset: () => set({ 
        user: null, 
        session: null, 
        loading: true, 
        error: null 
      }),
    }),
    {
      name: 'fuzo-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist session data, not loading states
        session: state.session,
      }),
    }
  )
);
