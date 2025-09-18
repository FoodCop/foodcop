import React, { useState, useEffect } from 'react';
import { MapPin, Share2, Star, Clock, Filter, Heart, Trash2 } from 'lucide-react';
import { SavedPlace, SavedRecipe } from '../constants/profileData';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { savedItemsService, SavedRestaurant } from '../services/savedItemsService';
import { useAuth } from '../../contexts/AuthContext';

interface PlateTabProps {
  savedPlaces: SavedPlace[];
  savedRecipes: SavedRecipe[];
}

type PlateFilter = 'all' | 'restaurants' | 'recipes';

export function PlateTab({ savedPlaces, savedRecipes }: PlateTabProps) {
  const [activeFilter, setActiveFilter] = useState<PlateFilter>('all');
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSavedRestaurants();
    }
  }, [user]);

  // Refresh saved restaurants when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadSavedRestaurants();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const loadSavedRestaurants = async () => {
    try {
      setLoading(true);
      const restaurants = await savedItemsService.getSavedRestaurants();
      setSavedRestaurants(restaurants);
    } catch (error) {
      console.error('Failed to load saved restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveRestaurant = async (placeId: string) => {
    try {
      const result = await savedItemsService.unsaveRestaurant(placeId);
      if (result.success) {
        setSavedRestaurants(prev => prev.filter(r => r.place_id !== placeId));
        console.log('✅ Restaurant removed from saved list');
      }
    } catch (error) {
      console.error('Failed to unsave restaurant:', error);
    }
  };

  const filters = [
    { id: 'all' as PlateFilter, label: 'All', count: savedRestaurants.length + savedRecipes.length },
    { id: 'restaurants' as PlateFilter, label: 'Restaurants', count: savedRestaurants.length },
    { id: 'recipes' as PlateFilter, label: 'Recipes', count: savedRecipes.length }
  ];

  const filteredPlaces = activeFilter === 'recipes' ? [] : savedRestaurants;
  const filteredRecipes = activeFilter === 'restaurants' ? [] : savedRecipes;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1F3A]">My Plate</h2>
            <p className="text-sm text-gray-600">Loading your saved favorites...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1F3A]">My Plate</h2>
          <p className="text-sm text-gray-600">Your saved favorites</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <Filter className="w-5 h-5 text-[#0B1F3A]" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-[#F8F9FA] rounded-xl p-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === filter.id
                ? 'bg-white text-[#F14C35] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
            {filter.count > 0 && (
              <span className={`ml-1 ${
                activeFilter === filter.id ? 'text-[#F14C35]' : 'text-gray-400'
              }`}>
                ({filter.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredPlaces.length === 0 && filteredRecipes.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">No saved items yet</h3>
          <p className="text-gray-600 mb-6">Start exploring and save your favorite restaurants and recipes.</p>
          <button className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
            Explore Food
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Restaurants Section */}
          {filteredPlaces.length > 0 && (
            <div>
              {activeFilter === 'all' && (
                <h3 className="font-medium text-[#0B1F3A] mb-3">Restaurants ({filteredPlaces.length})</h3>
              )}
              <div className="grid grid-cols-1 gap-4">
                {filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex">
                      {/* Image */}
                      <div className="w-24 h-24 flex-shrink-0">
                        <ImageWithFallback
                          src={place.image || `https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop`}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-[#0B1F3A] mb-1">{place.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{place.cuisine}</span>
                              <span>•</span>
                              <span>{place.price}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-gray-900">{place.rating || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{place.location}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button className="px-3 py-1 bg-[#F14C35] text-white text-sm rounded-lg font-medium hover:bg-[#E63E26] transition-colors">
                              View on Map
                            </button>
                            <button 
                              onClick={() => handleUnsaveRestaurant(place.place_id)}
                              className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                              <Share2 className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipes Section */}
          {filteredRecipes.length > 0 && (
            <div>
              {activeFilter === 'all' && filteredPlaces.length > 0 && (
                <div className="border-t border-gray-200 my-6"></div>
              )}
              {activeFilter === 'all' && (
                <h3 className="font-medium text-[#0B1F3A] mb-3">Recipes ({filteredRecipes.length})</h3>
              )}
              <div className="grid grid-cols-1 gap-4">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex">
                      {/* Image */}
                      <div className="w-24 h-24 flex-shrink-0">
                        <ImageWithFallback
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-[#0B1F3A] mb-1">{recipe.title}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{recipe.cuisine}</span>
                              <span>•</span>
                              <span>{recipe.difficulty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{recipe.cookingTime}m</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button className="px-3 py-1 bg-[#F14C35] text-white text-sm rounded-lg font-medium hover:bg-[#E63E26] transition-colors">
                              View Recipe
                            </button>
                            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                              <Share2 className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-[#F8F9FA] rounded-xl p-4 border border-gray-200">
        <h3 className="font-medium text-[#0B1F3A] mb-3">Plate Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{savedRestaurants.length}</p>
            <p className="text-xs text-gray-600">Restaurants</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{savedRecipes.length}</p>
            <p className="text-xs text-gray-600">Recipes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">
              {savedRestaurants.length > 0 ? 
                Math.round((savedRestaurants.reduce((sum, place) => sum + place.rating, 0) / savedRestaurants.length) * 10) / 10 : 0}
            </p>
            <p className="text-xs text-gray-600">Avg Rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}
