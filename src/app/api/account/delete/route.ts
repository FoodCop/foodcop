import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient, type SupabaseClient } from '@supabase/supabase-js';

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
// from public.users(id) in turn - so this one call removes every database row.
//
// Uploaded files are NOT database rows, so they don't cascade: the three
// public buckets below are emptied first, otherwise a deleted user's photos
// and videos would stay reachable by URL indefinitely.

// Every bucket that stores files under a "<user id>/..." folder.
const USER_MEDIA_BUCKETS = ['profile-media', 'food-card-media', 'food-moments'] as const;
const MAX_FOLDER_DEPTH = 4;

async function listFilePaths(admin: SupabaseClient, bucket: string, prefix: string, depth = 0): Promise<string[]> {
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const paths: string[] = [];
  for (const entry of data) {
    const full = `${prefix}/${entry.name}`;
    // Folders come back without an id; recurse into them.
    if (entry.id === null && depth < MAX_FOLDER_DEPTH) paths.push(...(await listFilePaths(admin, bucket, full, depth + 1)));
    else if (entry.id !== null) paths.push(full);
  }
  return paths;
}

async function deleteUserMedia(admin: SupabaseClient, userId: string): Promise<void> {
  for (const bucket of USER_MEDIA_BUCKETS) {
    try {
      const paths = await listFilePaths(admin, bucket, userId);
      for (let i = 0; i < paths.length; i += 100) {
        await admin.storage.from(bucket).remove(paths.slice(i, i + 100));
      }
    } catch (err) {
      // A storage hiccup must not block the account deletion the user asked for.
      console.warn(`account delete: could not clear bucket ${bucket}:`, err);
    }
  }
}

export async function POST() {
  // CSRF guard: this is a cookie-authenticated, destructive POST. Browsers
  // always send Origin on cross-site POSTs, so refuse anything not from this host.
  const h = await headers();
  const origin = h.get('origin');
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

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

  await deleteUserMedia(adminClient, user.id);

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
