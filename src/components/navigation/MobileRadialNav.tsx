import { RadialMenu } from './components/RadialMenu';
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

interface MobileRadialNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileRadialNav = ({ currentPage, onNavigate }: MobileRadialNavProps) => {
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
      label: 'Chat',
      route: 'chat',
      icon: <MessageCircle size={20} />,
    },
    {
      label: 'Dash',
      route: 'dash',
      icon: <LayoutDashboard size={20} />,
    },
  ];

  return (
    <RadialMenu 
      items={menuItems}
      onNavigate={onNavigate}
      currentRoute={currentPage}
      barrelColor="#FF6B35"
    />
  );
};
