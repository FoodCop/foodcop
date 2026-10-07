import type { ReactNode } from 'react';

// Profile pages have no app navbar (client request) - the hero card's own back
// button handles navigation. Styled entirely by the master src/scss/main.scss
// build (incl. _profile.scss/_dna.scss partials).
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
