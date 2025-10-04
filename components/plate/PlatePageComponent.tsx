'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { savedItemsService } from '@/lib/savedItemsService';
import { PlateHeader } from './PlateHeader';
import { PlateNavigation } from './PlateNavigation';
import { PlacesTab } from './tabs/PlacesTab';
import { RecipesTab } from './tabs/RecipesTab';
import { CrewTab } from './tabs/CrewTab';
import { PhotosTab } from './tabs/PhotosTab';
import { VideosTab } from './tabs/VideosTab';
import { RewardsTab } from './tabs/RewardsTab';
import { PointsTab } from './tabs/PointsTab';
import { toast } from 'sonner';

type PlateTab = 'places' | 'recipes' | 'crew' | 'photos' | 'videos' | 'rewards' | 'points';

interface SavedItemsData {
  restaurants: any[];
  recipes: any[];
  loading: boolean;
  error?: string;
}

export function PlatePageComponent() {
  const [activeTab, setActiveTab] = useState<PlateTab>('places');
  const { user, refreshUser } = useAuth();
  
  // State for saved data
  const [savedItems, setSavedItems] = useState<SavedItemsData>({
    restaurants: [],
    recipes: [],
    loading: true
  });

  // Load saved items using the savedItemsService for better data processing
  const loadSavedItems = useCallback(async () => {
    try {
      setSavedItems(prev => ({ ...prev, loading: true, error: undefined }));
      
      // Use the service methods that properly process photos and other data
      const [restaurantsResult, recipesResult] = await Promise.all([
        savedItemsService.getProcessedSavedRestaurants(),
        savedItemsService.listSavedItems({ itemType: 'recipe' })
      ]);
      
      if (!restaurantsResult.success) {
        throw new Error(restaurantsResult.error || 'Failed to fetch restaurants');
      }
      
      if (!recipesResult.success) {
        throw new Error(recipesResult.error || 'Failed to fetch recipes');
      }
      
      // Process recipes to match the expected format
      const processedRecipes = (recipesResult.data || []).map(item => ({
        id: item.id,
        recipe_id: item.item_id,
        title: item.metadata?.title || 'Unknown Recipe',
        image: item.metadata?.image,
        readyInMinutes: item.metadata?.readyInMinutes,
        servings: item.metadata?.servings,
        diets: item.metadata?.diets || [],
        created_at: item.created_at
      }));
      
      setSavedItems({
        restaurants: restaurantsResult.data || [],
        recipes: processedRecipes,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load saved items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load saved items';
      setSavedItems(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  }, []);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  // Refresh data when items are added/removed
  const handleDataRefresh = useCallback(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  // Handle profile updates
  const handleProfileUpdate = useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  // Tab configuration with real counts
  const tabs = [
    { 
      id: 'places' as PlateTab, 
      label: 'Places', 
      icon: 'MapPin', 
      count: savedItems.restaurants.length 
    },
    { 
      id: 'recipes' as PlateTab, 
      label: 'Recipes', 
      icon: 'ChefHat', 
      count: savedItems.recipes.length 
    },
    { 
      id: 'crew' as PlateTab, 
      label: 'Crew', 
      icon: 'Users', 
      count: 0 // TODO: Implement friends count
    },
    { 
      id: 'photos' as PlateTab, 
      label: 'Photos', 
      icon: 'Camera', 
      count: 0 // TODO: Implement photos count
    },
    { 
      id: 'videos' as PlateTab, 
      label: 'Videos', 
      icon: 'Video', 
      count: 0 // TODO: Implement videos count
    },
    { 
      id: 'rewards' as PlateTab, 
      label: 'Rewards', 
      icon: 'Award', 
      count: 0 // TODO: Implement rewards count
    },
    { 
      id: 'points' as PlateTab, 
      label: 'Points', 
      icon: 'Star', 
      count: 0 // TODO: Implement points count
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'places':
        return (
          <PlacesTab 
            restaurants={savedItems.restaurants} 
            loading={savedItems.loading}
            error={savedItems.error}
            onRefresh={handleDataRefresh}
          />
        );
      case 'recipes':
        return (
          <RecipesTab 
            recipes={savedItems.recipes} 
            loading={savedItems.loading}
            error={savedItems.error}
            onRefresh={handleDataRefresh}
          />
        );
      case 'crew':
        return <CrewTab />;
      case 'photos':
        return <PhotosTab />;
      case 'videos':
        return <VideosTab />;
      case 'rewards':
        return <RewardsTab />;
      case 'points':
        return <PointsTab />;
      default:
        return <div className="text-center py-8 text-gray-500">Tab content coming soon...</div>;
    }
  };

  return (
    <div className="bg-white">
      {/* Profile Header */}
      <PlateHeader 
        user={user} 
        savedCounts={{
          restaurants: savedItems.restaurants.length,
          recipes: savedItems.recipes.length,
          photos: 0, // TODO: Implement when photos are added
          videos: 0  // TODO: Implement when videos are added
        }}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {/* Tab Navigation */}
      <PlateNavigation 
        tabs={tabs}
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />
      
      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}