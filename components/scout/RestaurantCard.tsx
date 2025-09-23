import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import type { Restaurant } from "../ScoutPage";
import { SafeRestaurantImage } from "../ui/SafeRestaurantImage";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  variant?: "horizontal" | "grid";
  showMapIcon?: boolean;
  onMapClick?: () => void;
}

export function RestaurantCard({
  restaurant,
  onClick,
  variant = "horizontal", // TODO: Implement variant-specific layouts
  showMapIcon = false,
  onMapClick,
}: RestaurantCardProps) {
  // Suppress unused parameter warning - variant will be used for different layouts
  void variant;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-shrink-0 w-64 bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer relative"
    >
      {/* Map Icon */}
      {showMapIcon && onMapClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMapClick();
          }}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
          title="View on Map"
        >
          <MapPin className="w-4 h-4 text-[#F14C35]" />
        </button>
      )}

      <div className="p-3">
        <div className="flex items-center space-x-3">
          {/* Restaurant Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <SafeRestaurantImage
              src={restaurant.image}
              photos={restaurant.photos}
              restaurantName={restaurant.name}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              placeId={restaurant.placeId}
              coordinates={restaurant.coordinates}
            />
          </div>

          {/* Restaurant Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#0B1F3A] text-sm leading-tight mb-1">
              {restaurant.name}
            </h3>

            {/* Rating and Type Row */}
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-[#FFD74A] fill-[#FFD74A]" />
                <span className="text-xs font-medium text-[#0B1F3A]">
                  {restaurant.rating}
                </span>
              </div>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-600">
                {restaurant.cuisine[0] || "Restaurant"}
              </span>
            </div>

            {/* Distance and Status Row */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {restaurant.distance}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span
                className={`text-xs font-medium ${
                  restaurant.isOpen ? "text-green-600" : "text-red-600"
                }`}
              >
                {restaurant.isOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
