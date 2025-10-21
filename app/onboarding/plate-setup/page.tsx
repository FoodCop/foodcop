'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Utensils, Star, Clock, DollarSign, Plus, Check } from 'lucide-react';

interface SuggestedItem {
  id: string;
  type: 'restaurant' | 'recipe';
  name: string;
  description: string;
  cuisine?: string;
  difficulty?: string;
  prepTime?: string;
  priceRange?: number;
  rating?: number;
  image?: string;
  selected: boolean;
}

export default function PlateSetupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Load user preferences and generate suggestions
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('dietary_preferences, cuisine_preferences, spice_tolerance, price_range_preference')
          .eq('id', user!.id)
          .single();

        if (error) {
          console.error('Error loading user preferences:', error);
        } else {
          setUserPreferences(userProfile);
          generateSuggestions(userProfile);
        }
      } catch (error) {
        console.error('Exception loading user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const generateSuggestions = (preferences: any) => {
    const cuisines = preferences.cuisine_preferences || [];
    const dietary = preferences.dietary_preferences || [];
    const spiceLevel = preferences.spice_tolerance || 3;
    const priceRange = preferences.price_range_preference || 2;

    // Sample restaurants based on preferences
    const restaurants: SuggestedItem[] = [
      {
        id: 'rest-1',
        type: 'restaurant',
        name: 'Sakura Sushi Bar',
        description: 'Fresh sushi and authentic Japanese flavors',
        cuisine: 'Japanese',
        priceRange: 3,
        rating: 4.5,
        selected: false
      },
      {
        id: 'rest-2',
        type: 'restaurant',
        name: 'Mama Mia Trattoria',
        description: 'Traditional Italian pasta and wood-fired pizza',
        cuisine: 'Italian',
        priceRange: 2,
        rating: 4.3,
        selected: false
      },
      {
        id: 'rest-3',
        type: 'restaurant',
        name: 'Spice Garden',
        description: 'Authentic Indian cuisine with customizable spice levels',
        cuisine: 'Indian',
        priceRange: 2,
        rating: 4.6,
        selected: false
      },
      {
        id: 'rest-4',
        type: 'restaurant',
        name: 'Green Leaf Café',
        description: 'Farm-to-table organic dishes and fresh salads',
        cuisine: 'Healthy',
        priceRange: 2,
        rating: 4.4,
        selected: false
      },
      {
        id: 'rest-5',
        type: 'restaurant',
        name: 'Taco Libre',
        description: 'Vibrant Mexican street food and margaritas',
        cuisine: 'Mexican',
        priceRange: 1,
        rating: 4.2,
        selected: false
      }
    ];

    // Sample recipes based on preferences
    const recipes: SuggestedItem[] = [
      {
        id: 'recipe-1',
        type: 'recipe',
        name: 'Easy Chicken Teriyaki',
        description: 'Quick and delicious Japanese-inspired dinner',
        cuisine: 'Japanese',
        difficulty: 'Easy',
        prepTime: '25 min',
        selected: false
      },
      {
        id: 'recipe-2',
        type: 'recipe',
        name: 'Creamy Mushroom Pasta',
        description: 'Rich and satisfying vegetarian comfort food',
        cuisine: 'Italian',
        difficulty: 'Easy',
        prepTime: '20 min',
        selected: false
      },
      {
        id: 'recipe-3',
        type: 'recipe',
        name: 'Coconut Curry Lentils',
        description: 'Healthy and flavorful plant-based protein',
        cuisine: 'Indian',
        difficulty: 'Medium',
        prepTime: '30 min',
        selected: false
      },
      {
        id: 'recipe-4',
        type: 'recipe',
        name: 'Mediterranean Quinoa Bowl',
        description: 'Fresh and nutritious grain bowl with herbs',
        cuisine: 'Mediterranean',
        difficulty: 'Easy',
        prepTime: '15 min',
        selected: false
      },
      {
        id: 'recipe-5',
        type: 'recipe',
        name: 'Fish Tacos with Lime',
        description: 'Light and zesty seafood with fresh toppings',
        cuisine: 'Mexican',
        difficulty: 'Medium',
        prepTime: '35 min',
        selected: false
      }
    ];

    // Filter and prioritize suggestions based on preferences
    let filtered = [...restaurants, ...recipes];
    
    // Prioritize items matching cuisine preferences
    if (cuisines.length > 0) {
      filtered = filtered.sort((a, b) => {
        const aMatch = cuisines.includes(a.cuisine?.toLowerCase());
        const bMatch = cuisines.includes(b.cuisine?.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    // Select first 8 items as suggestions
    setSuggestedItems(filtered.slice(0, 8));
  };

  const toggleItemSelection = (itemId: string) => {
    setSuggestedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleFinishSetup = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const supabase = supabaseBrowser();
      const selectedItems = suggestedItems.filter(item => item.selected);

      // Save selected items to user's plate
      const plateItems = selectedItems.map(item => ({
        user_id: user.id,
        item_type: item.type,
        item_id: `${item.type}_${item.id}`, // Create a unique identifier
        metadata: {
          name: item.name,
          description: item.description,
          cuisine: item.cuisine,
          difficulty: item.difficulty,
          prep_time: item.prepTime,
          price_range: item.priceRange,
          rating: item.rating,
          status: item.type === 'restaurant' ? 'want_to_try' : 'saved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      if (plateItems.length > 0) {
        const { error: plateError } = await supabase
          .from('saved_items')
          .insert(plateItems);

        if (plateError) {
          console.error('Error saving plate items:', plateError);
        } else {
          console.log(`Saved ${plateItems.length} items to user plate`);
        }
      }

      // Mark onboarding as completed
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error marking onboarding complete:', updateError);
      }

      // Navigate to completion page
      router.push('/onboarding/complete');
    } catch (error) {
      console.error('Error finishing setup:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/complete');
  };

  if (loading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Preparing your personalized suggestions...</p>
        </div>
      </div>
    );
  }

  const selectedCount = suggestedItems.filter(item => item.selected).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100">
      {/* Progress Bar */}
      <div className="pt-8 pb-4">
        <OnboardingProgress 
          steps={[
            { id: 'profile', title: 'Profile Setup' },
            { id: 'preferences', title: 'Food Preferences' },
            { id: 'plate-intro', title: 'Your Plate' },
            { id: 'plate-setup', title: 'Build Your Plate' },
            { id: 'complete', title: 'Complete' }
          ]}
          currentStep="plate-setup"
          completedSteps={['profile', 'preferences', 'plate-intro']}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Let&apos;s Build Your Plate! 🍽️
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Based on your preferences, here are some restaurants and recipes to get you started. 
            Select the ones that interest you most!
          </p>
          {selectedCount > 0 && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full">
              <Check className="w-4 h-4 mr-2" />
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Suggestions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {suggestedItems.map((item) => (
            <Card 
              key={item.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                item.selected 
                  ? 'ring-2 ring-orange-500 bg-orange-50' 
                  : 'hover:shadow-md border-gray-200'
              }`}
              onClick={() => toggleItemSelection(item.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'restaurant' 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.type === 'restaurant' ? (
                        <MapPin className="w-5 h-5" />
                      ) : (
                        <Utensils className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 capitalize">
                        {item.cuisine} • {item.type}
                      </p>
                    </div>
                  </div>
                  <div className={`p-1 rounded-full ${
                    item.selected 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {item.selected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4">{item.description}</p>
                
                {/* Item Details */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {item.type === 'restaurant' ? (
                      <>
                        {item.rating && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                            {item.rating}
                          </div>
                        )}
                        {item.priceRange && (
                          <div className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {'$'.repeat(item.priceRange)}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.prepTime}
                        </div>
                        <span className="capitalize">{item.difficulty}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              You can always add more items to your Plate later from anywhere in the app!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleFinishSetup}
              disabled={isSaving}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-medium"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Setting up your Plate...
                </div>
              ) : (
                <>
                  Finish Setup {selectedCount > 0 && `(${selectedCount} selected)`}
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSkip}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
              disabled={isSaving}
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}