// Restaurant marker icons and categories
// Maps restaurant types to specific icons and colors

export const RESTAURANT_CATEGORIES = {
  restaurant: {
    icon: '🍽️',
    color: '#FF6B6B',
    label: 'Restaurant',
    searchTypes: ['restaurant', 'meal_takeaway', 'meal_delivery']
  },
  cafe: {
    icon: '☕',
    color: '#8B4513',
    label: 'Café',
    searchTypes: ['cafe', 'coffee_shop']
  },
  fast_food: {
    icon: '🍔',
    color: '#FF8C00',
    label: 'Fast Food',
    searchTypes: ['fast_food', 'meal_takeaway']
  },
  bakery: {
    icon: '🥖',
    color: '#DAA520',
    label: 'Bakery',
    searchTypes: ['bakery']
  },
  bar: {
    icon: '🍺',
    color: '#32CD32',
    label: 'Bar',
    searchTypes: ['bar', 'night_club', 'liquor_store']
  },
  pizza: {
    icon: '🍕',
    color: '#FF4500',
    label: 'Pizza',
    searchTypes: ['pizza']
  },
  ice_cream: {
    icon: '🍦',
    color: '#FFC0CB',
    label: 'Ice Cream',
    searchTypes: ['ice_cream']
  },
  asian: {
    icon: '🥢',
    color: '#FF69B4',
    label: 'Asian',
    searchTypes: ['chinese_restaurant', 'japanese_restaurant', 'korean_restaurant', 'thai_restaurant', 'vietnamese_restaurant']
  },
  mexican: {
    icon: '🌮',
    color: '#FFA500',
    label: 'Mexican',
    searchTypes: ['mexican_restaurant']
  }
} as const;

export type RestaurantCategory = keyof typeof RESTAURANT_CATEGORIES;

// Function to determine category from Google Places types
export function getCategoryFromPlaceTypes(types: string[]): RestaurantCategory {
  // Priority matching - more specific categories first
  if (types.some(type => RESTAURANT_CATEGORIES.pizza.searchTypes.includes(type as any))) {
    return 'pizza';
  }
  if (types.some(type => RESTAURANT_CATEGORIES.ice_cream.searchTypes.includes(type as any))) {
    return 'ice_cream';
  }
  if (types.some(type => RESTAURANT_CATEGORIES.bakery.searchTypes.includes(type as any))) {
    return 'bakery';
  }
  if (types.some(type => RESTAURANT_CATEGORIES.mexican.searchTypes.includes(type as any))) {
    return 'mexican';
  }
  if (types.some(type => RESTAURANT_CATEGORIES.asian.searchTypes.includes(type as any))) {
    return 'asian';
  }
  if (types.some(type => RESTAURANT_CATEGORIES.cafe.searchTypes.includes(type as any))) {
    return 'cafe';
  }
  if (types.some(type => RESTAURANT_CATEGORIES.fast_food.searchTypes.includes(type as any))) {
    return 'fast_food';
  }
  if (types.some(type => RESTAURANT_CATEGORIES.bar.searchTypes.includes(type as any))) {
    return 'bar';
  }
  
  // Default to restaurant
  return 'restaurant';
}

// Create marker element for MapLibre
export function createRestaurantMarkerElement(
  category: RestaurantCategory,
  isSelected: boolean = false
): HTMLElement {
  const el = document.createElement('div');
  const categoryData = RESTAURANT_CATEGORIES[category];
  
  el.className = `restaurant-marker ${isSelected ? 'selected' : ''}`;
  el.innerHTML = `
    <div class="marker-icon">
      <span class="marker-emoji">${categoryData.icon}</span>
    </div>
    <div class="marker-shadow"></div>
  `;
  
  // Set custom properties for dynamic styling
  el.style.setProperty('--marker-color', categoryData.color);
  
  return el;
}

// Price level indicators
export const PRICE_LEVELS = {
  0: { symbol: '', label: 'Free' },
  1: { symbol: '$', label: 'Inexpensive' },
  2: { symbol: '$$', label: 'Moderate' },
  3: { symbol: '$$$', label: 'Expensive' },
  4: { symbol: '$$$$', label: 'Very Expensive' }
} as const;

// Rating stars helper
export function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
}

// Calculate distance from user location
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}