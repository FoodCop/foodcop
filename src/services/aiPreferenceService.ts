import { supabase } from './supabase';
import type { QuestionResponse, ExtractedPreferences } from '../types/onboarding';

export class AIPreferenceService {
  /**
   * Extract preferences from question responses using OpenAI
   */
  static async extractPreferences(responses: QuestionResponse[]): Promise<ExtractedPreferences> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/onboarding-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ responses })
      });

      if (!response.ok) {
        throw new Error('Failed to extract preferences');
      }

      const data = await response.json();
      return data.preferences;
    } catch (error) {
      console.error('Error extracting preferences:', error);
      throw error;
    }
  }
}
