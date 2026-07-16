import type { ReactNode } from 'react';

// No route-specific CSS anymore - styled entirely by the master
// src/scss/main.scss build (incl. _profile.scss/_dna.scss partials) imported
// once in the root layout.
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
