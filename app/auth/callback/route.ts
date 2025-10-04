import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log('Auth callback received:', { code: !!code, url: requestUrl.toString() });

  if (code) {
    // Create response first
    const redirectUrl = new URL("/auth-success", request.url);
    const response = NextResponse.redirect(redirectUrl);
    
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
              response.cookies.set(name, value, {
                ...options,
                httpOnly: false, // Important for client-side access
                secure: false, // Set to true in production with HTTPS
                sameSite: 'lax',
                path: '/'
              });
            });
          },
        },
      }
    );

    try {
      console.log('Exchanging code for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(new URL("/?error=auth_error", request.url));
      }

      if (data.user && data.session) {
        console.log("User authenticated successfully:", data.user.email);
        console.log("Session created:", !!data.session);
        
        // Update user profile information from Google OAuth
        try {
          const userMetadata = data.user.user_metadata || {};
          const updateData: any = {
            is_online: true,
            last_seen: new Date().toISOString()
          };

          // Update avatar if available from Google OAuth
          if (userMetadata.avatar_url || userMetadata.picture) {
            updateData.avatar_url = userMetadata.avatar_url || userMetadata.picture;
            console.log('Updating avatar URL from Google:', updateData.avatar_url);
          }

          // Update display name if not already set
          if (userMetadata.full_name || userMetadata.name) {
            const { data: existingUser } = await supabase
              .from('users')
              .select('display_name')
              .eq('id', data.user.id)
              .single();
            
            if (!existingUser?.display_name) {
              updateData.display_name = userMetadata.full_name || userMetadata.name;
              console.log('Updating display name from Google:', updateData.display_name);
            }
          }

          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', data.user.id);
          
          if (updateError) {
            console.error('Failed to update user profile:', updateError);
          } else {
            console.log('Updated user profile for:', data.user.email);
          }
        } catch (statusError) {
          console.error('Exception updating user profile:', statusError);
        }

        // Auto-friend all masterbots for new users
        try {
          // Check if user already has friends (not a new user)
          const { count: existingFriends } = await supabase
            .from('friend_requests')
            .select('*', { count: 'exact', head: true })
            .or(`requester_id.eq.${data.user.id},requested_id.eq.${data.user.id}`)
            .eq('status', 'accepted');

          if (existingFriends === 0) {
            console.log('New user detected, auto-friending masterbots for:', data.user.email);
            
            // Get all masterbot IDs
            const masterbotIds = [
              '86efa684-37ae-49bb-8e7c-2c0829aa6474', // adventure_rafa
              '0a1092da-dea6-4d32-ac2b-fe50a31beae3', // coffee_pilgrim_omar  
              '1b0f0628-295d-4a4a-85ca-48594eee15b3', // nomad_aurelia
              '2400b343-0e89-43f7-b3dc-6883fa486da3', // plant_pioneer_lila
              '78de3261-040d-492e-b511-50f71c0d9986', // sommelier_seb
              'f2e517b0-7dd2-4534-a678-5b64d4795b3a', // spice_scholar_anika
              '7cb0c0d0-996e-4afc-9c7a-95ed0152f63e'  // zen_minimalist_jun
            ];

            // Create accepted friend requests with all masterbots
            const friendRequests = masterbotIds.map(masterbotId => ({
              requester_id: data.user.id,
              requested_id: masterbotId,
              status: 'accepted',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));

            const { error: friendError } = await supabase
              .from('friend_requests')
              .insert(friendRequests);

            if (friendError) {
              console.error('Failed to auto-friend masterbots:', friendError);
            } else {
              console.log(`Successfully auto-friended ${masterbotIds.length} masterbots for new user`);
              
              // Update follower counts
              const { error: countError } = await supabase.rpc('update_friend_counts');
              if (countError) {
                console.error('Failed to update friend counts:', countError);
              }
            }
          } else {
            console.log('Existing user, skipping auto-friend masterbots');
          }
        } catch (masterbotError) {
          console.error('Exception auto-friending masterbots:', masterbotError);
        }
        
        // Manually set the session cookies
        const sessionCookies = [
          { name: 'sb-access-token', value: data.session.access_token },
          { name: 'sb-refresh-token', value: data.session.refresh_token }
        ];
        
        sessionCookies.forEach(({ name, value }) => {
          response.cookies.set(name, value, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });
        });
        
        console.log('Redirecting to auth success page');
        return response;
      } else {
        console.error('No user or session in response:', { user: !!data?.user, session: !!data?.session });
        return NextResponse.redirect(new URL("/?error=no_session", request.url));
      }
      
    } catch (error) {
      console.error("Auth callback exception:", error);
      return NextResponse.redirect(new URL("/?error=auth_exception", request.url));
    }
  }

  // If no code, redirect to home
  console.log('No auth code received, redirecting to home');
  return NextResponse.redirect(new URL("/", request.url));
}
