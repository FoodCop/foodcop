import { RadialMenu } from './components/RadialMenu';
import { 
  RssFeed,
  Search, 
  CameraAlt, 
  LocalPizza,
  ContentCut,
  Restaurant, 
  Message,
  Send
} from '@mui/icons-material';
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
      icon: <RssFeed style={{ fontSize: 20 }} />,
    },
    {
      label: 'Scout',
      route: 'scout',
      icon: <Search style={{ fontSize: 20 }} />,
    },
    {
      label: 'Snap',
      route: 'snap',
      icon: <CameraAlt style={{ fontSize: 20 }} />,
    },
    {
      label: 'Bites',
      route: 'bites',
      icon: <LocalPizza style={{ fontSize: 20 }} />,
    },
    {
      label: 'Trims',
      route: 'trims',
      icon: <ContentCut style={{ fontSize: 20 }} />,
    },
    {
      label: 'Plate',
      route: 'plate',
      icon: <Restaurant style={{ fontSize: 20 }} />,
    },
    {
      label: unreadCount > 0 ? `Chat (${unreadCount})` : 'Chat',
      route: 'messages',
      icon: <Send style={{ fontSize: 20 }} />,
    },
  ];

  return (
    <RadialMenu 
      items={menuItems}
      onNavigate={handleNavigate}
      currentRoute={currentPage}
      barrelColor="var(--menu-bg)"
    />
  );
};
