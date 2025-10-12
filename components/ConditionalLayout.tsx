'use client';

import { usePathname } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenRoute = pathname === '/feed';

  if (isFullScreenRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <NavBar />
      <div className="min-h-[60vh]">{children}</div>
      <Footer />
    </>
  );
}