import { supabase } from './supabaseClient';

type AuthLikeUser = {
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

interface UserProfileServiceResult {
  success: boolean;
  error?: string;
}

const toSafeString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const deriveUsername = (email: string | undefined): string | null => {
  if (!email) return null;
  const base = email.split('@')[0] || '';
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  return cleaned.length > 0 ? cleaned.slice(0, 32) : null;
};

export const UserProfileService = {
  async ensureCurrentUserProfile(authUser: AuthLikeUser | null): Promise<UserProfileServiceResult> {
    if (!authUser?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    const metadata = authUser.user_metadata || {};
    const displayName =
      toSafeString(metadata.full_name)
      || toSafeString(metadata.name)
      || toSafeString(metadata.user_name)
      || toSafeString(metadata.username);

    const username = toSafeString(metadata.username) || deriveUsername(authUser.email);

    const { error } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email || null,
        display_name: displayName,
        username,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
