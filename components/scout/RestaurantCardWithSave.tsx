import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SaveToPlate } from "../plate/SaveToPlate";
import type { Restaurant } from "../ScoutPage";
import { SafeRestaurantImage } from "../ui/SafeRestaurantImage";

interface RestaurantCardWithSaveProps {
  restaurant: Restaurant;
  onClick: () => void;
  onSave?: () => void;
  variant?: "horizontal" | "grid";
}

export function RestaurantCardWithSave({
  restaurant,
  onClick,
  onSave,
  variant = "horizontal",
}: RestaurantCardWithSaveProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if save button was clicked
    if ((e.target as HTMLElement).closest("[data-save-button]")) {
      return;
    }
    onClick();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="flex-shrink-0 w-64 bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer relative"
    >
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

          {/* Save Button */}
          <div
            className="flex-shrink-0"
            data-save-button
            onClick={(e) => e.stopPropagation()}
          >
            <SaveToPlate
              itemId={restaurant.placeId || restaurant.name}
              itemType="restaurant"
              title={restaurant.name}
              imageUrl={restaurant.image}
              variant="icon"
              size="sm"
              onSaved={onSave}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
