import { useState } from 'react';
import { Search, SlidersHorizontal, Bell, Heart, MapPin, Clock, Bike, Star, Gift, Package, ShoppingBag, Home, User } from 'lucide-react';
import { SectionHeading } from '../ui/section-heading';

interface FoodStory {
  name: string;
  image: string;
}

interface Restaurant {
  id: number;
  name: string;
  image: string;
  cuisines: string;
  rating: number;
  time: string;
  delivery: string;
  price: string;
  badge?: 'fast' | 'discount' | 'toprated' | 'healthy';
  discount?: string;
  isFavorite?: boolean;
}

export default function FoodDiscoveryApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const foodStories: FoodStory[] = [
    { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop' },
    { name: 'Sushi', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop' },
    { name: 'Pasta', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop' },
    { name: 'Tacos', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop' },
    { name: 'Asian', image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=200&h=200&fit=crop' },
  ];

  const restaurants: Restaurant[] = [
    {
      id: 1,
      name: 'Sakura Kitchen',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=670&h=320&fit=crop',
      cuisines: 'Japanese, Asian Fusion',
      rating: 4.9,
      time: '20-25 min',
      delivery: 'Free',
      price: '$$',
      badge: 'fast',
      isFavorite: false,
    },
    {
      id: 2,
      name: 'Taco Fiesta',
      image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=670&h=320&fit=crop',
      cuisines: 'Mexican, Street Food',
      rating: 4.7,
      time: '15-20 min',
      delivery: '$2.99',
      price: '$',
      discount: '30% OFF',
      isFavorite: true,
    },
    {
      id: 3,
      name: 'La Bella Pasta',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=670&h=320&fit=crop',
      cuisines: 'Italian, Mediterranean',
      rating: 4.8,
      time: '30-35 min',
      delivery: 'Free',
      price: '$$$',
      badge: 'toprated',
      isFavorite: false,
    },
    {
      id: 4,
      name: 'Green Bowl',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=670&h=320&fit=crop',
      cuisines: 'Healthy, Vegan, Salads',
      rating: 4.6,
      time: '15-20 min',
      delivery: '$1.99',
      price: '$$',
      badge: 'healthy',
      isFavorite: false,
    },
  ];

  const [favoriteRestaurants, setFavoriteRestaurants] = useState<number[]>([2]);

  const toggleFavorite = (id: number) => {
    setFavoriteRestaurants(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const getBadgeStyles = (badge?: string) => {
    switch (badge) {
      case 'fast':
        return 'bg-green-500 text-white';
      case 'discount':
        return 'bg-orange-500 text-white';
      case 'toprated':
        return 'bg-yellow-500 text-white';
      case 'healthy':
        return 'bg-green-500 text-white';
      default:
        return '';
    }
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'fast':
        return <Package className="w-3 h-3" />;
      case 'toprated':
        return <Star className="w-3 h-3" />;
      case 'healthy':
        return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12.75 4.5C9.06563 4.5 5.94844 6.91406 4.88906 10.2422C6.46406 9.44531 8.24063 9 10.125 9H14.25C14.6625 9 15 9.3375 15 9.75C15 10.1625 14.6625 10.5 14.25 10.5H13.5H10.125C9.34688 10.5 8.59219 10.5891 7.86563 10.7531C6.65156 11.0297 5.52187 11.5219 4.51875 12.1922C1.79531 14.0062 0 17.1047 0 20.625V21.375C0 21.9984 0.501562 22.5 1.125 22.5C1.74844 22.5 2.25 21.9984 2.25 21.375V20.625C2.25 18.3422 3.22031 16.2891 4.77188 14.85C5.7 18.3891 8.92031 21 12.75 21H12.7969C18.9891 20.9672 24 14.8641 24 7.34061C24 5.34375 23.6484 3.44531 23.0109 1.73437C22.8891 1.41094 22.4156 1.425 22.2516 1.72969C21.3703 3.37969 19.6266 4.5 17.625 4.5H12.75Z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-[375px] mx-auto relative">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] shadow-lg flex items-center justify-center">
            <svg className="w-4 h-4.5 text-white" viewBox="0 0 16 18" fill="currentColor">
              <path d="M14.625 0C14.0625 0 10.125 1.125 10.125 6.1875V10.125C10.125 11.366 11.134 12.375 12.375 12.375H13.5V16.875C13.5 17.4973 14.0027 18 14.625 18C15.2473 18 15.75 17.4973 15.75 16.875V12.375V8.4375V1.125C15.75 0.502734 15.2473 0 14.625 0ZM2.25 0.5625C2.25 0.274219 2.03555 0.0351562 1.74727 0.00351563C1.45898 -0.028125 1.20234 0.161719 1.13906 0.439453L0.0738281 5.23125C0.0246094 5.45273 0 5.67773 0 5.90273C0 7.51641 1.23398 8.8418 2.8125 8.98594V16.875C2.8125 17.4973 3.31523 18 3.9375 18C4.55977 18 5.0625 17.4973 5.0625 16.875V8.98594C6.64102 8.8418 7.875 7.51641 7.875 5.90273C7.875 5.67773 7.85039 5.45273 7.80117 5.23125L6.73594 0.439453C6.67266 0.158203 6.40898 -0.028125 6.12422 0.00351563C5.83945 0.0351562 5.625 0.274219 5.625 0.5625V5.28047C5.625 5.47031 5.47031 5.625 5.28047 5.625C5.10117 5.625 4.95352 5.48789 4.93594 5.30859L4.49648 0.513281C4.47188 0.221484 4.2293 0 3.9375 0C3.6457 0 3.40313 0.221484 3.37852 0.513281L2.94258 5.30859C2.925 5.48789 2.77734 5.625 2.59805 5.625C2.4082 5.625 2.25352 5.47031 2.25352 5.28047V0.5625H2.25Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[#1A1A1A] font-bold text-lg leading-[18px] font-[Poppins]">FoodieHub</h1>
            <p className="text-[#6B7280] text-xs leading-4 font-[Inter]">Discover & Savor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1">
            <Bell className="w-4.5 h-5 text-[#374151]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-94"></span>
          </button>
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=72&h=72&fit=crop" 
            alt="Profile" 
            className="w-9 h-9 rounded-full shadow-[0_0_0_0_#FF6B35,0_0_0_0_#FFF]"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-[85px]">
        {/* Search Bar */}
        <section className="px-5 pt-5 pb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-14 rounded-2xl bg-[#F3F4F6] text-sm text-[#ADAEBC] placeholder:text-[#ADAEBC] border-0 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
            />
            <button className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-[#FF6B35] flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </section>

        {/* Food Stories */}
        <section className="mb-6">
          <div className="px-5 flex items-center justify-between mb-3">
            <SectionHeading>Food Stories</SectionHeading>
            <button className="text-[#FF6B35] text-sm font-semibold">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pl-5 pb-2 hide-scrollbar">
            {foodStories.map((story, index) => (
              <div key={index} className="flex flex-col items-center gap-2 min-w-[64px]">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#FF6B35] via-[#FF6B35] to-[#F7C59F]">
                  <div className="w-full h-full rounded-full p-0.5 bg-white">
                    <img 
                      src={story.image} 
                      alt={story.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-[#4B5563] text-xs font-medium text-center leading-4 font-[Inter]">{story.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Today */}
        <section className="mb-6">
          <div className="px-5 flex items-center justify-between mb-3">
            <SectionHeading>Featured Today</SectionHeading>
            <button className="text-[#FF6B35] text-sm font-semibold">See All</button>
          </div>
          <div className="px-5">
            <div className="relative w-full h-48 rounded-3xl overflow-hidden shadow-[0_8px_10px_0_rgba(0,0,0,0.1),0_20px_25px_0_rgba(0,0,0,0.1)]">
              <img 
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=670&h=384&fit=crop" 
                alt="The Grand Bistro"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
              
              <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_10px_15px_0_rgba(0,0,0,0.1)] flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-[#FF6B35]" fill="#FF6B35" />
              </button>

              <div className="absolute bottom-5 left-5 right-5">
                <div className="flex gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#FF6B35]/90 text-white text-xs font-semibold">50% OFF</span>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">Free Delivery</span>
                </div>
                <h3 className="text-white font-bold text-xl leading-7 mb-1 font-[Poppins]">The Grand Bistro</h3>
                <div className="flex items-center gap-3 text-white/90 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">4.8</span>
                  </div>
                  <span>•</span>
                  <span>Italian, French</span>
                  <span>•</span>
                  <span>25-30 min</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="mb-6">
          <div className="px-5 mb-3">
            <SectionHeading>Browse by Category</SectionHeading>
          </div>
          <div className="px-5 grid grid-cols-4 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#FFF7ED]">
              <svg className="w-6 h-6 text-[#FF6B35]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.86406 10.5C2.10937 10.5 1.5 9.89062 1.5 9.13594C1.5 9.04687 1.50937 8.9625 1.52812 8.87344C1.77656 7.88906 3.69375 1.5 12 1.5C20.3062 1.5 22.2234 7.88906 22.4719 8.87344C22.4953 8.9625 22.5 9.04687 22.5 9.13594C22.5 9.89062 21.8906 10.5 21.1359 10.5H2.86406ZM0.75 14.25C0.75 13.0078 1.75781 12 3 12H21C22.2422 12 23.25 13.0078 23.25 14.25C23.25 15.4922 22.2422 16.5 21 16.5H3C1.75781 16.5 0.75 15.4922 0.75 14.25ZM1.5 18.75C1.5 18.3375 1.8375 18 2.25 18H21.75C22.1625 18 22.5 18.3375 22.5 18.75V19.5C22.5 21.1547 21.1547 22.5 19.5 22.5H4.5C2.84531 22.5 1.5 21.1547 1.5 19.5V18.75Z"/>
              </svg>
              <div className="text-center">
                <div className="text-[#1A1A1A] text-xs font-semibold leading-none font-[Inter]">Fast</div>
                <div className="text-[#1A1A1A] text-xs font-semibold leading-none font-[Inter]">Food</div>
              </div>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#F0FDF4]">
              <svg className="w-6 h-6 text-[#16A34A]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.75 4.5C9.06563 4.5 5.94844 6.91406 4.88906 10.2422C6.46406 9.44531 8.24063 9 10.125 9H14.25C14.6625 9 15 9.3375 15 9.75C15 10.1625 14.6625 10.5 14.25 10.5H13.5H10.125C9.34688 10.5 8.59219 10.5891 7.86563 10.7531C6.65156 11.0297 5.52187 11.5219 4.51875 12.1922C1.79531 14.0062 0 17.1047 0 20.625V21.375C0 21.9984 0.501562 22.5 1.125 22.5C1.74844 22.5 2.25 21.9984 2.25 21.375V20.625C2.25 18.3422 3.22031 16.2891 4.77188 14.85C5.7 18.3891 8.92031 21 12.75 21H12.7969C18.9891 20.9672 24 14.8641 24 7.34061C24 5.34375 23.6484 3.44531 23.0109 1.73437C22.8891 1.41094 22.4156 1.425 22.2516 1.72969C21.3703 3.37969 19.6266 4.5 17.625 4.5H12.75Z"/>
              </svg>
              <div className="text-[#1A1A1A] text-xs font-semibold text-center leading-none font-[Inter]">Healthy</div>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#FEF2F2]">
              <svg className="w-6 h-6 text-[#DC2626]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.0766 0.140676C20.6203 -0.159324 21.3047 0.0328637 21.6047 0.576614L21.8297 0.984426C22.7344 2.61099 22.7578 4.53286 21.9891 6.14068C23.2406 7.4813 24 9.27661 24 11.2501C24 12.1172 23.8547 12.9516 23.5828 13.7251C23.2969 14.536 22.2469 14.4891 21.8578 13.7204L21.3094 12.6235C21.1172 12.2438 20.7281 12.0001 20.3016 12.0001H16.875C16.2516 12.0001 15.75 11.4985 15.75 10.8751V7.12505C15.75 6.50161 15.2484 6.00005 14.625 6.00005H13.8234C12.825 6.00005 12.4172 4.87974 13.3172 4.45786C14.2828 4.00318 15.3609 3.75005 16.5 3.75005C17.8266 3.75005 19.0687 4.09224 20.1469 4.69693C20.4047 3.8438 20.3203 2.89693 19.8656 2.0813L19.6406 1.67349C19.3406 1.12974 19.5328 0.445364 20.0766 0.145364V0.140676ZM8.025 16.1954L12.375 7.50005H14.25V11.2501C14.25 12.4922 15.2578 13.5001 16.5 13.5001H20.0719L21.1922 15.7407C17.4516 20.8079 11.4516 24.0001 4.8375 24.0001H2.08125C0.932813 24.0001 0 23.0672 0 21.9188C0 20.9438 0.679688 20.1001 1.63125 19.8891L3.96562 19.3688C5.72812 18.9751 7.22344 17.8126 8.02969 16.1954H8.025Z"/>
              </svg>
              <div className="text-[#1A1A1A] text-xs font-semibold text-center leading-none font-[Inter]">Spicy</div>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#FAF5FF]">
              <svg className="w-5.25 h-6 text-[#9333EA]" viewBox="0 0 21 24" fill="currentColor">
                <path d="M17.2078 7.5C17.2359 7.25156 17.25 7.00313 17.25 6.75C17.25 3.02344 14.2266 0 10.5 0C6.77344 0 3.75 3.02344 3.75 6.75C3.75 7.00313 3.76406 7.25156 3.79219 7.5H3.75C2.50781 7.5 1.5 8.50781 1.5 9.75C1.5 10.9922 2.50781 12 3.75 12H6.25781H14.7422H17.25C18.4922 12 19.5 10.9922 19.5 9.75C19.5 8.50781 18.4922 7.5 17.25 7.5H17.2078ZM4.5 13.5L9.4125 23.3297C9.61875 23.7422 10.0359 24 10.5 24C10.9641 24 11.3812 23.7422 11.5875 23.3297L16.5 13.5H4.5Z"/>
              </svg>
              <div className="text-[#1A1A1A] text-xs font-semibold text-center leading-none font-[Inter]">Desserts</div>
            </button>
          </div>
        </section>

        {/* Nearby Restaurants */}
        <section className="mb-6">
          <div className="px-5 flex items-center justify-between mb-3">
            <SectionHeading>Nearby Restaurants</SectionHeading>
            <button className="flex items-center gap-1 text-[#FF6B35] text-sm font-semibold">
              <span>Map View</span>
              <MapPin className="w-3.5 h-3 fill-current" />
            </button>
          </div>
          <div className="px-5 space-y-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="relative h-40">
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  {restaurant.badge && (
                    <div className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full ${getBadgeStyles(restaurant.badge)}`}>
                      {getBadgeIcon(restaurant.badge)}
                      <span className="text-xs font-bold">
                        {restaurant.badge === 'fast' ? 'Fast' : 
                         restaurant.badge === 'toprated' ? 'Top Rated' :
                         restaurant.badge === 'healthy' ? 'Healthy' : ''}
                      </span>
                    </div>
                  )}
                  {restaurant.discount && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#FF6B35] text-white text-xs font-bold">
                      {restaurant.discount}
                    </div>
                  )}
                  <button 
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_10px_15px_0_rgba(0,0,0,0.1)] flex items-center justify-center"
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 ${favoriteRestaurants.includes(restaurant.id) ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#374151]'}`}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-[#1A1A1A] font-bold text-base leading-6 mb-1 font-[Poppins]">{restaurant.name}</h3>
                      <p className="text-[#6B7280] text-xs leading-4 font-[Inter]">{restaurant.cuisines}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F0FDF4]">
                      <Star className="w-3.5 h-3 text-[#16A34A] fill-[#16A34A]" />
                      <span className="text-[#16A34A] text-sm font-bold font-[Inter]">{restaurant.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[#4B5563] text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{restaurant.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bike className="w-3.75 h-3 text-[#9CA3AF]" />
                        <span>{restaurant.delivery}</span>
                      </div>
                    </div>
                    <span className="text-[#FF6B35] text-xs font-semibold font-[Inter]">{restaurant.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Special Offers */}
        <section className="mb-6">
          <div className="px-5 mb-3">
            <SectionHeading>Special Offers</SectionHeading>
          </div>
          <div className="flex gap-4 overflow-x-auto pl-5 pb-2 hide-scrollbar">
            <div className="relative min-w-[288px] h-[232px] rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] shadow-[0_8px_10px_0_rgba(0,0,0,0.1),0_20px_25px_0_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="absolute -top-8 -right-16 w-32 h-32 rounded-full bg-white/10"></div>
              <div className="absolute bottom-19 -right-12 w-24 h-24 rounded-full bg-white/10"></div>
              <div className="relative p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Gift className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">Limited Time</span>
                </div>
                <h3 className="text-white font-bold text-xl leading-7 mb-2 font-[Poppins]">Get 50% Off</h3>
                <p className="text-white/90 text-sm leading-5 mb-6 font-[Inter]">On your first 3 orders. Use code: FOODIE50</p>
                <button className="w-full py-3 rounded-xl bg-white shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_10px_15px_0_rgba(0,0,0,0.1)] text-[#FF6B35] text-base font-bold font-[Inter]">
                  Claim Offer
                </button>
              </div>
            </div>
            <div className="relative min-w-[288px] h-[232px] rounded-2xl bg-gradient-to-br from-[#9333EA] to-[#DB2777] shadow-[0_8px_10px_0_rgba(0,0,0,0.1),0_20px_25px_0_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="absolute -top-8 -right-16 w-32 h-32 rounded-full bg-white/10"></div>
              <div className="absolute bottom-19 -right-12 w-24 h-24 rounded-full bg-white/10"></div>
              <div className="relative p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg className="w-5.625 h-4.5 text-white" viewBox="0 0 23 18" fill="currentColor">
                      <path d="M1.6875 0C0.755859 0 0 0.755859 0 1.6875V12.9375C0 13.8691 0.755859 14.625 1.6875 14.625H2.25C2.25 16.4883 3.76172 18 5.625 18C7.48828 18 9 16.4883 9 14.625H13.5C13.5 16.4883 15.0117 18 16.875 18C18.7383 18 20.25 16.4883 20.25 14.625H21.375C21.9973 14.625 22.5 14.1223 22.5 13.5C22.5 12.8777 21.9973 12.375 21.375 12.375V10.125V9V8.34258C21.375 7.74492 21.1395 7.17188 20.7176 6.75L18 4.03242C17.5781 3.61055 17.0051 3.375 16.4074 3.375H14.625V1.6875C14.625 0.755859 13.8691 0 12.9375 0H1.6875Z"/>
                    </svg>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">Today Only</span>
                </div>
                <h3 className="text-white font-bold text-xl leading-7 mb-2 font-[Poppins]">Free Delivery</h3>
                <p className="text-white/90 text-sm leading-5 mb-6 font-[Inter]">On all orders above $25. No minimum required!</p>
                <button className="w-full py-3 rounded-xl bg-white shadow-[0_4px_6px_0_rgba(0,0,0,0.1),0_10px_15px_0_rgba(0,0,0,0.1)] text-[#9333EA] text-base font-bold font-[Inter]">
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[375px] mx-auto h-[85px] bg-white border-t border-[#E5E7EB] pt-0.5">
        <div className="grid grid-cols-5 h-full items-center px-4">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-3 ${activeTab === 'home' ? 'text-[#FF6B35]' : 'text-[#9CA3AF]'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'home' ? 'bg-[#FF6B35]/10' : ''}`}>
              <Home className="w-5 h-4.5" fill={activeTab === 'home' ? 'currentColor' : 'none'} />
            </div>
            <span className={`text-xs ${activeTab === 'home' ? 'font-semibold' : 'font-medium'}`}>Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-1 py-3 ${activeTab === 'search' ? 'text-[#FF6B35]' : 'text-[#9CA3AF]'}`}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Search className="w-4.5 h-4.5" />
            </div>
            <span className={`text-xs ${activeTab === 'search' ? 'font-semibold' : 'font-medium'}`}>Search</span>
          </button>
          <button className="relative -mt-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] shadow-[0_25px_50px_0_rgba(0,0,0,0.25)] flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">3</span>
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center gap-1 py-3 ${activeTab === 'favorites' ? 'text-[#FF6B35]' : 'text-[#9CA3AF]'}`}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5" />
            </div>
            <span className={`text-xs ${activeTab === 'favorites' ? 'font-semibold' : 'font-medium'}`}>Favorites</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-3 ${activeTab === 'profile' ? 'text-[#FF6B35]' : 'text-[#9CA3AF]'}`}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <User className="w-4 h-4.5" />
            </div>
            <span className={`text-xs ${activeTab === 'profile' ? 'font-semibold' : 'font-medium'}`}>Profile</span>
          </button>
        </div>
      </nav>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
