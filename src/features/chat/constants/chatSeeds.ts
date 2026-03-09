export const DEFAULT_FRIENDS = [
  { id: 1, name: 'Marcus Chef', avatar: 'https://i.pravatar.cc/150?u=1', time: '12m' },
  { id: 2, name: 'Sarah Foodie', avatar: 'https://i.pravatar.cc/150?u=2', time: '1h' },
  { id: 3, name: 'Chef Elena', avatar: 'https://i.pravatar.cc/150?u=3', time: '3h' },
];

export const INITIAL_MESSAGES_BY_FRIEND: Record<number, any[]> = {
  1: [{ role: 'ai', text: 'Yo! Ready for the tasting session?' }],
  2: [{ role: 'ai', text: 'That hidden gem was 10/10!' }],
  3: [{ role: 'ai', text: 'Found some great fresh herbs today.' }],
};
