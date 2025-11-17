import { MapPin, Star, Phone, Clock, ExternalLink, Navigation, Bookmark, ArrowLeft, Share2, Heart, DollarSign } from "lucide-react";
import { useState } from "react";
import { savedItemsService } from "../../../services";
import { useAuth } from "../../auth/AuthProvider";
import { toast } from "sonner";
import { MapView } from "./MapView";

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
  const [liked, setLiked] = useState(false);
  const [showMap, setShowMap] = useState(false);

  if (!restaurant) return null;

  const priceLevel = restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$$';
  const distanceText = restaurant.distance 
    ? restaurant.distance < 1 
      ? `${(restaurant.distance * 1000).toFixed(0)}m`
      : `${restaurant.distance.toFixed(1)}km`
    : '0.8km';

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
    setShowMap(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurant.name,
        text: `Check out ${restaurant.name} on FUZO!`,
        url: window.location.href,
      }).catch(() => {
        // User cancelled share
      });
    } else {
      toast.info('Share feature not available on this device');
    }
  };

  // Calculate review stats
  const totalReviews = restaurant.reviews?.length || 0;
  const reviewStats = totalReviews > 0 ? {
    5: Math.round(totalReviews * 0.85),
    4: Math.round(totalReviews * 0.10),
    3: Math.round(totalReviews * 0.03),
    2: Math.round(totalReviews * 0.01),
    1: Math.round(totalReviews * 0.01),
  } : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Hero Section with Image */}
      <div className="relative">
        <div className="h-72 overflow-hidden relative bg-gradient-to-br from-gray-200 to-gray-300">
          {restaurant.photos && restaurant.photos.length > 0 ? (
            <img 
              src={restaurant.photos[0]} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          
          {/* Header buttons */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 left-5 w-11 h-11 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <ArrowLeft className="text-gray-900" />
          </button>
          
          <div className="absolute top-6 right-5 flex gap-2">
            <button
              onClick={handleShare}
              className="w-11 h-11 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              <Share2 className="text-gray-900 w-5 h-5" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="w-11 h-11 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
            </button>
          </div>

          {/* Bottom info on hero */}
          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex items-center gap-2 mb-2">
              {restaurant.opening_hours?.open_now && (
                <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                  Open Now
                </span>
              )}
              <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-semibold px-2.5 py-1 rounded-lg">
                Fast Delivery
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{restaurant.name}</h1>
            <p className="text-sm text-white/90">{cuisineText}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5">
        
        {/* Stats Section */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 text-center">
            <Star className="w-5 h-5 text-yellow-500 mb-1 mx-auto fill-yellow-500" />
            <p className="text-lg font-bold text-gray-900">{restaurant.rating}</p>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-blue-500 mb-1 mx-auto" />
            <p className="text-lg font-bold text-gray-900">15-20</p>
            <p className="text-xs text-gray-600">Minutes</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center">
            <MapPin className="w-5 h-5 text-green-500 mb-1 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{distanceText}</p>
            <p className="text-xs text-gray-600">away</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center">
            <DollarSign className="w-5 h-5 text-purple-500 mb-1 mx-auto" />
            <p className="text-lg font-bold text-gray-900">{priceLevel}</p>
            <p className="text-xs text-gray-600">Price</p>
          </div>
        </div>

        {/* Reviews Preview */}
        {reviewStats && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Reviews & Ratings</h3>
              <button className="text-sm font-medium text-orange-500 hover:text-orange-600">
                See all
              </button>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{restaurant.rating}</p>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-3 h-3 ${star <= restaurant.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">{totalReviews} ratings</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-8">{rating} ★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400" 
                        style={{ width: `${(reviewStats[rating as keyof typeof reviewStats] / totalReviews) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">About Restaurant</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Experience exquisite {cuisineText} cuisine in an elegant setting. Our chef-curated menu features seasonal ingredients and classic techniques to bring you an unforgettable dining experience.
          </p>
          {restaurant.opening_hours?.weekday_text && restaurant.opening_hours.weekday_text.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{restaurant.opening_hours.weekday_text[0].split(': ')[1]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Location & Contact */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Location & Contact</h3>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 mb-3">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="text-orange-500 text-lg mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">{restaurant.address.split(',')[0]}</p>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
              </div>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-3 mb-3">
                <Phone className="text-orange-500 text-lg" />
                <a href={`tel:${restaurant.phone}`} className="text-sm text-gray-900 hover:text-orange-500">
                  {restaurant.phone}
                </a>
              </div>
            )}
            {restaurant.website && (
              <div className="flex items-center gap-3">
                <ExternalLink className="text-orange-500 text-lg" />
                <a 
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-900 hover:text-orange-500 truncate"
                >
                  {restaurant.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGetDirections}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-xl transition-shadow"
            >
              <Navigation className="w-5 h-5" />
              Get Directions
            </button>
            <button
              onClick={handleSaveToPlate}
              disabled={saving}
              className="px-6 py-4 bg-gray-100 text-gray-900 font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Bookmark className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {restaurant.reviews && restaurant.reviews.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Customer Reviews</h3>
            <div className="space-y-3">
              {restaurant.reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{review.author_name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                  {review.time && (
                    <p className="text-xs text-gray-400 mt-2">{review.time}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-6"></div>
      </div>

      {/* MapView Component */}
      <MapView
        restaurant={restaurant}
        open={showMap}
        onClose={() => setShowMap(false)}
      />
    </div>
  );
}
