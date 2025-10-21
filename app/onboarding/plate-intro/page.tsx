'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Bookmark, Heart, Share2, Utensils, MapPin, Clock } from 'lucide-react';

export default function PlateIntroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAnimated, setIsAnimated] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push('/onboarding/plate-setup');
  };

  const handleSkip = () => {
    router.push('/onboarding/complete');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100">
      {/* Progress Bar */}
      <div className="pt-8 pb-4">
        <OnboardingProgress 
          steps={[
            { id: 'profile', title: 'Profile Setup' },
            { id: 'preferences', title: 'Food Preferences' },
            { id: 'plate-intro', title: 'Your Plate' },
            { id: 'complete', title: 'Complete' }
          ]}
          currentStep="plate-intro"
          completedSteps={['profile', 'preferences']}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Meet Your Personal Plate 🍽️
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your Plate is where you save and organize all your favorite restaurants, 
            recipes, and culinary discoveries. It&apos;s your personal food journey!
          </p>
        </div>

        {/* Visual Demo */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left: Plate Features */}
          <div className="space-y-6">
            <div className={`transform transition-all duration-700 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Bookmark className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Restaurants</h3>
                      <p className="text-gray-600">
                        Bookmark restaurants you want to try or love to revisit. Never forget that perfect spot again!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className={`transform transition-all duration-700 delay-200 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Utensils className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Collect Recipes</h3>
                      <p className="text-gray-600">
                        Save recipes from your favorite food creators and organize them by cuisine, difficulty, or occasion.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className={`transform transition-all duration-700 delay-400 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Share2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Share with Friends</h3>
                      <p className="text-gray-600">
                        Share your favorite finds with friends and see what they&apos;re discovering too!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Sample Plate Preview */}
          <div className={`transform transition-all duration-1000 delay-600 ${isAnimated ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {user.name?.split(' ')[0] || 'Your'}&apos;s Plate
                  </h3>
                  <p className="text-gray-500">Your culinary collection</p>
                </div>

                {/* Sample saved items */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Joe&apos;s Italian Bistro</h4>
                      <p className="text-sm text-gray-500">Want to try • Italian</p>
                    </div>
                    <Heart className="w-5 h-5 text-orange-500" />
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Homemade Ramen</h4>
                      <p className="text-sm text-gray-500">Recipe • Japanese</p>
                    </div>
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Sunset Café</h4>
                      <p className="text-sm text-gray-500">Loved it! • Brunch</p>
                    </div>
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">...and many more discoveries!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to start building your Plate?
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Let&apos;s add some initial restaurants and recipes based on your preferences. 
              You can always customize everything later!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleContinue}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-medium"
            >
              Let&apos;s Build My Plate! 🎯
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Don&apos;t worry - you can always add items to your Plate later from anywhere in the app!
          </p>
        </div>
      </div>
    </div>
  );
}