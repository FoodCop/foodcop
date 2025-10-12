'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, ChefHat, Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RestaurantData, RecipeData, ShareTarget } from './types/ShareTypes';
import RestaurantShareCard from './RestaurantShareCard';
import RecipeShareCard from './RecipeShareCard';
import RestaurantShareDialog from './RestaurantShareDialog';
import RecipeShareDialog from './RecipeShareDialog';

export default function SharingIntegrationTest() {
  const [showRestaurantDialog, setShowRestaurantDialog] = useState(false);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [selectedView, setSelectedView] = useState<'menu' | 'restaurant' | 'recipe'>('menu');

  // Sample restaurant data
  const sampleRestaurant: RestaurantData = {
    id: 'restaurant-test-1',
    name: 'The Golden Spoon',
    address: '123 Food Street, Culinary District, Hong Kong',
    rating: 4.7,
    photo_url: '/api/placeholder/400/240',
    cuisine_type: 'Modern Asian Fusion',
    price_range: '$$$',
    coordinates: { lat: 22.3193, lng: 114.1694 },
    description: 'Experience innovative Asian fusion cuisine in an elegant setting. Our chef combines traditional flavors with modern techniques.',
    phone: '+852 1234 5678',
    opening_hours: 'Mon-Sun: 11:30 AM - 10:00 PM',
    distance: 450
  };

  // Sample recipe data
  const sampleRecipe: RecipeData = {
    id: 'recipe-test-1',
    title: 'Spicy Korean Bibimbap Bowl',
    description: 'A colorful and nutritious Korean mixed rice bowl with vegetables, meat, and a perfectly fried egg on top.',
    image_url: '/api/placeholder/400/240',
    cooking_time: 45,
    difficulty: 'Medium',
    ingredients: [
      'Jasmine rice',
      'Korean beef bulgogi',
      'Shiitake mushrooms',
      'Bean sprouts',
      'Carrots',
      'Spinach',
      'Eggs',
      'Gochujang sauce',
      'Sesame oil',
      'Garlic'
    ],
    servings: 4,
    calories: 520,
    category: 'Korean',
    author: 'Chef Kim',
    prep_time: 20,
    instructions: [
      'Cook rice according to package instructions',
      'Marinate beef in bulgogi sauce for 30 minutes',
      'Sauté vegetables separately to maintain distinct flavors',
      'Cook beef until tender and caramelized',
      'Fry eggs sunny-side up',
      'Arrange everything in bowls and serve with gochujang'
    ]
  };

  const handleRestaurantShare = async (targets: ShareTarget[], message?: string) => {
    console.log('Sharing restaurant to:', targets);
    console.log('Message:', message);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`Restaurant shared to ${targets.length} contact(s)!`);
  };

  const handleRecipeShare = async (targets: ShareTarget[], message?: string) => {
    console.log('Sharing recipe to:', targets);
    console.log('Message:', message);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`Recipe shared to ${targets.length} contact(s)!`);
  };

  const handleSaveToPlate = (content: any) => {
    console.log('Save to plate:', content);
    alert(`${content.name || content.title} saved to your plate!`);
  };

  const handleViewDetails = (content: any) => {
    console.log('View details:', content);
    alert(`Opening details for ${content.name || content.title}`);
  };

  const handleGetDirections = (restaurant: RestaurantData) => {
    console.log('Get directions:', restaurant);
    alert(`Opening directions to ${restaurant.name}`);
  };

  if (selectedView === 'restaurant') {
    return (
      <div className="h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg h-full">
          <div className="flex items-center gap-3 p-4 border-b">
            <button
              onClick={() => setSelectedView('menu')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Sharing</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Preview how restaurants appear when shared in chat
              </p>
              <Button 
                onClick={() => setShowRestaurantDialog(true)}
                className="mb-4"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share This Restaurant
              </Button>
            </div>
            
            <RestaurantShareCard
              message={{
                type: 'restaurant',
                restaurant: sampleRestaurant,
                shared_by_user_id: 'test-user',
                shared_at: new Date().toISOString(),
                message: 'This place has amazing Korean fusion dishes!'
              }}
              onSaveToPlate={handleSaveToPlate}
              onViewDetails={handleViewDetails}
              onGetDirections={handleGetDirections}
            />
          </div>
          
          <RestaurantShareDialog
            isOpen={showRestaurantDialog}
            onClose={() => setShowRestaurantDialog(false)}
            onShare={handleRestaurantShare}
            restaurant={sampleRestaurant}
          />
        </div>
      </div>
    );
  }

  if (selectedView === 'recipe') {
    return (
      <div className="h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg h-full">
          <div className="flex items-center gap-3 p-4 border-b">
            <button
              onClick={() => setSelectedView('menu')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Recipe Sharing</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Preview how recipes appear when shared in chat
              </p>
              <Button 
                onClick={() => setShowRecipeDialog(true)}
                className="mb-4"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share This Recipe
              </Button>
            </div>
            
            <RecipeShareCard
              message={{
                type: 'recipe',
                recipe: sampleRecipe,
                shared_by_user_id: 'test-user',
                shared_at: new Date().toISOString(),
                message: 'Perfect for a cozy dinner! The gochujang adds amazing flavor.'
              }}
              onSaveToPlate={handleSaveToPlate}
              onViewDetails={handleViewDetails}
            />
          </div>
          
          <RecipeShareDialog
            isOpen={showRecipeDialog}
            onClose={() => setShowRecipeDialog(false)}
            onShare={handleRecipeShare}
            recipe={sampleRecipe}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8 text-center">
        <Share2 className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Cross-System Integration Test
        </h1>
        <p className="text-gray-600 mb-8">
          Test restaurant and recipe sharing components for the FUZO chat system.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={() => setSelectedView('restaurant')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UtensilsCrossed className="w-5 h-5" />
            Test Restaurant Sharing
          </Button>
          
          <Button
            onClick={() => setSelectedView('recipe')}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ChefHat className="w-5 h-5" />
            Test Recipe Sharing
          </Button>
          
          <Button
            onClick={() => window.location.href = '/chat'}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to Chat System
          </Button>
        </div>
        
        <div className="mt-8 text-left bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Phase 7.5 Features:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Restaurant sharing with rich previews</li>
            <li>✅ Recipe sharing with ingredient lists</li>
            <li>✅ Contact selection and messaging</li>
            <li>✅ Save to plate functionality</li>
            <li>✅ Deep linking to Scout/Bites</li>
            <li>✅ Master bot compatibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
}