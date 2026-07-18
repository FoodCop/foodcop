import { NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

// Real account deletion (closes the Settings "Delete Account" gap - it used
// to just show a toast). The calling user is identified server-side from
// their session cookie via the anon-key server client (never trust a
// client-supplied user id for something this destructive), then the actual
// deletion runs through supabase.auth.admin.deleteUser() with the
// service-role key - only reachable from this Route Handler, never exposed
// to the browser. public.users.id REFERENCES auth.users(id) ON DELETE
// CASCADE (supabase/migrations/20260715020000_app_users_taste_profiles_stats.sql),
// and every dependent table (food_cards, taste_profiles, posts,
// fuzo_locations, saved_items, points_ledger, friend_requests, ...) cascades
// from public.users(id) in turn - so this one call is a real, complete
// deletion, not a partial one that leaves orphaned rows.
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Account deletion is not configured on the server.' }, { status: 500 });
  }

  const adminClient = createServiceRoleClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
