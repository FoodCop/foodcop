import React from 'react';
import { motion } from 'framer-motion';
import { X, Navigation, Heart } from 'lucide-react';
import { FuzoButton } from './FuzoButton';
import type { Restaurant } from './ScoutPage';

interface TakoToastProps {
  restaurant: Restaurant;
  onPlanRoute: () => void;
  onSaveToPlate: () => void;
  onClose: () => void;
}

export function TakoToast({ restaurant, onPlanRoute, onSaveToPlate, onClose }: TakoToastProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className="fixed bottom-6 left-4 right-4 z-50"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center space-x-3">
            {/* Tako Mascot */}
            <motion.div 
              className="w-12 h-12 bg-[#F14C35] rounded-full flex items-center justify-center"
              animate={{ 
                rotate: [0, -5, 5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <span className="text-2xl">🐙</span>
            </motion.div>
            
            <div>
              <h3 className="font-bold text-[#0B1F3A] text-sm">Tako here!</h3>
              <p className="text-xs text-gray-600">Your food guide</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* Message */}
        <div className="px-4 pb-4">
          <div className="bg-[#F14C35]/5 rounded-2xl p-4 mb-4 relative">
            <p className="text-[#0B1F3A] font-medium text-sm leading-relaxed">
              Great choice! <span className="font-bold">{restaurant.name}</span> looks delicious. 
              Shall I plan a route or save this to your Plate for later?
            </p>
            
            {/* Speech bubble tail */}
            <div className="absolute -left-2 top-4 w-4 h-4 bg-[#F14C35]/5 transform rotate-45"></div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <FuzoButton
              variant="secondary"
              size="sm"
              className="w-full text-sm"
              onClick={onPlanRoute}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Plan Route
            </FuzoButton>
            
            <FuzoButton
              variant="primary"
              size="sm"
              className="w-full text-sm"
              onClick={onSaveToPlate}
            >
              <Heart className="w-4 h-4 mr-2" />
              Save to Plate
            </FuzoButton>
          </div>
          
          {/* Restaurant Preview */}
          <div className="flex items-center space-x-3 mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
              <img 
                src={restaurant.image} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNi42NjY3IDI2LjY2NjdIMjMuMzMzM0MyMy43MDE1IDI2LjY2NjcgMjQgMjYuMzY4MiAyNCAyNkMyNCAyNS42MzE4IDIzLjcwMTUgMjUuMzMzMyAyMy4zMzMzIDI1LjMzMzNIMTYuNjY2N0MxNi4yOTg1IDI1LjMzMzMgMTYgMjUuNjMxOCAxNiAyNkMxNiAyNi4zNjgyIDE2LjI5ODUgMjYuNjY2NyAxNi42NjY3IDI2LjY2NjdaIiBmaWxsPSIjOUM5OUE5Ii8+CjxwYXRoIGQ9Ik0xNi42NjY3IDIxLjMzMzNIMjMuMzMzM0MyMy43MDE1IDIxLjMzMzMgMjQgMjEuMDM0OCAyNCAyMC42NjY3QzI0IDIwLjI5ODUgMjMuNzAxNSAyMCAyMy4zMzMzIDIwSDE2LjY2NjdDMTYuMjk4NSAyMCAxNiAyMC4yOTg1IDE2IDIwLjY2NjdDMTYgMjEuMDM0OCAxNi4yOTg1IDIxLjMzMzMgMTYuNjY2NyAyMS4zMzMzWiIgZmlsbD0iIzlDOTlBOSIvPgo8L3N2Zz4K';
                }}
              />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-[#0B1F3A] text-sm">{restaurant.name}</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <span>⭐ {restaurant.rating}</span>
                <span>•</span>
                <span>{restaurant.distance}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom accent */}
        <div className="h-1 bg-gradient-to-r from-[#F14C35] to-[#A6471E]"></div>
      </div>
    </motion.div>
  );
}
