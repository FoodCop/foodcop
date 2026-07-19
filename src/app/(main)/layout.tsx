import type { ReactNode } from "react";
import SiteHeader from "@/components/header/SiteHeader";
import TakoWidget from "@/components/tako/TakoWidget";

// Shared layout for the main "app shell" pages (home, Scout, Discover, Trims)
// so the navbar + its Bootstrap-JS-driven offcanvas mount ONCE and persist
// across client-side navigation, instead of being torn down and rebuilt on
// every route change - the previous per-page <SiteHeader/> remount was racing
// with Bootstrap's async offcanvas close transition (removeChild errors /
// dead buttons after using the menu).
// The Google Maps JS API script used to load here - moved to the root
// layout (src/app/layout.tsx) so pages outside (main), like Profile, can use
// window.google.maps too.
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <TakoWidget />
    </>
  );
}
