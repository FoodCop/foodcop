"use client";

import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: React.ComponentProps<typeof Sonner>) => {
  // Use system theme detection instead of next-themes
  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group"
      position="center"
      richColors
      closeButton
      duration={4000}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "#D97706",
          "--success-border": "#B45309",
          "--error-bg": "#DC2626",
          "--error-border": "#B91C1C",
          "--warning-bg": "#FF6B35",
          "--warning-border": "#EA580C",
          "--info-bg": "#FF6B35",
          "--info-border": "#EA580C",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
