import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { barlowCondensed, hankenGrotesk } from "@/lib/font";

// Master stylesheet (Bootstrap + our own variables/partials) - the ONE design
// system for the whole app. See docs/plan: components are being re-skinned
// off this instead of each template's own compiled CSS.
import "@/scss/main.scss";
// Foodix's compiled CSS - still needed by the homepage's home1/* sections,
// which haven't been re-skinned yet (lowest priority per the consolidation
// plan; homepage isn't broken today).
import "../../public/assets/css/default.css";
import "../../public/assets/css/style.css";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/free-mode";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FUZO",
  description: "Find your next favorite meal.",
};

// viewportFit: 'cover' lets full-bleed screens (Scout's map, Trims' reels)
// draw under the iOS notch/home-indicator so `env(safe-area-inset-*)` in
// their CSS actually resolves to something instead of 0.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${barlowCondensed.variable} ${hankenGrotesk.variable}`}>
      <body>
        <AuthProvider initialUser={data.user}>
          {children}
        </AuthProvider>
        {/* Plain global <script> (like every one of the source templates used),
            not a webpack module import - bootstrap's UMD bundle touches
            `document` at eval time, which breaks both SSR (static import) and
            webpack's dynamic-import chunk splitting (ChunkLoadError). This
            drives all our data-bs-toggle markup (offcanvas, dropdowns, etc). */}
        <Script src="/vendor/bootstrap.bundle.min.js" strategy="afterInteractive" />
        {/* Google Maps JS API - loaded here (root layout), not a route-group
            layout, so every page can use window.google.maps regardless of
            which layout it sits under. Used to live only in (main)/layout.tsx
            ("across all (main) routes"), which silently broke the Profile
            food map (a different route group, src/app/profile/layout.tsx)
            with zero error - the map div rendered at the right size, just
            with no google.maps loaded to actually draw into it. */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry,marker&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
