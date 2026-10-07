import { createClient } from '../supabase/client';
import type { ServiceResult } from '../types/serviceResult';
import type { FoodCardRecord } from '../types/foodCard';
import type { AppItem } from '../../types/appItem';

// One highlight item is a lightweight pointer into content that already
// exists (a food_card or a saved_item) - id/image/title render the circle
// and the story-style viewer without a live re-fetch. `data` is a full
// snapshot of the source record at the time it was added, kept specifically
// so the viewer's "View Details" button can open the real, rich detail
// modal (ingredients/nutrition/etc.) without a second round-trip - and,
// for a `saved` item, without needing a visitor to have read access to
// someone else's saved_items row at view time.
export type HighlightItemRef =
  | { kind: 'card'; id: string; image: string; title: string; data: FoodCardRecord }
  | { kind: 'saved'; id: string; image: string; title: string; data: AppItem };

export interface ProfileHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_image_url: string | null;
  items: HighlightItemRef[];
  position: number;
  created_at: string;
  updated_at: string;
}

export const ProfileHighlightsService = {
  async listForUser(userId: string): Promise<ServiceResult<ProfileHighlight[]>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await supabase
      .from('profile_highlights')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data || []) as ProfileHighlight[] };
  },

  async create(params: { userId: string; title: string; items: HighlightItemRef[] }): Promise<ServiceResult<ProfileHighlight>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const { count } = await supabase
      .from('profile_highlights')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', params.userId);

    const { data, error } = await supabase
      .from('profile_highlights')
      .insert({
        user_id: params.userId,
        title: params.title,
        cover_image_url: params.items[0]?.image ?? null,
        items: params.items,
        position: count ?? 0,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as ProfileHighlight };
  },

  async update(id: string, patch: { title?: string; items?: HighlightItemRef[] }): Promise<ServiceResult<ProfileHighlight>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.items !== undefined) {
      row.items = patch.items;
      row.cover_image_url = patch.items[0]?.image ?? null;
    }

    const { data, error } = await supabase.from('profile_highlights').update(row).eq('id', id).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as ProfileHighlight };
  },

  async remove(id: string): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const { error } = await supabase.from('profile_highlights').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },
};

export default ProfileHighlightsService;
