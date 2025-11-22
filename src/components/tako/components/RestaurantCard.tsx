/**
 * RestaurantCard Component
 * Rich card display for restaurant results in TakoAI chat
 */

import { Button } from '../../ui/button';
import { MapPin, Utensils, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RestaurantCardData } from '../../../services/takoAIService';

interface RestaurantCardProps {
  restaurant: RestaurantCardData;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    // Navigate to Scout page
    // User can search for the restaurant there
    // TODO: Enhance to directly open restaurant details by placeId
    navigate('/scout');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      {restaurant.imageUrl ? (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Restaurant';
            }}
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <Utensils className="w-12 h-12 text-gray-400" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
          {restaurant.name}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 line-clamp-2">
              {restaurant.location}
            </p>
            {restaurant.distance && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <i className="fa-solid fa-person-walking" style={{ fontSize: '10pt' }} aria-label="Distance"></i>
                {restaurant.distance}
              </p>
            )}
          </div>
        </div>

        {/* Cuisine */}
        {restaurant.cuisine && (
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{restaurant.cuisine}</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleViewDetails}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  );
}

