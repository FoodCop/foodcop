import { useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { AuthUser } from '../../features/auth/types/auth';

const isOnboardingCompleted = (user: AuthUser | null | undefined): boolean => {
  const metadata = user?.user_metadata;
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  return Boolean(
    (metadata as Record<string, unknown>).onboarding_completed
    || (metadata as Record<string, unknown>).has_completed_onboarding,
  );
};

export const useAuthSessionSync = ({
  setAuthBooting,
  setIsAuthenticated,
  setAuthUser,
  setShowAuth,
  setHasCompletedOnboarding,
}: {
  setAuthBooting: (value: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  setAuthUser: (value: AuthUser | null) => void;
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
      const completedOnboarding = isOnboardingCompleted(data.session?.user);
      setIsAuthenticated(hasSession);
      setAuthUser(data.session?.user ?? null);
      setHasCompletedOnboarding(hasSession && completedOnboarding);
      setShowAuth(hasSession && !completedOnboarding);
      setAuthBooting(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = !!session;
      const completedOnboarding = isOnboardingCompleted(session?.user);
      setIsAuthenticated(hasSession);
      setAuthUser(session?.user ?? null);
      setHasCompletedOnboarding(hasSession && completedOnboarding);
      setShowAuth(hasSession && !completedOnboarding);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setAuthBooting, setAuthUser, setHasCompletedOnboarding, setIsAuthenticated, setShowAuth]);
};
