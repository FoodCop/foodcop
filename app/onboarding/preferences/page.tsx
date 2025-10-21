'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingProgress, defaultOnboardingSteps } from '@/components/onboarding/OnboardingProgress';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface PreferencesData {
  dietary: string[];
  cuisine: string[];
  spiceTolerance: number;
  priceRange: number;
}

const DIETARY_OPTIONS = [
  { id: 'none', label: 'No restrictions', emoji: '🍽️' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'gluten-free', label: 'Gluten-free', emoji: '🌾' },
  { id: 'dairy-free', label: 'Dairy-free', emoji: '🥛' },
  { id: 'keto', label: 'Keto', emoji: '🥑' },
  { id: 'paleo', label: 'Paleo', emoji: '🍖' },
  { id: 'halal', label: 'Halal', emoji: '☪️' },
  { id: 'kosher', label: 'Kosher', emoji: '✡️' },
];

const CUISINE_OPTIONS = [
  { id: 'italian', label: 'Italian', emoji: '🍝' },
  { id: 'japanese', label: 'Japanese', emoji: '🍱' },
  { id: 'mexican', label: 'Mexican', emoji: '🌮' },
  { id: 'indian', label: 'Indian', emoji: '🍛' },
  { id: 'thai', label: 'Thai', emoji: '🍜' },
  { id: 'chinese', label: 'Chinese', emoji: '🥟' },
  { id: 'french', label: 'French', emoji: '🥐' },
  { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { id: 'korean', label: 'Korean', emoji: '🍲' },
  { id: 'american', label: 'American', emoji: '🍔' },
  { id: 'vietnamese', label: 'Vietnamese', emoji: '🍲' },
  { id: 'lebanese', label: 'Lebanese', emoji: '🥙' },
];

const SPICE_LEVELS = [
  { value: 1, label: 'Mild', emoji: '🫒', description: 'I prefer no spice' },
  { value: 2, label: 'Low', emoji: '🌶️', description: 'Just a little heat' },
  { value: 3, label: 'Medium', emoji: '🌶️🌶️', description: 'I enjoy some spice' },
  { value: 4, label: 'Hot', emoji: '🌶️🌶️🌶️', description: 'Bring on the heat!' },
  { value: 5, label: 'Extra Hot', emoji: '🔥', description: 'The spicier the better' },
];

const PRICE_RANGES = [
  { value: 1, label: 'Budget', symbol: '$', description: 'Under $15 per meal' },
  { value: 2, label: 'Moderate', symbol: '$$', description: '$15-$30 per meal' },
  { value: 3, label: 'Upscale', symbol: '$$$', description: '$30-$60 per meal' },
  { value: 4, label: 'Fine Dining', symbol: '$$$$', description: '$60+ per meal' },
];

export default function PreferencesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [preferences, setPreferences] = useState<PreferencesData>({
    dietary: [],
    cuisine: [],
    spiceTolerance: 3,
    priceRange: 2
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const toggleDietary = (option: string) => {
    setPreferences(prev => {
      const newDietary = [...prev.dietary];
      
      // Handle "none" option
      if (option === 'none') {
        return { ...prev, dietary: newDietary.includes('none') ? [] : ['none'] };
      }
      
      // Remove "none" if selecting other options
      const filteredDietary = newDietary.filter(item => item !== 'none');
      
      if (filteredDietary.includes(option)) {
        return { ...prev, dietary: filteredDietary.filter(item => item !== option) };
      } else {
        return { ...prev, dietary: [...filteredDietary, option] };
      }
    });
  };

  const toggleCuisine = (option: string) => {
    setPreferences(prev => {
      const newCuisine = [...prev.cuisine];
      if (newCuisine.includes(option)) {
        return { ...prev, cuisine: newCuisine.filter(item => item !== option) };
      } else {
        return { ...prev, cuisine: [...newCuisine, option] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const supabase = supabaseBrowser();
      
      // Update user preferences in database
      const { error } = await supabase
        .from('users')
        .update({
          dietary_preferences: preferences.dietary,
          cuisine_preferences: preferences.cuisine,
          spice_tolerance: preferences.spiceTolerance,
          price_range_preference: preferences.priceRange
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        setErrors({ submit: 'Failed to save preferences. Please try again.' });
        return;
      }

      // Navigate to next step
      router.push('/onboarding/plate-intro');
    } catch (error) {
      console.error('Error submitting preferences:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/profile');
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
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <OnboardingProgress
            steps={defaultOnboardingSteps}
            currentStep="preferences"
            completedSteps={['intro', 'profile']}
          />
        </div>

        {/* Preferences Setup Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Your Food Preferences
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Help us personalize your FUZO experience with your food preferences
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Dietary Preferences */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Dietary Preferences</Label>
              <p className="text-sm text-gray-600">Select any dietary restrictions or preferences you have</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DIETARY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleDietary(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      preferences.dietary.includes(option.id)
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="font-medium">{option.label}</span>
                      </div>
                      {preferences.dietary.includes(option.id) && (
                        <Check className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine Preferences */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Favorite Cuisines</Label>
              <p className="text-sm text-gray-600">Select the types of cuisine you enjoy (choose multiple)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CUISINE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleCuisine(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      preferences.cuisine.includes(option.id)
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="text-2xl">{option.emoji}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                      {preferences.cuisine.includes(option.id) && (
                        <Check className="w-4 h-4 text-orange-600 mx-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {preferences.cuisine.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-sm text-gray-600">Selected:</span>
                  {preferences.cuisine.map(cuisine => {
                    const option = CUISINE_OPTIONS.find(opt => opt.id === cuisine);
                    return (
                      <Badge key={cuisine} variant="secondary" className="bg-orange-100 text-orange-800">
                        {option?.emoji} {option?.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Spice Tolerance */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Spice Tolerance</Label>
              <p className="text-sm text-gray-600">How much spice do you enjoy?</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {SPICE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setPreferences(prev => ({ ...prev, spiceTolerance: level.value }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      preferences.spiceTolerance === level.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="text-2xl">{level.emoji}</div>
                      <div className="text-sm font-medium">{level.label}</div>
                      <div className="text-xs text-gray-500">{level.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Price Range Preference</Label>
              <p className="text-sm text-gray-600">What&apos;s your typical dining budget?</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setPreferences(prev => ({ ...prev, priceRange: range.value }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      preferences.priceRange === range.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">{range.symbol}</div>
                      <div className="text-sm font-medium">{range.label}</div>
                      <div className="text-xs text-gray-500">{range.description}</div>
                    </div>
                  </button>
                ))}
              </div>
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
                disabled={isSubmitting}
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