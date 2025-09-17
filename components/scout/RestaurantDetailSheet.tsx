import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Phone,
  Star,
  X,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { FuzoButton } from "../global/FuzoButton";
import type { Restaurant } from "../ScoutPage";

interface RestaurantDetailSheetProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
  onViewOnMap: () => void;
  onSave: () => void;
}

export function RestaurantDetailSheet({
  restaurant,
  isOpen,
  onClose,
  onViewOnMap,
  onSave,
}: RestaurantDetailSheetProps) {
  const getPriceLevelDisplay = (level: number) => {
    return "$".repeat(level) + "·".repeat(Math.max(0, 3 - level));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="font-bold text-[#0B1F3A] text-lg">
                Restaurant Details
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {/* Restaurant Image */}
              <div className="relative mb-6">
                <ImageWithFallback
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-64 object-cover"
                />

                {/* Status Badge */}
                <div
                  className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
                    restaurant.isOpen
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {restaurant.isOpen ? "Open" : "Closed"}
                </div>

                {/* Save Button */}
                <button
                  onClick={onSave}
                  className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      restaurant.isSaved
                        ? "text-[#F14C35] fill-[#F14C35]"
                        : "text-gray-600"
                    }`}
                  />
                </button>

                {/* Distance Badge */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-[#0B1F3A]/80 text-white text-sm rounded-full font-medium">
                  {restaurant.distance} away
                </div>
              </div>

              <div className="px-6 pb-8">
                {/* Restaurant Name & Rating */}
                <div className="mb-6">
                  <h1 className="font-bold text-[#0B1F3A] text-2xl mb-2">
                    {restaurant.name}
                  </h1>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(restaurant.rating)
                                ? "text-[#FFD74A] fill-[#FFD74A]"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-[#0B1F3A] text-lg">
                        {restaurant.rating}
                      </span>
                      <span className="text-gray-500">
                        ({restaurant.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[#0B1F3A] font-bold text-lg">
                        {getPriceLevelDisplay(restaurant.priceLevel)}
                      </span>
                    </div>
                  </div>

                  {/* Cuisine Tags */}
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisine.map((tag, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-[#F14C35]/10 text-[#F14C35] rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4 mb-6">
                  {/* Address */}
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#0B1F3A]">Address</p>
                      <p className="text-gray-600">{restaurant.address}</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#0B1F3A]">Hours</p>
                      <p
                        className={`${
                          restaurant.isOpen ? "text-green-600" : "text-red-600"
                        } font-medium`}
                      >
                        {restaurant.openHours}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  {restaurant.phone && (
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#0B1F3A]">Phone</p>
                        <p className="text-[#F14C35] font-medium">
                          {restaurant.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {restaurant.website && (
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#0B1F3A]">Website</p>
                        <p className="text-[#F14C35] font-medium">
                          {restaurant.website}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <FuzoButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={onSave}
                  >
                    <Heart
                      className={`w-5 h-5 mr-2 ${
                        restaurant.isSaved ? "fill-white" : ""
                      }`}
                    />
                    {restaurant.isSaved ? "Saved to Plate" : "Save to Plate"}
                  </FuzoButton>

                  <FuzoButton
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={onViewOnMap}
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    View on Map
                  </FuzoButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
