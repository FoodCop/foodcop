'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Trims now live in the dashboard's Trims tab. This route only keeps older
// shared links working: /trims#<id> -> /dashboard?tab=trims&trim=<id>.
export default function TrimsRedirect() {
  const router = useRouter();
  useEffect(() => {
    const id = window.location.hash.slice(1);
    router.replace(id ? `/dashboard?tab=trims&trim=${encodeURIComponent(id)}` : '/dashboard?tab=trims');
  }, [router]);
  return null;
}
