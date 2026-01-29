"use client";

import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  // Use system theme detection instead of next-themes
  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      duration={4000}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "#ffe838",
          "--success-border": "#ffd600",
          "--error-bg": "#DC2626",
          "--error-border": "#B91C1C",
          "--warning-bg": "#FFC909",
          "--warning-border": "#E6B508",
          "--info-bg": "#FFC909",
          "--info-border": "#E6B508",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
