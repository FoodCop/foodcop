'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnboardingProgress, defaultOnboardingSteps } from '@/components/onboarding/OnboardingProgress';
import { Camera, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface ProfileData {
  displayName: string;
  firstName: string;
  lastName: string;
  username: string;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  avatarUrl?: string;
}

export default function ProfileSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    firstName: '',
    lastName: '',
    username: '',
    locationCity: '',
    locationState: '',
    locationCountry: 'United States',
    avatarUrl: ''
  });

  // Initialize with user data
  useEffect(() => {
    if (user && !loading) {
      // Get additional user metadata from Supabase session if needed
      const initializeProfile = async () => {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const metadata = session?.user?.user_metadata || {};
        
        setProfileData(prev => ({
          ...prev,
          displayName: user.name || metadata.full_name || '',
          firstName: metadata.given_name || '',
          lastName: metadata.family_name || '',
          avatarUrl: user.avatar_url || metadata.picture || metadata.avatar_url || '',
          username: user.email?.split('@')[0] || ''
        }));
      };
      
      initializeProfile();
    }
  }, [user, loading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (profileData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    try {
      const supabase = supabaseBrowser();
      
      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .update({
          display_name: profileData.displayName,
          first_name: profileData.firstName || null,
          last_name: profileData.lastName || null,
          username: profileData.username,
          location_city: profileData.locationCity || null,
          location_state: profileData.locationState || null,
          location_country: profileData.locationCountry || null,
          avatar_url: profileData.avatarUrl || null
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        setErrors({ submit: 'Failed to save profile. Please try again.' });
        return;
      }

      // Navigate to next step
      router.push('/onboarding/preferences');
    } catch (error) {
      console.error('Error submitting profile:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <OnboardingProgress
            steps={defaultOnboardingSteps}
            currentStep="profile"
            completedSteps={['intro']}
          />
        </div>

        {/* Profile Setup Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Set Up Your Profile
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Tell us a bit about yourself to personalize your FUZO experience
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatarUrl} />
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                    {profileData.displayName ? (
                      profileData.displayName.charAt(0).toUpperCase()
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
                  onClick={() => {
                    // TODO: Implement image upload
                    console.log('Image upload to be implemented');
                  }}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {profileData.avatarUrl ? 'Update your photo' : 'Add a profile photo (optional)'}
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display Name *
              </Label>
              <Input
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="How should we display your name?"
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>

            {/* First and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username *
              </Label>
              <Input
                id="username"
                value={profileData.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                placeholder="Choose a unique username"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username}</p>
              )}
              <p className="text-xs text-gray-500">
                This will be your unique identifier (@{profileData.username || 'username'})
              </p>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Location (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Input
                    value={profileData.locationCity}
                    onChange={(e) => handleInputChange('locationCity', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    value={profileData.locationState}
                    onChange={(e) => handleInputChange('locationState', e.target.value)}
                    placeholder="State/Province"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    value={profileData.locationCountry}
                    onChange={(e) => handleInputChange('locationCountry', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                This helps us show you relevant restaurants and local recommendations
              </p>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !profileData.displayName || !profileData.username}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}