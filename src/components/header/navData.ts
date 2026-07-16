// FUZO's real route map, used to drive the header nav / mobile menu / cuisine dropdown.
// Replaces Ekomart's Shop/Vendor/Blog mega-menu, which pointed at pages that don't exist here.

export const primaryLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Scout', href: '/scout' },
  { label: 'Discover', href: '/discover' },
  { label: 'Rewards', href: '/rewards' },
];

export const moreLinks = [
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Chef AI', href: '/ai-chef' },
];

export const cuisines = [
  { icon: '01.svg', label: 'Italian', slug: 'italian' },
  { icon: '02.svg', label: 'Japanese', slug: 'japanese' },
  { icon: '03.svg', label: 'Mexican', slug: 'mexican' },
  { icon: '04.svg', label: 'Indian', slug: 'indian' },
  { icon: '05.svg', label: 'Thai', slug: 'thai' },
  { icon: '06.svg', label: 'Mediterranean', slug: 'mediterranean' },
  { icon: '07.svg', label: 'American', slug: 'american' },
  { icon: '08.svg', label: 'Chinese', slug: 'chinese' },
  { icon: '09.svg', label: 'Vegan & Plant-Based', slug: 'vegan' },
  { icon: '10.svg', label: 'Desserts & Bakes', slug: 'desserts' },
];
