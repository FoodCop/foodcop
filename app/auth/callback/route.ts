import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log('Auth callback received:', { code: !!code, url: requestUrl.toString() });

  if (code) {
    const response = NextResponse.redirect(new URL("/auth-success", request.url));
    
    // Create supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    try {
      console.log('Exchanging code for session...');
      const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(new URL("/auth/signin?error=auth_error", request.url));
      }

      if (!authData.user || !authData.session) {
        console.error('No user or session in auth response');
        return NextResponse.redirect(new URL("/auth/signin?error=no_session", request.url));
      }

      console.log("User authenticated successfully:", {
        userId: authData.user.id,
        email: authData.user.email,
        sessionExists: !!authData.session
      });

      // Create user profile if they don't exist in our database
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id, display_name')
          .eq('id', authData.user.id)
          .single();

        // If user doesn't exist in our database (PGRST116 = no rows returned), create them
        if (profileError && profileError.code === 'PGRST116') {
          console.log('User not found in database, creating new user profile');
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              display_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
              username: authData.user.email?.split('@')[0] || `user_${authData.user.id.slice(0, 8)}`,
              avatar_url: authData.user.user_metadata?.avatar_url || authData.user.user_metadata?.picture,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
          } else {
            console.log('New user profile created successfully');
          }
        } else if (!profileError) {
          console.log('Existing user found in database');
        }
      } catch (profileError) {
        console.error('Exception checking/creating user profile:', profileError);
      }

      console.log('Redirecting to /auth-success');
      return response;
      
    } catch (error) {
      console.error("Auth callback exception:", error);
      return NextResponse.redirect(new URL("/auth/signin?error=auth_exception", request.url));
    }
  }

  // If no code, redirect to signin
  console.log('No auth code received, redirecting to signin');
  return NextResponse.redirect(new URL("/auth/signin?error=no_code", request.url));
}
