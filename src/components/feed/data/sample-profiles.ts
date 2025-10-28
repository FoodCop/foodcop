export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
  location: string;
  distance: string;
  imageUrl: string;
  description?: string;
  tags?: string[];
  ownerImage?: string;
  ownerName?: string;
}

export const sampleRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'The Garden Bistro',
    cuisine: 'French',
    priceRange: '$$',
    rating: 4.5,
    reviewCount: 328,
    location: 'Brooklyn, NY',
    distance: '0.5 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    description: 'Farm-to-table French cuisine with seasonal ingredients',
    tags: ['Romantic', 'Outdoor Seating', 'Wine Bar'],
    ownerImage: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80',
    ownerName: 'Chef Pierre'
  },
  {
    id: '2',
    name: 'Sake Lounge',
    cuisine: 'Japanese',
    priceRange: '$$$',
    rating: 4.7,
    reviewCount: 512,
    location: 'Manhattan, NY',
    distance: '1.2 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
    description: 'Authentic sushi and Japanese fusion dishes',
    tags: ['Sushi', 'Date Night', 'Cocktails'],
    ownerImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    ownerName: 'Chef Yuki'
  },
  {
    id: '3',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    priceRange: '$',
    rating: 4.3,
    reviewCount: 892,
    location: 'Brooklyn, NY',
    distance: '0.8 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    description: 'Street-style tacos and fresh margaritas',
    tags: ['Casual', 'Happy Hour', 'Outdoor Seating'],
    ownerImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
    ownerName: 'Chef Carlos'
  },
  {
    id: '4',
    name: 'Bella Italia',
    cuisine: 'Italian',
    priceRange: '$$',
    rating: 4.6,
    reviewCount: 445,
    location: 'Queens, NY',
    distance: '2.1 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    description: 'Traditional Italian pasta and wood-fired pizza',
    tags: ['Family Friendly', 'Pizza', 'Wine'],
    ownerImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    ownerName: 'Chef Marco'
  },
  {
    id: '5',
    name: 'The Craft House',
    cuisine: 'American',
    priceRange: '$$',
    rating: 4.4,
    reviewCount: 267,
    location: 'Brooklyn, NY',
    distance: '1.5 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
    description: 'Craft beers and artisanal burgers',
    tags: ['Bar', 'Craft Beer', 'Sports'],
    ownerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    ownerName: 'Chef Mike'
  },
  {
    id: '6',
    name: 'Spice Route',
    cuisine: 'Indian',
    priceRange: '$$',
    rating: 4.8,
    reviewCount: 621,
    location: 'Manhattan, NY',
    distance: '1.8 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    description: 'Modern Indian cuisine with bold flavors',
    tags: ['Vegetarian Options', 'Spicy', 'Lunch Special'],
    ownerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    ownerName: 'Chef Raj'
  },
  {
    id: '7',
    name: 'Coastal Seafood Bar',
    cuisine: 'Seafood',
    priceRange: '$$$',
    rating: 4.5,
    reviewCount: 389,
    location: 'Brooklyn, NY',
    distance: '0.9 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    description: 'Fresh seafood and raw bar selections',
    tags: ['Oysters', 'Happy Hour', 'Waterfront'],
    ownerImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
    ownerName: 'Chef David'
  },
  {
    id: '8',
    name: 'The Green Bowl',
    cuisine: 'Healthy',
    priceRange: '$',
    rating: 4.2,
    reviewCount: 534,
    location: 'Manhattan, NY',
    distance: '1.1 miles away',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    description: 'Organic bowls, smoothies, and plant-based options',
    tags: ['Vegan', 'Healthy', 'Quick Bites'],
    ownerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    ownerName: 'Chef Emma'
  }
];
