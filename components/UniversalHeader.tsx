import React from 'react';
import { Menu, MessageCircle, User } from 'lucide-react';
import { Badge } from './ui/badge';

interface UniversalHeaderProps {
  onNavigateToChat?: () => void;
  onNavigateToProfile?: () => void;
  onTogglePageSelector?: () => void;
  unreadChatCount?: number;
  showChatButton?: boolean;
  showProfileButton?: boolean;
  showPageSelector?: boolean;
  title?: string;
  leftContent?: React.ReactNode;
}

export function UniversalHeader({ 
  onNavigateToChat, 
  onNavigateToProfile, 
  onTogglePageSelector,
  unreadChatCount = 0,
  showChatButton = true,
  showProfileButton = true,
  showPageSelector = true,
  title,
  leftContent
}: UniversalHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-4 z-40 sticky top-0">
      <div className="flex items-center justify-between">
        {/* Left Content */}
        <div className="flex items-center space-x-3">
          {leftContent || (
            <>
              <div className="w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🐙</span>
              </div>
              {title && (
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-[#0B1F3A]">{title}</h1>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Chat Button */}
          {showChatButton && (
            <button 
              onClick={onNavigateToChat}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors relative"
            >
              <MessageCircle className="w-5 h-5 text-gray-600" />
              {unreadChatCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center p-0 bg-red-500 hover:bg-red-500"
                >
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </Badge>
              )}
            </button>
          )}

          {/* Profile Button */}
          {showProfileButton && (
            <button 
              onClick={onNavigateToProfile}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Page Selector Hamburger Menu */}
          {showPageSelector && (
            <button 
              onClick={onTogglePageSelector}
              className="w-10 h-10 rounded-xl bg-[#F14C35] hover:bg-[#A6471E] text-white flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
