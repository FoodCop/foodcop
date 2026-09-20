/**
 * ACTIVITY EVENT SERVICE
 * Best-effort writer for public.user_events (supabase/migrations/
 * 20260919000000_user_events.sql) - the behavioural signals the Profile KPI
 * engine (src/lib/profile/kpi) can't derive from existing tables. Never
 * throws and never blocks the UI: a tracking failure (including the table not
 * being migrated yet) must not break the action that triggered it. Respects the
 * user's "Use Activity for Matching" consent switch.
 */

import { createClient } from '@/lib/supabase/client';

export type ActivityEventType = 'card_viewed' | 'card_skipped' | 'search';

// Settings' "Use Activity for Matching" (user_settings.use_activity_for_ml)
// is a consent switch: when off, nothing here is recorded. Cached per user for
// the session; SettingsTab calls resetConsentCache() when the switch changes.
let consentCache: { userId: string; allowed: boolean } | null = null;

export const ActivityEventService = {
  resetConsentCache(): void {
    consentCache = null;
  },

  async track(params: {
    type: ActivityEventType;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const client = createClient();
      if (!client) return;
      const { data } = await client.auth.getUser();
      const userId = data?.user?.id;
      if (!userId) return;

      if (consentCache?.userId !== userId) {
        const { data: settings } = await client.from('user_settings').select('use_activity_for_ml').eq('user_id', userId).maybeSingle();
        consentCache = { userId, allowed: settings?.use_activity_for_ml ?? true };
      }
      if (!consentCache.allowed) return;

      const { error } = await client.from('user_events').insert({
        user_id: userId,
        event_type: params.type,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
        metadata: params.metadata ?? {},
      });
      if (error) console.warn('user_events insert failed:', error.message);
    } catch (err) {
      console.warn('user_events track failed:', err);
    }
  },
};
