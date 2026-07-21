import type { ReactNode } from 'react';

// No route-specific CSS - styled entirely by the master src/scss/main.scss
// build imported once in the root layout. Deliberately no SiteHeader/
// TakoWidget chrome, matching /onboarding's own precedent for a focused,
// distraction-free multi-step flow.
export default function DnaQuizLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
