import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = [
  "/profile",
  "/chat-debug",
];

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);

  // Check if this is a protected route
  if (PROTECTED.some((p) => url.pathname.startsWith(p))) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll().map((cookie) => ({
                name: cookie.name,
                value: cookie.value,
              }));
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                req.cookies.set(name, value);
              });
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login with redirect back to current page
        const redirectUrl = new URL("/", req.url);
        redirectUrl.searchParams.set("redirect_to", url.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      // If there's an error, redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
