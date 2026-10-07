import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/share/safeNext';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase is not configured, skip middleware
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoutes = ['/messages', '/dashboard', '/notifications', '/dna-quiz'];
  const isProtectedRoute =
    protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route)) ||
    request.nextUrl.pathname === '/profile';
  
  if (isProtectedRoute && !user) {
    // no user, potentially respond by redirecting the user to the login page
    // Remember where they were going (e.g. a shared recipe/trim link) so
    // login can send them straight back there.
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  
  // If user is logged in and tries to access login, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    const next = request.nextUrl.pathname === '/login' ? safeNextPath(request.nextUrl.searchParams.get('next')) : null;
    const url = request.nextUrl.clone();
    url.search = '';
    if (next) {
      const target = new URL(next, request.nextUrl.origin);
      url.pathname = target.pathname;
      url.search = target.search;
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
