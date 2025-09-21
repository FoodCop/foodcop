import { AnimatePresence, motion } from "framer-motion";
import { Clock, ExternalLink, MapPin, Phone, Star, X } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Restaurant } from "../ScoutPage";

interface RestaurantDetailSheetProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantDetailSheet({
  restaurant,
  isOpen,
  onClose,
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
            className="fixed inset-0 z-50 bg-white md:top-4 md:bottom-4 md:left-4 md:right-4 md:rounded-3xl md:shadow-2xl"
          >
            {/* Handle - Desktop only */}
            <div className="hidden md:flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header - Desktop only */}
            <div className="hidden md:flex items-center justify-between px-6 pb-3">
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
            <div className="overflow-y-auto flex-1 h-full">
              {/* Mobile Layout */}
              <div className="md:hidden h-full">
                {/* Large Image at Top */}
                <div className="relative h-64">
                  <ImageWithFallback
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Back Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Status Badge */}
                  <div
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
                      restaurant.isOpen
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {restaurant.isOpen ? "Open" : "Closed"}
                  </div>

                  {/* Distance Badge */}
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-[#0B1F3A]/80 text-white text-sm rounded-full font-medium">
                    {restaurant.distance} away
                  </div>
                </div>

                {/* Restaurant Details */}
                <div className="px-4 py-4 space-y-4">
                  {/* Restaurant Name & Rating */}
                  <div className="mb-4">
                    <h1 className="font-bold text-[#0B1F3A] text-2xl mb-2">
                      {restaurant.name}
                    </h1>

                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
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
                        <span className="text-gray-500 text-sm">
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
                          className="px-3 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-full font-medium text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
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
                            restaurant.isOpen
                              ? "text-green-600"
                              : "text-red-600"
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
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex md:gap-6 md:h-full">
                {/* Details Section */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-6 pb-6">
                    {/* Restaurant Name & Rating */}
                    <div className="mb-4">
                      <h1 className="font-bold text-[#0B1F3A] text-xl md:text-2xl mb-2">
                        {restaurant.name}
                      </h1>

                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 md:w-5 md:h-5 ${
                                  i < Math.floor(restaurant.rating)
                                    ? "text-[#FFD74A] fill-[#FFD74A]"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-[#0B1F3A] text-base md:text-lg">
                            {restaurant.rating}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ({restaurant.reviewCount} reviews)
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[#0B1F3A] font-bold text-base md:text-lg">
                            {getPriceLevelDisplay(restaurant.priceLevel)}
                          </span>
                        </div>
                      </div>

                      {/* Cuisine Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {restaurant.cuisine.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-full font-medium text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      {/* Address */}
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#0B1F3A] text-sm">
                            Address
                          </p>
                          <p className="text-gray-600 text-sm">
                            {restaurant.address}
                          </p>
                        </div>
                      </div>

                      {/* Hours */}
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#0B1F3A] text-sm">
                            Hours
                          </p>
                          <p
                            className={`${
                              restaurant.isOpen
                                ? "text-green-600"
                                : "text-red-600"
                            } font-medium text-sm`}
                          >
                            {restaurant.openHours}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      {restaurant.phone && (
                        <div className="flex items-start space-x-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#0B1F3A] text-sm">
                              Phone
                            </p>
                            <p className="text-[#F14C35] font-medium text-sm">
                              {restaurant.phone}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Website */}
                      {restaurant.website && (
                        <div className="flex items-start space-x-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#0B1F3A] text-sm">
                              Website
                            </p>
                            <p className="text-[#F14C35] font-medium text-sm">
                              {restaurant.website}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Section */}
                <div className="w-80 h-80 flex-shrink-0">
                  <ImageWithFallback
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
