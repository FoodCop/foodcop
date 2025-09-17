import { motion } from "framer-motion";
import { Clock, Heart, MapPin, Star } from "lucide-react";
import { SafeRestaurantImage } from "../ui/SafeRestaurantImage";
import type { Restaurant } from "./ScoutPage";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
  onSave: () => void;
  variant?: "horizontal" | "grid";
}

export function RestaurantCard({
  restaurant,
  onClick,
  onSave,
  variant = "horizontal",
}: RestaurantCardProps) {
  const getPriceLevelDisplay = (level: number) => {
    return "$".repeat(level) + "·".repeat(Math.max(0, 3 - level));
  };

  if (variant === "grid") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-2xl shadow-md overflow-hidden"
      >
        <div className="relative">
          <SafeRestaurantImage
            src={restaurant.image}
            photos={restaurant.photos}
            restaurantName={restaurant.name}
            alt={restaurant.name}
            className="w-full h-40 object-cover"
            placeId={restaurant.placeId}
            coordinates={restaurant.coordinates}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                restaurant.isSaved
                  ? "text-[#F14C35] fill-[#F14C35]"
                  : "text-gray-600"
              }`}
            />
          </button>
          <button
            onClick={onClick}
            className="absolute bottom-3 right-3 w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center shadow-sm hover:bg-[#A6471E] transition-colors"
          >
            <MapPin className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-4" onClick={onClick}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-[#0B1F3A] text-sm leading-tight flex-1 mr-2">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-[#FFD74A] fill-[#FFD74A]" />
              <span className="text-xs font-medium text-[#0B1F3A]">
                {restaurant.rating}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.cuisine.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{restaurant.distance}</span>
            <span className="text-[#0B1F3A] font-medium">
              {getPriceLevelDisplay(restaurant.priceLevel)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-shrink-0 w-64 bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
    >
      <div className="relative">
        <SafeRestaurantImage
          src={restaurant.image}
          photos={restaurant.photos}
          restaurantName={restaurant.name}
          alt={restaurant.name}
          className="w-full h-36 object-cover"
          placeId={restaurant.placeId}
          coordinates={restaurant.coordinates}
        />

        {/* Status Badge */}
        <div
          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
            restaurant.isOpen
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {restaurant.isOpen ? "Open" : "Closed"}
        </div>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${
              restaurant.isSaved
                ? "text-[#F14C35] fill-[#F14C35]"
                : "text-gray-600"
            }`}
          />
        </button>

        {/* Distance Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-[#0B1F3A]/80 text-white text-xs rounded-full font-medium">
          {restaurant.distance}
        </div>
      </div>

      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-2">
            <h3 className="font-bold text-[#0B1F3A] text-sm leading-tight mb-1">
              {restaurant.name}
            </h3>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-[#FFD74A] fill-[#FFD74A]" />
                <span className="text-sm font-medium text-[#0B1F3A]">
                  {restaurant.rating}
                </span>
                <span className="text-gray-500 text-xs">
                  ({restaurant.reviewCount})
                </span>
              </div>
              <span className="text-[#0B1F3A] text-sm font-medium">
                {getPriceLevelDisplay(restaurant.priceLevel)}
              </span>
            </div>
          </div>
        </div>

        {/* Cuisine Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {restaurant.cuisine.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-[#F14C35]/10 text-[#F14C35] text-xs rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
          {restaurant.cuisine.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              +{restaurant.cuisine.length - 2}
            </span>
          )}
        </div>

        {/* Address & Hours */}
        <div className="space-y-1.5">
          <div className="flex items-start space-x-1.5 text-gray-600">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="text-xs leading-tight">{restaurant.address}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span
              className={`text-xs font-medium ${
                restaurant.isOpen ? "text-green-600" : "text-red-600"
              }`}
            >
              {restaurant.openHours}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
