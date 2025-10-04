'use client';

import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/auth/auth';
import { Edit, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { supabaseBrowser } from '@/lib/supabase/client';

interface PlateHeaderProps {
  user: AuthUser | null;
  savedCounts?: {
    restaurants: number;
    recipes: number;
    photos: number;
    videos: number;
  };
  onProfileUpdate?: () => void;
}

interface UserProfile {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  is_verified?: boolean;
}

export function PlateHeader({ user, savedCounts, onProfileUpdate }: PlateHeaderProps) {
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Fetch user profile data from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const supabase = supabaseBrowser();
        const { data: profileData, error } = await supabase
          .from('users')
          .select(`
            display_name,
            first_name,
            last_name,
            username,
            avatar_url,
            location_city,
            location_state,
            location_country,
            is_verified
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        setUserProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Determine display values with fallbacks
  const displayName = userProfile?.display_name || 
                     userProfile?.first_name || 
                     user?.name || 
                     user?.email?.split('@')[0] || 
                     'FUZO User';
                     
  const handle = userProfile?.username ? 
                `@${userProfile.username}` : 
                `@${user?.email?.split('@')[0] || 'user'}`;
                
  const location = [userProfile?.location_city, userProfile?.location_state, userProfile?.location_country]
                  .filter(Boolean)
                  .join(', ');

  const handleProfileUpdateComplete = async () => {
    setIsProfileEditModalOpen(false);
    // Refresh the profile data
    if (user?.id) {
      const supabase = supabaseBrowser();
      const { data: profileData } = await supabase
        .from('users')
        .select(`
          display_name,
          first_name,
          last_name,
          username,
          avatar_url,
          location_city,
          location_state,
          location_country,
          is_verified
        `)
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setUserProfile(profileData);
      }
    }
    onProfileUpdate?.();
  };
  
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                  {userProfile?.is_verified && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                  )}
                </div>
                <p className="text-gray-600">{handle}</p>
                {location && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsProfileEditModalOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  150
                </div>
                <div className="text-sm text-gray-600">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {savedCounts?.restaurants || 0}
                </div>
                <div className="text-sm text-gray-600">Places</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {savedCounts?.recipes || 0}
                </div>
                <div className="text-sm text-gray-600">Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(savedCounts?.photos || 0) + (savedCounts?.videos || 0)}
                </div>
                <div className="text-sm text-gray-600">Media</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        onSave={handleProfileUpdateComplete}
      />
    </div>
  );
}