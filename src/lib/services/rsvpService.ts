/**
 * ============================================================================
 * RSVP SERVICE — Event Participation Engine
 * ============================================================================
 * 
 * This service manages the RSVP lifecycle for events shared in Chat.
 */

import { createClient } from '../supabase/client';

const supabase = createClient();

export interface EventRSVP {
  message_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
}

export const RSVPService = {
  /**
   * SECTION: RSVP Actions
   */
  async submitRSVP(messageId: string, userId: string, status: 'going' | 'maybe' | 'not_going') {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase unavailable' };

    const { data, error } = await client
      .from('event_rsvps')
      .upsert({
        message_id: messageId,
        user_id: userId,
        status,
      }, { onConflict: 'message_id,user_id' })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  async getRSVPsForMessage(messageId: string) {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase unavailable' };

    const { data, error } = await client
      .from('event_rsvps')
      .select('status, user_id')
      .eq('message_id', messageId);

    if (error) {
      return { success: false, error: error.message };
    }

    const counts = {
      going: data.filter((r: { status: string }) => r.status === 'going').length,
      maybe: data.filter((r: { status: string }) => r.status === 'maybe').length,
      not_going: data.filter((r: { status: string }) => r.status === 'not_going').length,
    };

    return { success: true, data: counts, raw: data };
  },

  /** How many meetups this user said they're "going" to (their own RSVPs - shown on their own profile). */
  async countGoing(userId: string): Promise<{ success: boolean; data?: number; error?: string }> {
    const client = supabase;
    if (!client) return { success: false, error: 'Supabase unavailable' };

    const { count, error } = await client
      .from('event_rsvps')
      .select('message_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'going');

    if (error) return { success: false, error: error.message };
    return { success: true, data: count ?? 0 };
  },
};
