import { RadialMenu } from './components/RadialMenu';
import { 
  Rss, 
  Search, 
  Camera, 
  Pizza, 
  Scissors, 
  Utensils, 
  MessageCircle,
  Send
} from 'lucide-react';
import { useDMChatStore } from '../../stores/chatStore';

interface MobileRadialNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileRadialNav = ({ currentPage, onNavigate }: MobileRadialNavProps) => {
  const { openChat, unreadCount } = useDMChatStore();
  
  const handleNavigate = (route: string) => {
    console.log('🔵 RadialNav handleNavigate:', route);
    if (route === 'messages') {
      console.log('🔵 Opening DM Chat');
      openChat();
      return; // Don't navigate
    }
    onNavigate(route);
  };

  const menuItems = [
    {
      label: 'Feed',
      route: 'feed',
      icon: <Rss size={20} />,
    },
    {
      label: 'Scout',
      route: 'scout',
      icon: <Search size={20} />,
    },
    {
      label: 'Snap',
      route: 'snap',
      icon: <Camera size={20} />,
    },
    {
      label: 'Bites',
      route: 'bites',
      icon: <Pizza size={20} />,
    },
    {
      label: 'Trims',
      route: 'trims',
      icon: <Scissors size={20} />,
    },
    {
      label: 'Plate',
      route: 'plate',
      icon: <Utensils size={20} />,
    },
    {
      label: unreadCount > 0 ? `Chat (${unreadCount})` : 'Chat',
      route: 'messages',
      icon: <Send size={20} />,
    },
  ];

  return (
    <RadialMenu 
      items={menuItems}
      onNavigate={handleNavigate}
      currentRoute={currentPage}
      barrelColor="#FF6B35"
    />
  );
};
