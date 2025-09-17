import React from 'react';
import { Clock, Star, Copy } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { Restaurant } from '../ScoutPage';

interface Activity {
  id: string;
  friend: {
    name: string;
    avatar: string;
  } | undefined;
  type: 'saved' | 'visited';
  restaurant: Restaurant | undefined;
  timestamp: string;
}

interface ActivityTabContentProps {
  activities: Activity[];
  onCopyToPlate: (restaurant: Restaurant) => void;
}

export function ActivityTabContent({ activities, onCopyToPlate }: ActivityTabContentProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-bold text-[#0B1F3A] mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-[#F14C35]" />
          <span>Recent Activity</span>
        </h3>
        
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <ImageWithFallback
                src={activity.friend?.avatar || ''}
                alt={activity.friend?.name || ''}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm text-[#0B1F3A]">
                  <span className="font-bold">{activity.friend?.name}</span>
                  {activity.type === 'saved' ? (
                    <span> saved <span className="font-medium">{activity.restaurant?.name}</span></span>
                  ) : (
                    <span> visited <span className="font-medium">{activity.restaurant?.name}</span></span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                
                {activity.restaurant && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ImageWithFallback
                        src={activity.restaurant.image}
                        alt={activity.restaurant.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-[#0B1F3A]">
                          {activity.restaurant.name}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 text-[#FFD74A] fill-[#FFD74A]" />
                          <span>{activity.restaurant.rating}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onCopyToPlate(activity.restaurant!)}
                        className="w-6 h-6 bg-[#F14C35]/10 text-[#F14C35] rounded-full flex items-center justify-center hover:bg-[#F14C35] hover:text-white transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
