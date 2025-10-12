'use client';

import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserStory } from '../utils/ChatTypes';
import { getAvatarFallback, getAvatarGradient, getPlaceholderAvatar } from '../utils/ChatUtils';

interface StoriesBarProps {
  stories: UserStory[];
  onStoryClick?: (story: UserStory) => void;
  onAddStoryClick?: () => void;
  currentUserId?: string;
  className?: string;
}

export function StoriesBar({ 
  stories, 
  onStoryClick, 
  onAddStoryClick,
  currentUserId,
  className = '' 
}: StoriesBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleStoryClick = (story: UserStory) => {
    onStoryClick?.(story);
  };

  const handleAddStoryClick = () => {
    onAddStoryClick?.();
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className={`bg-white border-b ${className}`}>
      <div className="relative">
        {/* Stories Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Add Your Story Button */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-16 w-16 rounded-full border-2 border-dashed border-gray-300 hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 p-0"
              onClick={handleAddStoryClick}
            >
              <Plus className="h-6 w-6 text-gray-500" />
            </Button>
            <span className="text-xs text-gray-600 max-w-[60px] truncate">Your story</span>
          </div>

          {/* Friend Stories */}
          {stories.map((story) => (
            <div 
              key={story.id} 
              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
              onClick={() => handleStoryClick(story)}
            >
              <div className="relative">
                {/* Story Ring */}
                <div 
                  className={`h-16 w-16 rounded-full p-0.5 ${
                    story.viewed 
                      ? 'bg-gray-300' 
                      : story.is_close_friend
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E]'
                  }`}
                >
                  <Avatar className="h-full w-full border-2 border-white">
                    <AvatarImage 
                      src={story.avatar_url || getPlaceholderAvatar(story.user_name)} 
                      alt={story.user_name}
                    />
                    <AvatarFallback className={`bg-gradient-to-r ${getAvatarGradient(story.user_id)} text-white font-semibold`}>
                      {getAvatarFallback(story.user_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Story Count Badge */}
                {story.story_count > 1 && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#FF6B35] text-xs text-white flex items-center justify-center border-2 border-white">
                    {story.story_count}
                  </div>
                )}

                {/* Online Status Indicator */}
                <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
              </div>

              {/* User Name */}
              <span className="text-xs text-gray-700 max-w-[60px] truncate font-medium">
                {story.user_name}
              </span>
            </div>
          ))}
        </div>

        {/* Scroll Indicators (for desktop) */}
        <div className="hidden md:block">
          {/* Left Scroll Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur shadow-md hover:bg-white p-0"
            onClick={scrollLeft}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>

          {/* Right Scroll Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur shadow-md hover:bg-white p-0"
            onClick={scrollRight}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}