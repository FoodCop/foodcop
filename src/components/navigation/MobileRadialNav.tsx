import { RadialMenu } from './components/RadialMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Rss, 
  Search, 
  Camera, 
  Pizza, 
  Scissors, 
  Utensils, 
  MessageCircle, 
  LayoutDashboard 
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

interface MobileRadialNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileRadialNav = ({ currentPage, onNavigate }: MobileRadialNavProps) => {
  const { toggleChat } = useChatStore();
  
  const handleNavigate = (route: string) => {
    console.log('🔵 RadialNav handleNavigate:', route);
    if (route === 'takoai') {
      console.log('🔵 Opening TakoAI chat');
      toggleChat();
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
      label: 'TakoAI',
      route: 'takoai',
      icon: <MessageCircle size={20} />,
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
