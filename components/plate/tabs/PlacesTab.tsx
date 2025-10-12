'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MapPin, Star, DollarSign, ExternalLink, RefreshCw, Trash2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { savedItemsService } from '@/lib/savedItemsService';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Restaurant {
  id: string;
  restaurant_id: string;
  name: string;
  address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  photo_url?: string;
  photos?: any[]; // Fallback if photo_url is not available
  google_maps_url?: string;
  created_at: string;
}

interface PlacesTabProps {
  restaurants: Restaurant[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
}

export function PlacesTab({ restaurants, loading, error, onRefresh }: PlacesTabProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleImageError = (restaurantId: string) => {
    setImageErrors(prev => new Set(prev).add(restaurantId));
  };

  // Helper function to get the best available image URL  
  const getImageUrl = (restaurant: Restaurant): string | null => {
    // Try multiple possible image fields in the metadata
    const metadata = (restaurant as any).metadata || restaurant;
    
    // Priority order for image URLs
    const imageFields = [
      'photo_url',           // New format
      'imageUrl',            // Old format  
      'photoUrl',            // Alternative format
    ];
    
    // Check direct fields first
    for (const field of imageFields) {
      if (metadata[field]) {
        return metadata[field];
      }
    }
    
    // Check photos array
    if (metadata.photos && Array.isArray(metadata.photos) && metadata.photos.length > 0) {
      const photoUrl = metadata.photos[0]?.photo_url || metadata.photos[0]?.url;
      if (photoUrl) {
        return photoUrl;
      }
    }
    
    return null;
  };

  // Helper function to get restaurant name from different formats
  const getRestaurantName = (restaurant: Restaurant): string => {
    const metadata = (restaurant as any).metadata || restaurant;
    const fullMetadata = (restaurant as any).full_metadata;
    
    return restaurant.name || 
           metadata.name || 
           metadata.title ||
           fullMetadata?.name ||
           'Unknown Restaurant';
  };

  // Helper function to get restaurant address
  const getRestaurantAddress = (restaurant: Restaurant): string => {
    const metadata = (restaurant as any).metadata || restaurant;
    const fullMetadata = (restaurant as any).full_metadata;
    
    return restaurant.address || 
           metadata.address ||
           metadata.formatted_address ||
           fullMetadata?.address ||
           'Address not available';
  };
  
  // Helper function to get Google Maps place ID for "View" button
  const getRestaurantPlaceId = (restaurant: Restaurant): string | null => {
    const metadata = (restaurant as any).metadata || restaurant;
    const fullMetadata = (restaurant as any).full_metadata;
    
    return restaurant.restaurant_id ||
           metadata.restaurant_id ||
           metadata.placeId ||
           metadata.place_id ||
           fullMetadata?.placeId ||
           null;
  };
  
  // Helper function to get restaurant rating
  const getRestaurantRating = (restaurant: Restaurant): number | null => {
    const metadata = (restaurant as any).metadata || restaurant;
    const fullMetadata = (restaurant as any).full_metadata;
    
    return restaurant.rating || 
           metadata.rating ||
           fullMetadata?.rating ||
           null;
  };
  
  // Helper function to check if restaurant has enough data to show View button
  const canViewRestaurant = (restaurant: Restaurant): boolean => {
    const placeId = getRestaurantPlaceId(restaurant);
    const name = getRestaurantName(restaurant);
    return !!(placeId && name !== 'Unknown Restaurant');
  };

  // Helper function to get restaurant coordinates from different possible locations
  const getRestaurantCoordinates = (restaurant: Restaurant): { lat: number; lng: number } | null => {
    const metadata = (restaurant as any).metadata || restaurant;
    const fullMetadata = (restaurant as any).full_metadata;
    
    // Try multiple possible coordinate formats
    const latitude = metadata.latitude || 
                    metadata.lat || 
                    fullMetadata?.latitude || 
                    fullMetadata?.lat ||
                    metadata.coordinates?.lat ||
                    metadata.geometry?.location?.lat;
    
    const longitude = metadata.longitude || 
                     metadata.lng || 
                     fullMetadata?.longitude || 
                     fullMetadata?.lng ||
                     metadata.coordinates?.lng ||
                     metadata.geometry?.location?.lng;
    
    if (latitude && longitude) {
      return { lat: Number(latitude), lng: Number(longitude) };
    }
    
    return null;
  };
  
  // Helper function to check if restaurant has coordinates for "View on Map" button
  const canViewOnMap = (restaurant: Restaurant): boolean => {
    const coordinates = getRestaurantCoordinates(restaurant);
    return !!coordinates;
  };

  // Helper function to get restaurant details for map display
  const getRestaurantDetails = (restaurant: Restaurant) => {
    const metadata = (restaurant as any).metadata || restaurant;
    const fullMetadata = (restaurant as any).full_metadata;
    
    return {
      rating: metadata.rating || 
              fullMetadata?.rating || 
              metadata.google_rating ||
              fullMetadata?.google_rating,
      cuisine: metadata.cuisine || 
               fullMetadata?.cuisine || 
               metadata.category ||
               fullMetadata?.category ||
               metadata.types?.[0],
      priceLevel: metadata.price_level || 
                  fullMetadata?.price_level ||
                  metadata.priceLevel ||
                  fullMetadata?.priceLevel,
      address: metadata.address || 
               fullMetadata?.address ||
               metadata.formatted_address ||
               fullMetadata?.formatted_address ||
               metadata.vicinity ||
               fullMetadata?.vicinity
    };
  };

  const handleViewOnMap = (restaurant: Restaurant) => {
    const coordinates = getRestaurantCoordinates(restaurant);
    const restaurantName = getRestaurantName(restaurant);
    const details = getRestaurantDetails(restaurant);
    
    if (coordinates) {
      // Navigate to Scout page with coordinates and details as URL parameters
      const params = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lng: coordinates.lng.toString(),
        name: restaurantName,
        focus: 'true'
      });

      // Add optional details if available
      if (details.rating) {
        params.set('rating', details.rating.toString());
      }
      if (details.cuisine) {
        params.set('cuisine', details.cuisine);
      }
      if (details.priceLevel) {
        params.set('priceLevel', details.priceLevel.toString());
      }
      if (details.address) {
        params.set('address', details.address);
      }
      
      router.push(`/scout?${params.toString()}`);
      toast.success(`Showing ${restaurantName} on map`);
    } else {
      toast.error('Location not available for this restaurant');
    }
  };

  const handleRemove = async (restaurantId: string, name: string) => {
    if (!confirm(`Remove "${name}" from your plate?`)) return;
    
    setRemovingId(restaurantId);
    try {
      const result = await savedItemsService.unsaveRestaurant(restaurantId);
      
      if (result.success) {
        toast.success(`"${name}" removed from your plate`);
        onRefresh(); // Refresh the data
      } else {
        toast.error(result.error || 'Failed to remove restaurant');
      }
    } catch (error) {
      console.error('Failed to remove restaurant:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setRemovingId(null);
    }
  };
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Saved Places</h2>
          <Button disabled variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No places saved yet</h3>
        <p className="text-gray-600 mb-4">
          Discover and save restaurants from the Scout page to see them here.
        </p>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Saved Places ({restaurants.length})
        </h2>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => {
          const imageUrl = getImageUrl(restaurant);
          const restaurantName = getRestaurantName(restaurant);
          const restaurantAddress = getRestaurantAddress(restaurant);
          const rating = getRestaurantRating(restaurant);
          const placeId = getRestaurantPlaceId(restaurant);
          
          return (
          <Card key={restaurant.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
            {/* Restaurant Image */}
            {imageUrl && !imageErrors.has(restaurant.id) ? (
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={restaurantName}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                  onError={() => handleImageError(restaurant.id)}
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            <CardContent className="p-4">
              {/* Restaurant Info */}
              <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                {restaurantName}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {restaurantAddress}
              </p>
              
              {/* Rating and Price */}
              <div className="flex items-center gap-4 mb-3">
                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{rating}/5</span>
                  </div>
                )}
                
                {restaurant.price_level && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      {'$'.repeat(restaurant.price_level)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Cuisine Types */}
              {restaurant.types && restaurant.types.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {restaurant.types.slice(0, 3).map((type, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2">
                {/* View on Map - Navigate to Scout page */}
                {canViewOnMap(restaurant) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewOnMap(restaurant)}
                    className="flex-1"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    View on Map
                  </Button>
                )}
                
                {/* External Google Maps link */}
                {canViewRestaurant(restaurant) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const placeId = getRestaurantPlaceId(restaurant);
                      if (placeId) {
                        const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
                        window.open(mapsUrl, '_blank');
                      }
                    }}
                    className={canViewOnMap(restaurant) ? "" : "flex-1"}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {canViewOnMap(restaurant) ? "Google" : "View"}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(restaurant.restaurant_id, restaurant.name)}
                  disabled={removingId === restaurant.restaurant_id}
                >
                  {removingId === restaurant.restaurant_id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Saved Date */}
              <p className="text-xs text-gray-500 mt-2">
                Saved {new Date(restaurant.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}