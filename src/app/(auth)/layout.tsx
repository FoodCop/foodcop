import type { ReactNode } from 'react';

// No route-specific CSS anymore - styled entirely by the master
// src/scss/main.scss build imported once in the root layout.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
