// Mock data for FriendsTab component
export const createMockActivities = (friends: any[]) => [
  {
    id: '1',
    friend: friends[0],
    type: 'saved' as const,
    restaurant: friends[0]?.savedRestaurants[0],
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    friend: friends[1],
    type: 'visited' as const,
    restaurant: friends[1]?.savedRestaurants[0],
    timestamp: '5 hours ago'
  },
  {
    id: '3',
    friend: friends[2],
    type: 'saved' as const,
    restaurant: friends[2]?.savedRestaurants[0],
    timestamp: '1 day ago'
  }
];

export const suggestedFriends = [
  {
    id: 'suggested1',
    name: 'Alex Kim',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    mutualFriends: 3,
    savedCount: 24
  },
  {
    id: 'suggested2',
    name: 'Maria Santos',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8e5?w=100',
    mutualFriends: 5,
    savedCount: 18
  }
];

export const interestGroups = [
  'Sushi Lovers',
  'Pizza Fanatics', 
  'Vegan Foodies',
  'Coffee Addicts'
];