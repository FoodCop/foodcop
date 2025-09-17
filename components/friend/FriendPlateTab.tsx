import React from 'react';
import { MapPin, Star, Copy, Share2 } from 'lucide-react';
import { SavedPlace } from '../constants/profileData';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface FriendPlateTabProps {
  savedPlaces: SavedPlace[];
}

export function FriendPlateTab({ savedPlaces }: FriendPlateTabProps) {
  const handleCopyToPlate = (place: SavedPlace) => {
    // In real app, this would add to user's saved places
    console.log('Copying to plate:', place.name);
    // Show toast notification
  };

  const handleShare = (place: SavedPlace) => {
    // In real app, this would share the place
    console.log('Sharing place:', place.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#0B1F3A] mb-1">Saved Favorites</h2>
        <p className="text-sm text-gray-600">{savedPlaces.length} amazing places discovered</p>
      </div>

      {savedPlaces.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">No saved places yet</h3>
          <p className="text-gray-600">This friend hasn't saved any restaurants yet.</p>
        </div>
      ) : (
        /* Places List */
        <div className="space-y-4">
          {savedPlaces.map((place) => (
            <div
              key={place.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0">
                  <ImageWithFallback
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-[#0B1F3A] mb-1">{place.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <span>{place.cuisine}</span>
                        <span>•</span>
                        <span>{place.price}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{place.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{place.rating}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      Saved {new Date(place.savedAt).toLocaleDateString()}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyToPlate(place)}
                        className="px-3 py-1 bg-[#F14C35] text-white text-sm rounded-lg font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy to My Plate</span>
                      </button>
                      
                      <button
                        onClick={() => handleShare(place)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <Share2 className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-[#F8F9FA] rounded-xl p-4">
        <h3 className="font-medium text-[#0B1F3A] mb-3">Taste Profile</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">{savedPlaces.length}</p>
            <p className="text-xs text-gray-600">Places Saved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">
              {savedPlaces.length > 0 
                ? Math.round((savedPlaces.reduce((sum, place) => sum + place.rating, 0) / savedPlaces.length) * 10) / 10
                : 0
              }
            </p>
            <p className="text-xs text-gray-600">Avg Rating</p>
          </div>
        </div>

        {/* Top Cuisines */}
        {savedPlaces.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[#0B1F3A] mb-2">Favorite Cuisines</h4>
            <div className="flex flex-wrap gap-2">
              {[...new Set(savedPlaces.map(place => place.cuisine))].slice(0, 4).map((cuisine) => (
                <span
                  key={cuisine}
                  className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded-full border"
                >
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Social Prompt */}
      <div className="bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 rounded-xl p-4 border border-[#F14C35]/20">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🍽️</div>
          <div>
            <h4 className="font-medium text-[#0B1F3A] mb-1">Discover Similar Tastes</h4>
            <p className="text-sm text-gray-600">Copy their favorites to your plate and explore new flavors!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
