'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { OnboardingService, nextStep } from '@/lib/services/onboardingService';

// Existing accounts (client, 2026-10-18): people who joined before the new
// onboarding are asked once, on their next visit, for what it now needs -
// birth month/year, the current Terms / Privacy, and their roles. Checked once
// per browser session; new accounts are handled by the middleware instead.

const KEY = 'fz-catchup-checked';
const SKIP = /^\/(onboarding|login|auth|reset-password|terms|privacy)(\/|$)/;

export default function OnboardingCatchUp() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.is_anonymous || SKIP.test(pathname) || pathname === '/') return;
    try {
      if (sessionStorage.getItem(KEY) === user.id) return;
      sessionStorage.setItem(KEY, user.id);
    } catch {
      return; // no storage: don't risk asking on every page
    }
    let off = false;
    OnboardingService.load().then((res) => {
      if (off || !res.success || !res.data?.isOnboarded) return;
      if (nextStep(res.data) === 'done') return;
      router.push(`/onboarding?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
    });
    return () => {
      off = true;
    };
  }, [user, pathname, router]);

  return null;
}
