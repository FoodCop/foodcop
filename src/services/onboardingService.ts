import { supabase } from './supabase';
import type { LocationData, ExtractedPreferences } from '../types/onboarding';

export class OnboardingService {
  /**
   * Save user's country location (detected from geolocation)
   */
  static async saveLocation(userId: string, location: LocationData) {
    const { error } = await supabase
      .from('users')
      .update({
        location_country: location.country,
        onboarding_step: 1
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Save dietary preferences (Step 1) and complete onboarding
   */
  static async saveDietaryPreferences(
    userId: string,
    dietaryPreferences: string[]
  ) {
    const { error } = await supabase
      .from('users')
      .update({
        dietary_preferences: dietaryPreferences,
        onboarding_step: 2,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Skip onboarding - mark as completed without preferences
   */
  static async skipOnboarding(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 2
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Get user's onboarding status
   */
  static async getOnboardingStatus(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_step')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}
