import { createClient } from '../supabase/client';
import type { ServiceResult } from '../types/serviceResult';

export type FoodMomentType = 'food' | 'place' | 'memory';

export interface FoodMoment {
  id: string;
  user_id: string;
  moment_type: FoodMomentType;
  title: string;
  image_url: string;
  position: number;
  created_at: string;
}

export const MOMENT_TYPE_LABEL: Record<FoodMomentType, string> = {
  food: 'Fav Food',
  place: 'Fav Place',
  memory: 'Memory',
};

export const FoodMomentsService = {
  async listForUser(userId: string): Promise<ServiceResult<FoodMoment[]>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const { data, error } = await supabase
      .from('food_moments')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data || []) as FoodMoment[] };
  },

  async create(params: { userId: string; title: string; imageUrl: string; momentType: FoodMomentType }): Promise<ServiceResult<FoodMoment>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const { count } = await supabase
      .from('food_moments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', params.userId);

    const { data, error } = await supabase
      .from('food_moments')
      .insert({
        user_id: params.userId,
        title: params.title,
        image_url: params.imageUrl,
        moment_type: params.momentType,
        position: count ?? 0,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as FoodMoment };
  },

  async remove(id: string): Promise<ServiceResult<null>> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Supabase is not configured' };

    const { error } = await supabase.from('food_moments').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, data: null };
  },
};

export default FoodMomentsService;
