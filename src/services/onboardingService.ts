import { supabase } from './supabase';
import type { LocationData, ExtractedPreferences } from '../types/onboarding';

export class OnboardingService {
  /**
   * Save user's location data
   */
  static async saveLocation(userId: string, location: LocationData) {
    const { error } = await supabase
      .from('users')
      .update({
        location_city: location.city,
        location_state: location.state,
        location_country: location.country,
        onboarding_step: 2
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Save user's basic profile
   */
  static async saveProfile(userId: string, profile: { firstName: string; avatarUrl?: string }) {
    const { error } = await supabase
      .from('users')
      .update({
        first_name: profile.firstName,
        display_name: profile.firstName,
        avatar_url: profile.avatarUrl,
        onboarding_step: 3
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Save extracted preferences from AI
   */
  static async savePreferences(userId: string, preferences: ExtractedPreferences) {
    const { error } = await supabase
      .from('users')
      .update({
        dietary_preferences: preferences.dietary_preferences,
        allergies: preferences.allergies,
        cuisine_preferences: preferences.cuisine_preferences,
        cuisine_dislikes: preferences.cuisine_dislikes,
        spice_tolerance: preferences.spice_tolerance,
        health_conscious: preferences.health_conscious,
        onboarding_step: 5,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
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
