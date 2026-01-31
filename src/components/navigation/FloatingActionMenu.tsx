import { useState } from 'react';
import {
  RssFeed,
  Search,
  CameraAlt,
  LocalPizza,
  ContentCut,
  Restaurant,
  Send,
  Close
} from '@mui/icons-material';
import { useDMChatStore } from '../../stores/chatStore';

interface FloatingActionMenuProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const FloatingActionMenu = ({ currentPage, onNavigate }: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openChat, unreadCount } = useDMChatStore();
  
  const handleNavigate = (route: string) => {
    console.log('🔵 FloatingActionMenu handleNavigate:', route);
    if (route === 'messages') {
      console.log('🔵 Opening DM Chat');
      openChat();
      setIsOpen(false);
      return;
    }
    onNavigate(route);
    setIsOpen(false);
  };

  const menuItems = [
    {
      label: 'Feed',
      route: 'feed',
      icon: <RssFeed style={{ fontSize: 20 }} />,
      color: 'var(--color-menu-feed)'
    },
    {
      label: 'Scout',
      route: 'scout',
      icon: <Search style={{ fontSize: 20 }} />,
      color: 'var(--color-menu-scout)'
    },
    {
      label: 'Snap',
      route: 'snap',
      icon: <CameraAlt style={{ fontSize: 20 }} />,
      color: 'var(--color-menu-snap)'
    },
    {
      label: 'Bites',
      route: 'bites',
      icon: <LocalPizza style={{ fontSize: 20 }} />,
      color: 'var(--color-menu-bites)'
    },
    {
      label: 'Trims',
      route: 'trims',
      icon: <ContentCut style={{ fontSize: 20 }} />,
      color: 'var(--color-menu-trims)'
    },
    {
      label: 'Plate',
      route: 'plate',
      icon: <Restaurant style={{ fontSize: 20 }} />,
      color: 'var(--color-menu-plate)'
    },
    {
      label: unreadCount > 0 ? `Chat (${unreadCount})` : 'Chat',
      route: 'messages',
      icon: <Send style={{ fontSize: 20 }} />,
      color: 'var(--color-menu-chat)',
      showBadge: unreadCount > 0,
      badgeCount: unreadCount
    },
  ];

  // Reverse for upward stacking (last item appears first from bottom)
  const displayItems = [...menuItems].reverse();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu Items - Pop upward */}
      <div className="flex flex-col-reverse items-center gap-3 mb-3">
        {displayItems.map((item, index) => {
          const isActive = item.route === currentPage;
          const delay = index * 30; // Stagger animation
          
          return (
            <div
              key={item.route}
              className={`transition-all duration-300 ease-out ${
                isOpen 
                  ? 'opacity-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
              style={{
                transitionDelay: isOpen ? `${delay}ms` : '0ms'
              }}
            >
              <button
                onClick={() => handleNavigate(item.route)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-full shadow-lg 
                  transition-all duration-200 hover:scale-105 active:scale-95
                  ${isActive 
                    ? 'text-gray-900 hover:text-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                style={{
                  minWidth: '56px',
                  border: isActive ? 'none' : '1px solid var(--color-border)',
                  backgroundColor: isActive ? 'var(--menu-bg)' : undefined
                }}
                aria-label={item.label}
              >
                {item.icon}
                <span className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'
                } overflow-hidden`}>
                  {item.label}
                </span>
                
                {/* Badge for unread count */}
                {item.showBadge && item.badgeCount && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold 
                    rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {item.badgeCount > 9 ? '9+' : item.badgeCount}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
          transition-all duration-300 hover:scale-110 active:scale-95
          ${isOpen 
            ? 'bg-gray-700 rotate-0' 
            : 'rotate-0'
          }`}
        style={{
          backgroundColor: isOpen ? undefined : 'var(--menu-bg)'
        }}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
          {isOpen ? (
            <Close style={{ fontSize: 24 }} className="text-white" />
          ) : (
            <img 
              src="/logo_white.png"
              alt="FUZO"
              className="w-8 h-8 object-contain"
            />
          )}
        </div>
      </button>

      {/* Backdrop - close menu when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
