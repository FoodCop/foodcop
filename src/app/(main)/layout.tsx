import type { ReactNode } from "react";
import SiteHeader from "@/components/header/SiteHeader";

// Shared layout for the main app pages: the one app navbar (SiteHeader) mounts
// once and persists across client-side navigation. Tako, the AI assistant,
// opens from the FUZO logo in that navbar on every page.
// The Google Maps JS API script loads in the root layout (src/app/layout.tsx)
// so pages outside (main), like Profile, can use window.google.maps too.
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
