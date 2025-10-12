'use client';

import React, { useState } from 'react';
import { Bell, Search, Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CHAT_COLORS } from '../utils/ChatTypes';

interface ChatHeaderProps {
  onSearchChange?: (query: string) => void;
  unreadNotifications?: number;
  onMenuAction?: (action: string) => void;
  className?: string;
}

export function ChatHeader({ 
  onSearchChange, 
  unreadNotifications = 0,
  onMenuAction,
  className = '' 
}: ChatHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleMenuAction = (action: string) => {
    onMenuAction?.(action);
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b bg-gradient-to-r from-[#FF6B35] to-[#F7931E] px-4 py-3 ${className}`}
      style={{
        background: CHAT_COLORS.primary,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <span className="text-lg font-bold text-white">💬</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Chatdo</h1>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative h-10 w-10 rounded-full hover:bg-white/20 p-0"
            onClick={() => handleMenuAction('notifications')}
          >
            <Bell className="h-5 w-5 text-white" />
            {unreadNotifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Badge>
            )}
          </Button>

          {/* Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full hover:bg-white/20 p-0"
            onClick={() => handleMenuAction('menu')}
          >
            <Menu className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search for contacts"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full rounded-full border-0 bg-white/90 pl-10 pr-4 backdrop-blur transition-all duration-200 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-white/50 ${
              isSearchFocused ? 'shadow-lg' : 'shadow-sm'
            }`}
          />
        </div>
      </div>
    </header>
  );
}