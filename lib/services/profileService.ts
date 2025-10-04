import { ProfileFormData } from '@/components/profile/ProfileEditModal';

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
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update profile');
    }

    return result.data;
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!username || username.length < 3) {
      return false;
    }

    const response = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      throw new Error('Failed to check username availability');
    }

    const result = await response.json();
    return result.available;
  }
}

export const profileService = new ProfileService();