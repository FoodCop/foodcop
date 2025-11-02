import { Home, MapPin, MessageCircle, Bookmark, User } from 'lucide-react';

interface NavTab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  page: string;
  badgeCount?: number;
}

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileBottomNav = ({ currentPage, onNavigate }: MobileBottomNavProps) => {
  const tabs: NavTab[] = [
    {
      id: 'feed',
      icon: Home,
      label: 'Feed',
      page: 'feed'
    },
    {
      id: 'scout',
      icon: MapPin,
      label: 'Scout',
      page: 'scout'
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      page: 'chat',
      badgeCount: 0 // TODO: Connect to unread message count
    },
    {
      id: 'plate',
      icon: Bookmark,
      label: 'Plate',
      page: 'plate'
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      page: 'dash'
    }
  ];

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.page;
          
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.page)}
              className={`
                flex flex-col items-center justify-center
                min-w-[60px] h-full
                touch-target
                transition-colors duration-200
                relative
                ${isActive 
                  ? 'text-orange-600' 
                  : 'text-gray-500 active:text-gray-700'
                }
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon Container */}
              <div className="relative">
                <Icon 
                  className={`
                    w-6 h-6
                    transition-all duration-200
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}
                />
                
                {/* Badge for unread messages */}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                    {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={`
                  text-[10px] mt-1 font-medium
                  transition-all duration-200
                  ${isActive ? 'opacity-100' : 'opacity-70'}
                `}
              >
                {tab.label}
              </span>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
