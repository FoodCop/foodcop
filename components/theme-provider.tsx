"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { useState, useEffect, useLayoutEffect } from "react";

// Use isomorphic layout effect for better SSR compatibility
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Double protection: check both mounted state and client environment
  useIsomorphicLayoutEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  // Force client-only rendering to prevent hydration mismatches
  if (!isClient || !mounted) {
    return (
      <div suppressHydrationWarning>
        {children}
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <NextThemesProvider 
        {...props}
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </div>
  );
}



