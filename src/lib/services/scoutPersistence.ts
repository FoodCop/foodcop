/**
 * SCOUT PERSISTENCE SERVICE
 * Ported from legacy/fuzoapp/src/features/scout/services/scoutPersistence.ts
 * Changes: uses createClient() from @/lib/supabase/client instead of legacy supabaseClient
 */

import { createClient } from '@/lib/supabase/client';

export interface ScoutFindData {
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  notes?: string;
  tags?: string[];
  photos?: string[];
  timings?: Record<string, string>;
  rating?: number;
}

export const ScoutPersistence = {
  async saveScoutFind(userId: string, find: ScoutFindData) {
    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const contentParts = [`New Discovery: ${find.name}`, find.category];
      if (find.notes) contentParts.push(find.notes);

      const { data: createdPost, error: postError } = await supabase.from('posts').insert({
        user_id: userId,
        content: contentParts.join('\n'),
        latitude: find.lat,
        longitude: find.lng,
        rating: find.rating || 0,
        images: find.photos || [],
        image_url: find.photos?.[0] || '',
        created_at: new Date().toISOString(),
      }).select('id').single();

      if (postError) {
        console.warn('Scout find post persistence skipped:', postError.message);
      }

      const { error: datasetError } = await supabase.from('fuzo_locations').insert({
        user_id: userId,
        source_post_id: createdPost?.id || null,
        location_name: find.name,
        restaurant_name: find.name,
        cuisine: find.category,
        latitude: find.lat,
        longitude: find.lng,
        address: find.address,
        notes: find.notes || '',
        tags: find.tags || [],
        photos: find.photos || [],
        timings: find.timings || {},
        rating: find.rating || 0,
      });

      if (datasetError) {
        console.warn('Scout find global dataset persistence failed:', datasetError.message);
      }

      return {
        success: !datasetError,
        error: datasetError?.message,
      };

    } catch (err) {
      console.error('Scout find persistence error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }
};
