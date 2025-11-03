import { supabase } from './supabase';
import type { 
  UserProfile, 
  ProfileUpdateParams, 
  ProfileResponse,
  UserPreferences
} from '../types/profile';
import { AuthService } from './authService';

/**
 * Profile service for user profile management
 * Provides operations for updating and retrieving user profile data
 */
export class ProfileService {
  /**
   * Get current user's profile
   */
  static async getProfile(): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('👤 Getting profile for user:', user.id);

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        throw new Error(error.message);
      }

      // If no profile exists, create basic profile from auth data
      if (!profile) {
        console.log('📝 Creating basic profile from auth data');
        const basicProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          display_name: user.name,
          created_at: new Date().toISOString()
        };

        return {
          success: true,
          data: basicProfile,
          message: 'Basic profile data retrieved'
        };
      }

      console.log('✅ Profile retrieved successfully');
      return {
        success: true,
        data: profile,
        message: 'Profile retrieved successfully'
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get profile'
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: ProfileUpdateParams): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('✏️ Updating profile for user:', user.id, updates);

      // Validate update fields
      if (updates.username && updates.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (updates.display_name && updates.display_name.length < 1) {
        throw new Error('Display name cannot be empty');
      }

      if (updates.bio && updates.bio.length > 500) {
        throw new Error('Bio cannot exceed 500 characters');
      }

      const updateData = {
        id: user.id,
        email: user.email || '',
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(updateData)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        
        // Handle specific constraint errors
        if (error.code === '23505' && error.message.includes('username')) {
          throw new Error('Username is already taken. Please choose a different one.');
        }
        
        throw new Error(error.message);
      }

      console.log('✅ Profile updated successfully');
      return {
        success: true,
        data,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update profile'
      };
    }
  }

  /**
   * Update user preferences specifically
   */
  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('⚙️ Updating preferences for user:', user.id);

      // Get current profile to merge preferences
      const currentProfile = await this.getProfile();
      if (!currentProfile.success || !currentProfile.data) {
        throw new Error('Could not retrieve current profile');
      }

      const currentPreferences = currentProfile.data.preferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };

      return await this.updateProfile({ preferences: updatedPreferences });
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update preferences'
      };
    }
  }

  /**
   * Update user's dietary restrictions
   */
  static async updateDietaryRestrictions(restrictions: string[]): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('🥗 Updating dietary restrictions for user:', user.id, restrictions);

      // Validate restrictions
      const validRestrictions = restrictions.filter(r => 
        typeof r === 'string' && r.trim().length > 0
      );

      const { data, error } = await supabase
        .from('users')
        .update({ 
          dietary_restrictions: validRestrictions,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating dietary restrictions:', error);
        throw new Error(error.message);
      }

      console.log('✅ Dietary restrictions updated successfully');
      return {
        success: true,
        data,
        message: 'Dietary restrictions updated successfully'
      };
    } catch (error) {
      console.error('Error in updateDietaryRestrictions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update dietary restrictions'
      };
    }
  }

  /**
   * Update user's cuisine preferences
   */
  static async updateCuisinePreferences(
    preferences: string[], 
    dislikes?: string[]
  ): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('🍽️ Updating cuisine preferences for user:', user.id);

      // Validate preferences
      const validPreferences = preferences.filter(p => 
        typeof p === 'string' && p.trim().length > 0
      );

      const validDislikes = dislikes?.filter(d => 
        typeof d === 'string' && d.trim().length > 0
      ) || [];

      const updateData: Record<string, unknown> = {
        cuisine_preferences: validPreferences,
        updated_at: new Date().toISOString()
      };

      if (dislikes !== undefined) {
        updateData.cuisine_dislikes = validDislikes;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cuisine preferences:', error);
        throw new Error(error.message);
      }

      console.log('✅ Cuisine preferences updated successfully');
      return {
        success: true,
        data,
        message: 'Cuisine preferences updated successfully'
      };
    } catch (error) {
      console.error('Error in updateCuisinePreferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update cuisine preferences'
      };
    }
  }

  /**
   * Upload and update user avatar
   */
  static async updateAvatar(file: File): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('📸 Uploading avatar for user:', user.id);

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-assets')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get avatar URL');
      }

      // Update profile with new avatar URL
      const updateResult = await this.updateProfile({ 
        avatar_url: urlData.publicUrl 
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update profile with avatar');
      }

      console.log('✅ Avatar uploaded and profile updated successfully');
      return updateResult;
    } catch (error) {
      console.error('Error in updateAvatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update avatar'
      };
    }
  }

  /**
   * Delete user avatar
   */
  static async deleteAvatar(): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('🗑️ Deleting avatar for user:', user.id);

      // Get current profile to find avatar URL
      const currentProfile = await this.getProfile();
      if (!currentProfile.success || !currentProfile.data?.avatar_url) {
        throw new Error('No avatar to delete');
      }

      // Extract file path from URL
      const avatarUrl = currentProfile.data.avatar_url;
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatars/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('user-assets')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Warning: Could not delete avatar file:', deleteError);
        // Continue anyway to remove URL from profile
      }

      // Update profile to remove avatar URL
      const updateResult = await this.updateProfile({ avatar_url: undefined });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update profile');
      }

      console.log('✅ Avatar deleted successfully');
      return updateResult;
    } catch (error) {
      console.error('Error in deleteAvatar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to delete avatar'
      };
    }
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<ProfileResponse<boolean>> {
    try {
      if (!username || username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking username availability:', error);
        throw new Error(error.message);
      }

      const isAvailable = !data;
      
      return {
        success: true,
        data: isAvailable,
        message: isAvailable ? 'Username is available' : 'Username is already taken'
      };
    } catch (error) {
      console.error('Error in isUsernameAvailable:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check username availability'
      };
    }
  }

  /**
   * Complete user onboarding with basic profile data
   */
  static async completeOnboarding(data: { displayName: string; location: string }): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('🎯 Completing onboarding for user:', user.id, data);

      // First, try to update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({
          display_name: data.displayName,
          location_city: data.location,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (!updateError && updatedProfile) {
        console.log('✅ Onboarding completed via update');
        return {
          success: true,
          data: updatedProfile,
          message: 'Onboarding completed successfully'
        };
      }

      // If update failed (likely because no profile exists), create new profile
      console.log('🔄 Creating new user profile...');
      
      const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          username: username,
          display_name: data.displayName,
          location_city: data.location,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating user profile:', insertError);
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }

      console.log('✅ Onboarding completed via profile creation');
      return {
        success: true,
        data: newProfile,
        message: 'Onboarding completed successfully'
      };
    } catch (error) {
      console.error('❌ Error in completeOnboarding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to complete onboarding'
      };
    }
  }

  /**
   * Complete user onboarding with full preferences
   */
  static async completeOnboardingWithPreferences(data: {
    displayName: string;
    location: string;
    dietaryRestrictions: string[];
    cuisinePreferences: string[];
    spiceTolerance: 'mild' | 'medium' | 'hot' | 'extreme';
    priceRange: 'budget' | 'moderate' | 'expensive' | 'fine_dining';
  }): Promise<ProfileResponse<UserProfile>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      console.log('🎯 Completing onboarding with full preferences for user:', user.id, data);

      // Build preferences object
      const preferences: UserPreferences = {
        food_preferences: {
          dietary_restrictions: data.dietaryRestrictions,
          preferred_cuisines: data.cuisinePreferences,
          spice_tolerance: data.spiceTolerance,
          price_range: data.priceRange,
        }
      };

      // First, try to update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({
          display_name: data.displayName,
          location_city: data.location,
          dietary_restrictions: data.dietaryRestrictions,
          cuisine_preferences: data.cuisinePreferences,
          preferences: preferences,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (!updateError && updatedProfile) {
        console.log('✅ Onboarding with preferences completed via update');
        return {
          success: true,
          data: updatedProfile,
          message: 'Onboarding completed successfully'
        };
      }

      // If update failed (likely because no profile exists), create new profile
      console.log('🔄 Creating new user profile with preferences...');
      
      const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          username: username,
          display_name: data.displayName,
          location_city: data.location,
          dietary_restrictions: data.dietaryRestrictions,
          cuisine_preferences: data.cuisinePreferences,
          preferences: preferences,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating user profile with preferences:', insertError);
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }

      console.log('✅ Onboarding with preferences completed via profile creation');
      return {
        success: true,
        data: newProfile,
        message: 'Onboarding completed successfully'
      };
    } catch (error) {
      console.error('❌ Error in completeOnboardingWithPreferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to complete onboarding'
      };
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async hasCompletedOnboarding(): Promise<ProfileResponse<boolean>> {
    try {
      const user = await AuthService.ensureAuthenticated();

      const { data: profile, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        throw new Error(error.message);
      }

      const hasCompleted = profile?.onboarding_completed === true;
      
      return {
        success: true,
        data: hasCompleted,
        message: hasCompleted ? 'User has completed onboarding' : 'User needs to complete onboarding'
      };
    } catch (error) {
      console.error('Error in hasCompletedOnboarding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check onboarding status'
      };
    }
  }

  /**
   * Get the Supabase client instance (for advanced usage)
   */
  static getSupabaseClient() {
    return supabase;
  }
}