import { useState } from 'react';
import { 
  Rss, 
  Search, 
  Camera, 
  Pizza, 
  Scissors, 
  Utensils, 
  Send,
  X
} from 'lucide-react';
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
      icon: <Rss size={20} />,
      color: '#FFC909'
    },
    {
      label: 'Scout',
      route: 'scout',
      icon: <Search size={20} />,
      color: '#4A90E2'
    },
    {
      label: 'Snap',
      route: 'snap',
      icon: <Camera size={20} />,
      color: '#9B59B6'
    },
    {
      label: 'Bites',
      route: 'bites',
      icon: <Pizza size={20} />,
      color: '#E74C3C'
    },
    {
      label: 'Trims',
      route: 'trims',
      icon: <Scissors size={20} />,
      color: '#F39C12'
    },
    {
      label: 'Plate',
      route: 'plate',
      icon: <Utensils size={20} />,
      color: '#2ECC71'
    },
    {
      label: unreadCount > 0 ? `Chat (${unreadCount})` : 'Chat',
      route: 'messages',
      icon: <Send size={20} />,
      color: '#1ABC9C',
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
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                style={{
                  minWidth: '56px',
                  border: isActive ? 'none' : '1px solid #E5E7EB'
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
            : 'bg-gradient-to-br from-orange-500 to-orange-600 rotate-0'
          }`}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
          {isOpen ? (
            <X size={24} className="text-white" />
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
