import type { ReactNode } from 'react';
import SiteHeader from '@/components/header/SiteHeader';

// Profile pages use the same app navbar as everywhere else. Styled entirely by
// the master src/scss/main.scss build (incl. _profile.scss/_dna.scss partials).
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
