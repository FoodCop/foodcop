import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MessageCircle, Copy, Star } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { Friend, Restaurant } from '../ScoutPage';

interface FriendsTabContentProps {
  friends: Friend[];
  expandedFriends: Set<string>;
  copiedItems: Set<string>;
  onToggleFriendExpanded: (friendId: string) => void;
  onRestaurantClick: (restaurant: Restaurant) => void;
  onCopyToPlate: (restaurant: Restaurant) => void;
}

export function FriendsTabContent({
  friends,
  expandedFriends,
  copiedItems,
  onToggleFriendExpanded,
  onRestaurantClick,
  onCopyToPlate
}: FriendsTabContentProps) {
  return (
    <div className="space-y-4">
      {friends.map((friend) => {
        const isExpanded = expandedFriends.has(friend.id);
        
        return (
          <motion.div
            key={friend.id}
            layout
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Friend Header */}
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div 
                className="flex items-center space-x-3 flex-1 cursor-pointer"
                onClick={() => onToggleFriendExpanded(friend.id)}
              >
                <div className="relative">
                  <ImageWithFallback
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="text-left">
                  <h3 className="font-bold text-[#0B1F3A]">{friend.name}</h3>
                  <p className="text-sm text-gray-600">
                    {friend.savedCount} saved restaurant{friend.savedCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  className="w-8 h-8 bg-[#F14C35]/10 text-[#F14C35] rounded-full flex items-center justify-center hover:bg-[#F14C35] hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggleFriendExpanded(friend.id)}
                  className="flex items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>
              </div>
            </div>

            {/* Friend's Restaurants */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-100 p-4 pt-0">
                    {friend.savedRestaurants.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">
                          {friend.name} hasn't saved any restaurants yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        {friend.savedRestaurants.map((restaurant) => {
                          const isCopied = copiedItems.has(restaurant.id);
                          
                          return (
                            <motion.div
                              key={restaurant.id}
                              layout
                              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                              {/* Restaurant Image */}
                              <button
                                onClick={() => onRestaurantClick(restaurant)}
                                className="flex-shrink-0"
                              >
                                <ImageWithFallback
                                  src={restaurant.image}
                                  alt={restaurant.name}
                                  className="w-16 h-16 rounded-xl object-cover"
                                />
                              </button>
                              
                              {/* Restaurant Info */}
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => onRestaurantClick(restaurant)}
                              >
                                <h4 className="font-bold text-[#0B1F3A] text-sm mb-1">
                                  {restaurant.name}
                                </h4>
                                
                                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 text-[#FFD74A] fill-[#FFD74A]" />
                                    <span>{restaurant.rating}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{restaurant.distance}</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1">
                                  {restaurant.cuisine.slice(0, 2).map((cuisine, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full"
                                    >
                                      {cuisine}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Copy Action */}
                              <div className="flex-shrink-0">
                                <motion.button
                                  onClick={() => onCopyToPlate(restaurant)}
                                  disabled={isCopied}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                    isCopied
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-[#F14C35]/10 text-[#F14C35] hover:bg-[#F14C35] hover:text-white'
                                  }`}
                                  whileHover={{ scale: isCopied ? 1 : 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {isCopied ? (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-4 h-4 flex items-center justify-center"
                                    >
                                      ✓
                                    </motion.div>
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
