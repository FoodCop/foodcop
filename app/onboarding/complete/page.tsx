'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Check, Sparkles, Users, MapPin, Utensils } from 'lucide-react';

export default function OnboardingCompletePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAnimated, setIsAnimated] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        router.push('/auth/signin');
      }, 0);
    }
  }, [user, loading, router]);

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/feed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToFeed = () => {
    router.push('/feed');
  };

  const handleExplorePlate = () => {
    router.push('/plate');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className={`transform transition-all duration-1000 ${isAnimated ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to FUZO! 🎉
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Congratulations, {user.name?.split(' ')[0] || 'there'}! Your account is all set up and ready to explore.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className={`transform transition-all duration-700 delay-300 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors h-full">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Personal Plate</h3>
                <p className="text-gray-600">
                  Save restaurants and recipes that catch your eye. Your culinary journey starts here!
                </p>
              </CardContent>
            </Card>
          </div>

          <div className={`transform transition-all duration-700 delay-500 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors h-full">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Feed</h3>
                <p className="text-gray-600">
                  Discover new restaurants and recipes tailored to your taste preferences and dietary needs.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className={`transform transition-all duration-700 delay-700 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Card className="border-2 border-green-200 hover:border-green-300 transition-colors h-full">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect with Friends</h3>
                <p className="text-gray-600">
                  Share your food discoveries and see what your friends are loving. Food is better together!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div className={`transform transition-all duration-700 delay-900 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to start your food adventure?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Your personalized feed is waiting for you! Discover restaurants, save recipes, 
                and connect with fellow food lovers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button
                  onClick={handleGoToFeed}
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-medium"
                >
                  Explore Your Feed 🚀
                </Button>
                <Button
                  onClick={handleExplorePlate}
                  variant="outline"
                  size="lg"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
                >
                  View Your Plate 🍽️
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                Redirecting to your feed in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <div className={`mt-8 text-center transform transition-all duration-700 delay-1100 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/50 backdrop-blur rounded-lg p-4">
              <MapPin className="w-5 h-5 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                <strong>Pro tip:</strong> Use the save button on any restaurant to add it to your Plate
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur rounded-lg p-4">
              <Utensils className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                <strong>Pro tip:</strong> Follow food creators to see their latest recipe recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}