import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

export const useAuthSessionSync = ({
  setAuthBooting,
  setIsAuthenticated,
  setAuthUser,
  setShowAuth,
  setHasCompletedOnboarding,
}: {
  setAuthBooting: (value: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  setAuthUser: (value: any) => void;
  setShowAuth: (value: boolean) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
}) => {
  useEffect(() => {
    if (!supabase) {
      setAuthBooting(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const hasSession = !!data.session;
      setIsAuthenticated(hasSession);
      setAuthUser(data.session?.user ?? null);
      if (hasSession) {
        setShowAuth(false);
        setHasCompletedOnboarding(true);
      }
      setAuthBooting(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = !!session;
      setIsAuthenticated(hasSession);
      setAuthUser(session?.user ?? null);
      if (hasSession) {
        setShowAuth(false);
        setHasCompletedOnboarding(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setAuthBooting, setAuthUser, setHasCompletedOnboarding, setIsAuthenticated, setShowAuth]);
};
