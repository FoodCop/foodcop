import { useState } from 'react';
import { Users, Clock, UserPlus } from 'lucide-react';
import type { Restaurant } from '../ScoutPage';

export function useFriendsTabLogic(onCopyToPlate: (restaurant: Restaurant) => void) {
  const [expandedFriends, setExpandedFriends] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('friends');

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'discover', label: 'Discover', icon: UserPlus }
  ];

  const toggleFriendExpanded = (friendId: string) => {
    const newExpanded = new Set(expandedFriends);
    if (newExpanded.has(friendId)) {
      newExpanded.delete(friendId);
    } else {
      newExpanded.add(friendId);
    }
    setExpandedFriends(newExpanded);
  };

  const handleCopyToPlate = (restaurant: Restaurant) => {
    onCopyToPlate(restaurant);
    setCopiedItems(prev => new Set([...prev, restaurant.id]));
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurant.id);
        return newSet;
      });
    }, 2000);
  };

  return {
    expandedFriends,
    copiedItems,
    activeTab,
    tabs,
    toggleFriendExpanded,
    handleCopyToPlate,
    setActiveTab
  };
}