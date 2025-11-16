import { MapPin, Star, Phone, Clock, ExternalLink, Navigation, Bookmark } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";
import { ScrollArea } from "../../ui/scroll-area";
import { Button } from "../../ui/button";
import { ImageWithFallback } from "../../ui/image-with-fallback";
import { savedItemsService } from "../../../services";
import { useAuth } from "../../auth/AuthProvider";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string | string[];
  rating: number;
  lat: number;
  lng: number;
  address: string;
  distance?: number;
  place_id?: string;
  price_level?: number;
  photos?: string[];
  phone?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  reviews?: {
    author_name: string;
    rating: number;
    text: string;
    time: string;
  }[];
}

interface RestaurantDetailDialogProps {
  restaurant: Restaurant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestaurantDetailDialog({
  restaurant,
  open,
  onOpenChange,
}: RestaurantDetailDialogProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!restaurant) return null;

  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$';
  const distanceText = restaurant.distance 
    ? restaurant.distance < 1 
      ? `${Math.round(restaurant.distance * 1000)}m away`
      : `${restaurant.distance.toFixed(1)}km away`
    : '';

  const cuisineText = Array.isArray(restaurant.cuisine) 
    ? restaurant.cuisine.join(', ') 
    : restaurant.cuisine;

  const handleSaveToPlate = async () => {
    if (!user) {
      toast.error('Please sign in to save restaurants');
      return;
    }

    setSaving(true);
    try {
      const restaurantMetadata = {
        name: restaurant.name,
        cuisine: cuisineText,
        rating: restaurant.rating,
        address: restaurant.address,
        lat: restaurant.lat,
        lng: restaurant.lng,
        place_id: restaurant.place_id,
        price_level: restaurant.price_level,
        photos: restaurant.photos,
        phone: restaurant.phone,
        website: restaurant.website,
      };

      const result = await savedItemsService.saveItem({
        itemId: restaurant.place_id || restaurant.id,
        itemType: 'restaurant',
        metadata: restaurantMetadata
      });

      if (result.success) {
        toast.success(`${restaurant.name} saved to your plate!`);
      } else {
        if (result.error === 'Item already saved') {
          toast.info(`${restaurant.name} is already in your plate`);
        } else {
          toast.error(result.error || 'Failed to save restaurant');
        }
      }
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('An error occurred while saving the restaurant');
    } finally {
      setSaving(false);
    }
  };

  const handleGetDirections = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-white">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="pr-8">{restaurant.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Restaurant details for {restaurant.name}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-4rem)]">
          <div className="p-6 pt-4">
            {/* Restaurant Image */}
            {restaurant.photos && restaurant.photos.length > 0 && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <ImageWithFallback
                  src={restaurant.photos[0]}
                  alt={restaurant.name}
                  className="w-full h-64 object-cover"
                  fallbackSrc="/placeholder-restaurant.jpg"
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-semibold">{restaurant.rating}</span>
                </div>
                <span className="text-gray-600">{priceLevel}</span>
                {distanceText && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{distanceText}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <span className="text-sm">{cuisineText}</span>
              </div>

              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{restaurant.address}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={handleGetDirections}
                className="flex-1 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Directions
              </Button>
              <Button
                onClick={handleSaveToPlate}
                disabled={saving}
                variant="outline"
                className="flex-1"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save to Plate'}
              </Button>
            </div>

            {/* Contact Info */}
            {(restaurant.phone || restaurant.website) && (
              <div className="mb-6 space-y-3 p-4 bg-gray-50 rounded-lg">
                {restaurant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <a href={`tel:${restaurant.phone}`} className="text-sm text-blue-600 hover:underline">
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                    <a 
                      href={restaurant.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Opening Hours */}
            {restaurant.opening_hours?.weekday_text && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Opening Hours
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {restaurant.opening_hours.weekday_text.map((hours, index) => (
                    <div key={index}>{hours}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {restaurant.reviews && restaurant.reviews.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Reviews</h3>
                <div className="space-y-4">
                  {restaurant.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{review.author_name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
