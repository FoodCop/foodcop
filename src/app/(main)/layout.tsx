import type { ReactNode } from "react";
import Script from "next/script";
import SiteHeader from "@/components/header/SiteHeader";
import TakoWidget from "@/components/tako/TakoWidget";

// Shared layout for the main "app shell" pages (home, Scout, Discover, Trims)
// so the navbar + its Bootstrap-JS-driven offcanvas mount ONCE and persist
// across client-side navigation, instead of being torn down and rebuilt on
// every route change - the previous per-page <SiteHeader/> remount was racing
// with Bootstrap's async offcanvas close transition (removeChild errors /
// dead buttons after using the menu).
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* Google Maps JS API — loaded once here so ScoutView (and any other
          map feature) can access window.google.maps across all (main) routes */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry,marker&loading=async`}
        strategy="afterInteractive"
      />
      {children}
      <TakoWidget />
    </>
  );
}
