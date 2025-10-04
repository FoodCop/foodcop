import { supabaseBrowser } from '@/lib/supabase/client';
import { ProfileFormData } from '@/components/profile/ProfileEditModal';

const supabase = supabaseBrowser();

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  dietary_preferences?: string[];
  avatar_url?: string;
  cover_photo_url?: string;
  is_private: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

class ProfileService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await fetch('/api/profile');
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch profile');
    }

    return result.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<ProfileFormData>): Promise<UserProfile> {
    // Remove undefined values and prepare the update object
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Add updated_at timestamp
    cleanUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(cleanUpdates)
      .eq('id', userId)
      .select(`
        id,
        email,
        username,
        display_name,
        first_name,
        last_name,
        date_of_birth,
        location_city,
        location_state,
        location_country,
        dietary_preferences,
        avatar_url,
        cover_photo_url,
        is_private,
        is_verified,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      
      // Handle specific error cases
      if (error.code === '23505') {
        if (error.message.includes('username')) {
          throw new Error('Username is already taken');
        }
        if (error.message.includes('email')) {
          throw new Error('Email is already taken');
        }
      }
      
      throw new Error('Failed to update profile');
    }

    if (!data) {
      throw new Error('Failed to update profile');
    }

    return data;
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!username || username.length < 3) {
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username availability:', error);
      throw new Error('Failed to check username availability');
    }

    // Username is available if no user found with that username
    return !data;
  }

  /**
   * Upload profile image (avatar or cover)
   */
  async uploadProfileImage(
    userId: string, 
    file: File, 
    type: 'avatar' | 'cover'
  ): Promise<string> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      throw error;
    }
  }

  /**
   * Delete profile image
   */
  async deleteProfileImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      const filePath = pathSegments.slice(-2).join('/'); // Get last 2 segments

      const { error } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        // Don't throw error for delete failures, just log them
      }
    } catch (error) {
      console.error('Error in deleteProfileImage:', error);
      // Don't throw error for delete failures, just log them
    }
  }

  /**
   * Get profile by username (for public viewing)
   */
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        display_name,
        first_name,
        last_name,
        date_of_birth,
        location_city,
        location_state,
        location_country,
        dietary_preferences,
        avatar_url,
        cover_photo_url,
        is_private,
        is_verified,
        created_at,
        updated_at
      `)
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      console.error('Error fetching profile by username:', error);
      throw new Error('Failed to fetch profile');
    }

    return data;
  }

  /**
   * Search profiles by display name or username
   */
  async searchProfiles(query: string, limit: number = 10): Promise<UserProfile[]> {
    if (!query.trim()) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        display_name,
        avatar_url,
        is_verified,
        is_private
      `)
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      console.error('Error searching profiles:', error);
      throw new Error('Failed to search profiles');
    }

    return data || [];
  }
}

export const profileService = new ProfileService();