import React from 'react';
import { UserPlus, Utensils } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { FuzoButton } from '../global/FuzoButton';

interface SuggestedFriend {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
  savedCount: number;
}

interface DiscoverTabContentProps {
  suggestedFriends: SuggestedFriend[];
  interestGroups: string[];
}

export function DiscoverTabContent({ suggestedFriends, interestGroups }: DiscoverTabContentProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-bold text-[#0B1F3A] mb-4 flex items-center space-x-2">
          <UserPlus className="w-5 h-5 text-[#F14C35]" />
          <span>People You May Know</span>
        </h3>
        
        <div className="space-y-3">
          {suggestedFriends.map((person) => (
            <div key={person.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <ImageWithFallback
                src={person.avatar}
                alt={person.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h4 className="font-bold text-[#0B1F3A] text-sm">{person.name}</h4>
                <p className="text-xs text-gray-600">
                  {person.mutualFriends} mutual friends • {person.savedCount} saved places
                </p>
              </div>
              <FuzoButton variant="secondary" size="sm">
                <UserPlus className="w-3 h-3 mr-1" />
                Add
              </FuzoButton>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-bold text-[#0B1F3A] mb-4 flex items-center space-x-2">
          <Utensils className="w-5 h-5 text-[#F14C35]" />
          <span>Find Friends by Interests</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {interestGroups.map((interest) => (
            <button
              key={interest}
              className="p-3 bg-gray-50 rounded-xl text-center hover:bg-[#F14C35]/10 hover:text-[#F14C35] transition-colors"
            >
              <p className="text-sm font-medium">{interest}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
