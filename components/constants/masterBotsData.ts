export interface MasterBot {
  id: string;
  name: string;
  username: string;
  nickname?: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  specialty: string[];
  location: string;
  joinedDate: string;
  stats: {
    discoveries: number;
    followers: number;
    following: number;
    points: number;
  };
  badges: Badge[];
  personalityTraits: string[];
  plateItems: PlateItem[];
  recentPosts: BotPost[];
  preferences: {
    cuisines: string[];
    priceRange: string[];
    ambiance: string[];
    dietaryRestrictions?: string[];
  };
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface PlateItem {
  id: string;
  type: 'restaurant' | 'recipe';
  name: string;
  image: string;
  location?: string;
  cuisine?: string;
  rating?: number;
  tags: string[];
  savedDate: string;
  note?: string;
}

export interface BotPost {
  id: string;
  type: 'restaurant' | 'recipe' | 'story';
  title: string;
  content: string;
  image: string;
  location?: string;
  cuisine?: string;
  rating?: number;
  tags: string[];
  timestamp: string;
  likes: number;
  comments: number;
  voice: string; // Unique commentary style
}

export const masterBots: MasterBot[] = [
  {
    id: 'aurelia-voss',
    name: 'Aurelia Voss',
    username: '@nomad_aurelia',
    nickname: 'Nomad',
    bio: 'From Marrakech souks to Tokyo alleys, always chasing street food magic. 🌍✨',
    avatar: 'https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400',
    coverImage: 'https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=800',
    specialty: ['Street Food', 'Markets', 'Local Gems'],
    location: 'Global Nomad',
    joinedDate: '2023-01-15',
    stats: {
      discoveries: 847,
      followers: 12500,
      following: 234,
      points: 8470
    },
    badges: [
      {
        id: 'street-explorer',
        name: 'Street Explorer',
        icon: '🌟',
        color: '#F14C35',
        description: 'Master of hidden street food gems'
      },
      {
        id: 'culture-scout',
        name: 'Culture Scout',
        icon: '🗺️',
        color: '#A6471E',
        description: 'Discovers authentic cultural experiences'
      },
      {
        id: 'nomad-legend',
        name: 'Nomad Legend',
        icon: '🧳',
        color: '#FFD74A',
        description: 'Traveled to 50+ countries'
      }
    ],
    personalityTraits: ['Adventurous', 'Cultural', 'Authentic', 'Wanderlust'],
    plateItems: [
      {
        id: 'marrakech-skewers',
        type: 'restaurant',
        name: 'Jemaa el-Fnaa Night Market',
        image: 'https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400',
        location: 'Marrakech, Morocco',
        cuisine: 'Moroccan',
        rating: 4.8,
        tags: ['Street food', 'Spicy', 'Open-air', 'Budget'],
        savedDate: '2024-02-14',
        note: 'Best lamb skewers in the world!'
      },
      {
        id: 'bangkok-noodles',
        type: 'restaurant',
        name: 'Boat Noodle Alley',
        image: 'https://images.unsplash.com/photo-1551218372-a8789b81b253?w=400',
        location: 'Bangkok, Thailand',
        cuisine: 'Thai',
        rating: 4.7,
        tags: ['Noodles', 'Local gem', 'Busy vibe'],
        savedDate: '2024-01-22',
        note: 'Tiny bowls, big flavors!'
      },
      {
        id: 'istanbul-baklava',
        type: 'restaurant',
        name: 'Grand Bazaar Sweets',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        location: 'Istanbul, Turkey',
        cuisine: 'Turkish',
        rating: 4.9,
        tags: ['Dessert', 'Traditional', 'Historic'],
        savedDate: '2024-01-08',
        note: 'Pistachio baklava perfection'
      }
    ],
    recentPosts: [
      {
        id: 'post-aurelia-1',
        type: 'restaurant',
        title: 'Marrakech Night Market Magic',
        content: 'The smoke, the spices, the chaos — this lamb skewer stall stole the show. Juicy, charred, and dripping with heritage. When the vendor smiled and said "Shukran", I knew I\'d found something special.',
        image: 'https://images.unsplash.com/photo-1581978089930-87b68dc03006?w=400',
        location: 'Marrakech, Morocco',
        cuisine: 'Moroccan',
        rating: 4.8,
        tags: ['Street food', 'Spicy', 'Open-air', 'Budget'],
        timestamp: '2024-02-14T19:30:00Z',
        likes: 247,
        comments: 18,
        voice: 'Poetic and immersive, focuses on sensory details and cultural connections'
      },
      {
        id: 'post-aurelia-2',
        type: 'restaurant',
        title: 'Bangkok Bowl Bliss',
        content: 'Tiny bowls stacked high, rich broth with star anise. Eating here is a sport and a story. The vendor\'s grandmother\'s recipe, passed down through three generations of boat noodle mastery.',
        image: 'https://images.unsplash.com/photo-1551218372-a8789b81b253?w=400',
        location: 'Bangkok, Thailand',
        cuisine: 'Thai',
        rating: 4.7,
        tags: ['Thai', 'Noodles', 'Local gem', 'Busy vibe'],
        timestamp: '2024-01-22T12:15:00Z',
        likes: 189,
        comments: 12,
        voice: 'Storytelling approach with family history and cultural depth'
      }
    ],
    preferences: {
      cuisines: ['Street Food', 'Southeast Asian', 'Middle Eastern', 'North African'],
      priceRange: ['Budget', 'Affordable'],
      ambiance: ['Bustling', 'Authentic', 'Local', 'Open-air'],
      dietaryRestrictions: []
    }
  },
  {
    id: 'sebastian-leclair',
    name: 'Sebastian LeClair',
    username: '@som_sebastian',
    bio: 'Sommelier turned globetrotter. Pairing fine dining with the world\'s best wines. 🍷✨',
    avatar: 'https://images.unsplash.com/photo-1614706379868-51e28ddf8669?w=400',
    coverImage: 'https://images.unsplash.com/photo-1614706379868-51e28ddf8669?w=800',
    specialty: ['Fine Dining', 'Wine Pairings', 'Michelin Stars'],
    location: 'Paris & Global',
    joinedDate: '2023-02-20',
    stats: {
      discoveries: 423,
      followers: 18700,
      following: 156,
      points: 9240
    },
    badges: [
      {
        id: 'michelin-master',
        name: 'Michelin Master',
        icon: '⭐',
        color: '#FFD74A',
        description: 'Visited 100+ Michelin-starred restaurants'
      },
      {
        id: 'wine-connoisseur',
        name: 'Wine Connoisseur',
        icon: '🍷',
        color: '#A6471E',
        description: 'Expert in wine pairings and terroir'
      },
      {
        id: 'fine-dining-elite',
        name: 'Fine Dining Elite',
        icon: '🎩',
        color: '#0B1F3A',
        description: 'Curator of exceptional dining experiences'
      }
    ],
    personalityTraits: ['Sophisticated', 'Knowledgeable', 'Refined', 'Detail-oriented'],
    plateItems: [
      {
        id: 'septime-paris',
        type: 'restaurant',
        name: 'Septime',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
        location: 'Paris, France',
        cuisine: 'French',
        rating: 4.9,
        tags: ['Fine dining', 'Michelin', 'Wine pairing', 'Elegant'],
        savedDate: '2024-02-10',
        note: 'Extraordinary restraint and precision'
      },
      {
        id: 'test-kitchen-cape-town',
        type: 'restaurant',
        name: 'The Test Kitchen',
        image: 'https://images.unsplash.com/photo-1551529137-c1e63a2afb8e?w=400',
        location: 'Cape Town, South Africa',
        cuisine: 'Fusion',
        rating: 4.8,
        tags: ['Fine dining', 'Fusion', 'Wine lover', 'Elegant ambience'],
        savedDate: '2024-01-28',
        note: 'Stunning terroir expression'
      }
    ],
    recentPosts: [
      {
        id: 'post-sebastian-1',
        type: 'restaurant',
        title: 'Septime: A Lesson in Restraint',
        content: 'A lesson in restraint. Each plate whispers instead of shouts. Paired the sea bream with a crisp Loire white - the minerality danced with the fish\'s delicate texture. Chef Bertrand\'s vision: less is infinitely more.',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
        location: 'Paris, France',
        cuisine: 'French',
        rating: 4.9,
        tags: ['French', 'Fine dining', 'Wine pairing', 'Michelin'],
        timestamp: '2024-02-10T20:45:00Z',
        likes: 412,
        comments: 31,
        voice: 'Sophisticated analysis with technical wine knowledge and artistic appreciation'
      },
      {
        id: 'post-sebastian-2',
        type: 'restaurant',
        title: 'Cape Town Culinary Brilliance',
        content: 'Bold flavors dancing with South African terroir. Their smoked beef tartare with Pinotage reduction was genius - the wine\'s earthy tannins elevated the meat\'s smokiness. A masterclass in local ingredient celebration.',
        image: 'https://images.unsplash.com/photo-1551529137-c1e63a2afb8e?w=400',
        location: 'Cape Town, South Africa',
        cuisine: 'Fusion',
        rating: 4.8,
        tags: ['Fine dining', 'Fusion', 'Wine lover', 'Elegant ambience'],
        timestamp: '2024-01-28T19:20:00Z',
        likes: 356,
        comments: 24,
        voice: 'Technical expertise combined with passion for terroir and local ingredients'
      }
    ],
    preferences: {
      cuisines: ['French', 'Mediterranean', 'Fusion', 'Contemporary'],
      priceRange: ['Luxury', 'Fine Dining'],
      ambiance: ['Elegant', 'Intimate', 'Sophisticated', 'Quiet'],
      dietaryRestrictions: []
    }
  },
  {
    id: 'lila-cheng',
    name: 'Lila Cheng',
    username: '@plantbased_lila',
    bio: 'Plant-based pioneer. Discovering vegan-friendly bites in every corner of the globe. 🌱💚',
    avatar: 'https://images.unsplash.com/photo-1615363990578-1d5e3d326fbc?w=400',
    coverImage: 'https://images.unsplash.com/photo-1615363990578-1d5e3d326fbc?w=800',
    specialty: ['Vegan Cuisine', 'Plant-Based', 'Sustainable Food'],
    location: 'Los Angeles & Global',
    joinedDate: '2023-03-12',
    stats: {
      discoveries: 634,
      followers: 15200,
      following: 892,
      points: 7180
    },
    badges: [
      {
        id: 'plant-pioneer',
        name: 'Plant Pioneer',
        icon: '🌱',
        color: '#4CAF50',
        description: 'Leading the plant-based revolution'
      },
      {
        id: 'eco-warrior',
        name: 'Eco Warrior',
        icon: '🌍',
        color: '#2E7D32',
        description: 'Champion of sustainable food practices'
      },
      {
        id: 'vegan-innovator',
        name: 'Vegan Innovator',
        icon: '🧪',
        color: '#81C784',
        description: 'Discovers creative plant-based alternatives'
      }
    ],
    personalityTraits: ['Passionate', 'Sustainable', 'Creative', 'Health-conscious'],
    plateItems: [
      {
        id: 'kopps-berlin',
        type: 'restaurant',
        name: 'Kopps Vegan',
        image: 'https://images.unsplash.com/photo-1615363990578-1d5e3d326fbc?w=400',
        location: 'Berlin, Germany',
        cuisine: 'Vegan',
        rating: 4.7,
        tags: ['Vegan', 'Plant-based', 'Modern', 'Creative'],
        savedDate: '2024-02-05',
        note: 'Cashew cream alchemy!'
      },
      {
        id: 'gracias-madre-la',
        type: 'restaurant',
        name: 'Gracias Madre',
        image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763f30?w=400',
        location: 'Los Angeles, USA',
        cuisine: 'Vegan Mexican',
        rating: 4.6,
        tags: ['Vegan', 'Mexican', 'Street-inspired', 'Creative'],
        savedDate: '2024-01-18',
        note: 'Jackfruit carnitas revolution'
      }
    ],
    recentPosts: [
      {
        id: 'post-lila-1',
        type: 'restaurant',
        title: 'Berlin Vegan Alchemy',
        content: 'Proof that vegan doesn\'t mean boring. Their cashew cream "cheesecake" was pure alchemy - rich, creamy, and completely guilt-free. The chef transforms simple plants into complex flavors that would fool any omnivore.',
        image: 'https://images.unsplash.com/photo-1615363990578-1d5e3d326fbc?w=400',
        location: 'Berlin, Germany',
        cuisine: 'Vegan',
        rating: 4.7,
        tags: ['Vegan', 'Plant-based', 'Dessert', 'Modern'],
        timestamp: '2024-02-05T16:30:00Z',
        likes: 312,
        comments: 45,
        voice: 'Enthusiastic about plant-based innovation, educational yet approachable'
      },
      {
        id: 'post-lila-2',
        type: 'restaurant',
        title: 'Vegan Mexican Mastery',
        content: 'Tacos reimagined with cashew crema and jackfruit carnitas. Comforting and radical at the same time. Who says plant-based can\'t satisfy those deep taco cravings? This place proves tradition and innovation can dance together beautifully.',
        image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763f30?w=400',
        location: 'Los Angeles, USA',
        cuisine: 'Vegan Mexican',
        rating: 4.6,
        tags: ['Vegan', 'Mexican', 'Street-inspired', 'Creative'],
        timestamp: '2024-01-18T13:45:00Z',
        likes: 298,
        comments: 37,
        voice: 'Bridges tradition with innovation, passionate about accessibility'
      }
    ],
    preferences: {
      cuisines: ['Vegan', 'Plant-Based', 'Mediterranean', 'Asian Fusion'],
      priceRange: ['Affordable', 'Mid-range', 'Fine Dining'],
      ambiance: ['Modern', 'Health-conscious', 'Sustainable', 'Creative'],
      dietaryRestrictions: ['Vegan', 'Gluten-free options']
    }
  },
  {
    id: 'rafael-mendez',
    name: 'Rafael Mendez',
    username: '@rafa_eats',
    nickname: 'Rafa',
    bio: 'Adventure fuels appetite. From surf shack tacos to mountaintop ramen. 🏄‍♂️🏔️',
    avatar: 'https://images.unsplash.com/photo-1475905760530-a22eda0fb1b3?w=400',
    coverImage: 'https://images.unsplash.com/photo-1475905760530-a22eda0fb1b3?w=800',
    specialty: ['Adventure Foods', 'Coastal Cuisine', 'Mountain Eats'],
    location: 'California & Global',
    joinedDate: '2023-04-08',
    stats: {
      discoveries: 756,
      followers: 11800,
      following: 445,
      points: 6920
    },
    badges: [
      {
        id: 'adventure-seeker',
        name: 'Adventure Seeker',
        icon: '🏄‍♂️',
        color: '#03A9F4',
        description: 'Finds food in the most adventurous places'
      },
      {
        id: 'coastal-explorer',
        name: 'Coastal Explorer',
        icon: '🌊',
        color: '#0277BD',
        description: 'Master of seaside dining discoveries'
      },
      {
        id: 'mountain-foodie',
        name: 'Mountain Foodie',
        icon: '⛰️',
        color: '#795548',
        description: 'Seeks elevated dining experiences'
      }
    ],
    personalityTraits: ['Adventurous', 'Energetic', 'Outdoorsy', 'Spontaneous'],
    plateItems: [
      {
        id: 'lisbon-fish-shack',
        type: 'restaurant',
        name: 'Cais do Sodré Fish Shack',
        image: 'https://images.unsplash.com/photo-1475905760530-a22eda0fb1b3?w=400',
        location: 'Lisbon, Portugal',
        cuisine: 'Portuguese',
        rating: 4.5,
        tags: ['Seafood', 'Street food', 'Outdoor', 'Local'],
        savedDate: '2024-01-25',
        note: 'Sardines by the water - pure bliss!'
      },
      {
        id: 'cusco-ramen',
        type: 'restaurant',
        name: 'Cusco Mountain Ramen Bar',
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400',
        location: 'Cusco, Peru',
        cuisine: 'Fusion',
        rating: 4.6,
        tags: ['Ramen', 'Fusion', 'Adventure', 'Cozy'],
        savedDate: '2024-01-12',
        note: 'Alpaca ramen at altitude!'
      }
    ],
    recentPosts: [
      {
        id: 'post-rafael-1',
        type: 'restaurant',
        title: 'Seaside Sardine Perfection',
        content: 'Grilled sardines by the water, eaten with fingers, washed down with vinho verde. Pure bliss. Sometimes the best meals come with sand between your toes and salt in the air. This little shack knows the secret to happiness.',
        image: 'https://images.unsplash.com/photo-1475905760530-a22eda0fb1b3?w=400',
        location: 'Lisbon, Portugal',
        cuisine: 'Portuguese',
        rating: 4.5,
        tags: ['Seafood', 'Street food', 'Outdoor', 'Local'],
        timestamp: '2024-01-25T18:20:00Z',
        likes: 234,
        comments: 19,
        voice: 'Casual and energetic, emphasizes the adventure and experience'
      },
      {
        id: 'post-rafael-2',
        type: 'restaurant',
        title: 'High-Altitude Ramen Magic',
        content: 'Altitude makes you hungry. This ramen, with alpaca meat, warmed both body and soul. At 11,000 feet, every slurp felt like a victory. The thin air made the rich broth taste even more intense - mountain magic in a bowl.',
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400',
        location: 'Cusco, Peru',
        cuisine: 'Fusion',
        rating: 4.6,
        tags: ['Ramen', 'Fusion', 'Adventure', 'Cozy'],
        timestamp: '2024-01-12T20:15:00Z',
        likes: 189,
        comments: 22,
        voice: 'Enthusiastic about unique locations and physical challenges'
      }
    ],
    preferences: {
      cuisines: ['Seafood', 'Latin American', 'Fusion', 'Coastal'],
      priceRange: ['Budget', 'Affordable', 'Mid-range'],
      ambiance: ['Outdoor', 'Casual', 'Adventure', 'Beachside'],
      dietaryRestrictions: []
    }
  },
  {
    id: 'anika-kapoor',
    name: 'Anika Kapoor',
    username: '@spice_scholar',
    bio: 'Spice scholar. Mapping the curry trails of India, Southeast Asia & beyond. 🌶️🗺️',
    avatar: 'https://images.unsplash.com/photo-1651959653830-5c8cb576e134?w=400',
    coverImage: 'https://images.unsplash.com/photo-1651959653830-5c8cb576e134?w=800',
    specialty: ['Indian Cuisine', 'Asian Fusion', 'Spice Knowledge'],
    location: 'Mumbai & Global',
    joinedDate: '2023-05-03',
    stats: {
      discoveries: 891,
      followers: 16400,
      following: 278,
      points: 8150
    },
    badges: [
      {
        id: 'spice-master',
        name: 'Spice Master',
        icon: '🌶️',
        color: '#FF5722',
        description: 'Expert in the art of spice combinations'
      },
      {
        id: 'curry-connoisseur',
        name: 'Curry Connoisseur',
        icon: '🍛',
        color: '#FF9800',
        description: 'Knows the secrets of perfect curry'
      },
      {
        id: 'heritage-keeper',
        name: 'Heritage Keeper',
        icon: '📜',
        color: '#795548',
        description: 'Preserves traditional cooking wisdom'
      }
    ],
    personalityTraits: ['Knowledgeable', 'Traditional', 'Passionate', 'Cultural'],
    plateItems: [
      {
        id: 'paradise-biryani',
        type: 'restaurant',
        name: 'Paradise Biryani',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d7b9?w=400',
        location: 'Hyderabad, India',
        cuisine: 'Indian',
        rating: 4.9,
        tags: ['Indian', 'Biryani', 'Spicy', 'Heritage'],
        savedDate: '2024-02-08',
        note: 'The biryani benchmark!'
      },
      {
        id: 'gurney-curry-mee',
        type: 'restaurant',
        name: 'Gurney Drive Curry Mee',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
        location: 'Penang, Malaysia',
        cuisine: 'Malaysian',
        rating: 4.7,
        tags: ['Curry', 'Spicy', 'Malaysian', 'Street food'],
        savedDate: '2024-01-30',
        note: 'Fiery map of Southeast Asia'
      }
    ],
    recentPosts: [
      {
        id: 'post-anika-1',
        type: 'restaurant',
        title: 'Hyderabad Biryani Perfection',
        content: 'Steaming basmati perfumed with saffron, tender mutton falling apart. The biryani benchmark. Each grain tells a story of Nizami heritage - the perfect balance of spice, aromatics, and time. This is why Hyderabad owns biryani.',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d7b9?w=400',
        location: 'Hyderabad, India',
        cuisine: 'Indian',
        rating: 4.9,
        tags: ['Indian', 'Biryani', 'Spicy', 'Heritage'],
        timestamp: '2024-02-08T19:45:00Z',
        likes: 387,
        comments: 52,
        voice: 'Educational and passionate about culinary history and technique'
      },
      {
        id: 'post-anika-2',
        type: 'restaurant',
        title: 'Penang Curry Mee Mastery',
        content: 'Coconut, chili, and shrimp paste in one bowl. A fiery map of Southeast Asia. The vendor\'s grandmother\'s blend - five types of chilies, each adding its own heat signature. This isn\'t just food, it\'s geography in a bowl.',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
        location: 'Penang, Malaysia',
        cuisine: 'Malaysian',
        rating: 4.7,
        tags: ['Curry', 'Spicy', 'Malaysian', 'Street food'],
        timestamp: '2024-01-30T14:20:00Z',
        likes: 298,
        comments: 34,
        voice: 'Deep cultural knowledge with focus on ingredients and tradition'
      }
    ],
    preferences: {
      cuisines: ['Indian', 'Southeast Asian', 'Thai', 'Malaysian'],
      priceRange: ['Budget', 'Affordable', 'Mid-range'],
      ambiance: ['Traditional', 'Authentic', 'Bustling', 'Local'],
      dietaryRestrictions: []
    }
  },
  {
    id: 'omar-darzi',
    name: 'Omar Darzi',
    username: '@coffee_pilgrim',
    bio: 'Coffee pilgrim. From Ethiopian hills to Brooklyn brews, I document coffee culture. ☕🌍',
    avatar: 'https://images.unsplash.com/photo-1583124252465-d281e51012bf?w=400',
    coverImage: 'https://images.unsplash.com/photo-1583124252465-d281e51012bf?w=800',
    specialty: ['Coffee Culture', 'Cafés', 'Specialty Brews'],
    location: 'New York & Global',
    joinedDate: '2023-06-15',
    stats: {
      discoveries: 567,
      followers: 9800,
      following: 334,
      points: 5670
    },
    badges: [
      {
        id: 'coffee-master',
        name: 'Coffee Master',
        icon: '☕',
        color: '#8D6E63',
        description: 'Expert in coffee origins and brewing methods'
      },
      {
        id: 'cafe-curator',
        name: 'Café Curator',
        icon: '🏪',
        color: '#6D4C41',
        description: 'Discovers the world\'s best coffee spaces'
      },
      {
        id: 'bean-hunter',
        name: 'Bean Hunter',
        icon: '🔍',
        color: '#5D4037',
        description: 'Seeks the rarest coffee experiences'
      }
    ],
    personalityTraits: ['Contemplative', 'Detail-oriented', 'Cultural', 'Methodical'],
    plateItems: [
      {
        id: 'tomoca-coffee',
        type: 'restaurant',
        name: 'Tomoca Coffee',
        image: 'https://images.unsplash.com/photo-1583124252465-d281e51012bf?w=400',
        location: 'Addis Ababa, Ethiopia',
        cuisine: 'Coffee',
        rating: 4.8,
        tags: ['Coffee', 'Ethiopian', 'Traditional', 'Strong'],
        savedDate: '2024-02-12',
        note: 'Birthplace of coffee ceremony'
      },
      {
        id: 'onibus-coffee',
        type: 'restaurant',
        name: 'Onibus Coffee',
        image: 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?w=400',
        location: 'Tokyo, Japan',
        cuisine: 'Coffee',
        rating: 4.7,
        tags: ['Coffee', 'Japanese', 'Minimal', 'Specialty'],
        savedDate: '2024-01-20',
        note: 'Pour-over like silk'
      }
    ],
    recentPosts: [
      {
        id: 'post-omar-1',
        type: 'restaurant',
        title: 'Ethiopian Coffee Ceremony',
        content: 'Dark roast served with ceremony. Ethiopia in a cup: earthy, floral, grounding. The ritual matters as much as the result - roasted beans releasing their ancient secrets, incense mixing with coffee aromatics. This is where it all began.',
        image: 'https://images.unsplash.com/photo-1583124252465-d281e51012bf?w=400',
        location: 'Addis Ababa, Ethiopia',
        cuisine: 'Coffee',
        rating: 4.8,
        tags: ['Coffee', 'Ethiopian', 'Traditional', 'Strong'],
        timestamp: '2024-02-12T09:30:00Z',
        likes: 456,
        comments: 28,
        voice: 'Reverent and meditative, focuses on ritual and origin stories'
      },
      {
        id: 'post-omar-2',
        type: 'restaurant',
        title: 'Tokyo Minimalist Perfection',
        content: 'Minimalist café tucked away in Nakameguro. A pour-over so clean it tasted like silk. The barista\'s movements were meditation - precise, patient, purposeful. Sometimes the smallest spaces hold the biggest flavors.',
        image: 'https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?w=400',
        location: 'Tokyo, Japan',
        cuisine: 'Coffee',
        rating: 4.7,
        tags: ['Coffee', 'Japanese', 'Minimal', 'Specialty'],
        timestamp: '2024-01-20T11:15:00Z',
        likes: 342,
        comments: 21,
        voice: 'Philosophical approach with attention to brewing craft and space design'
      }
    ],
    preferences: {
      cuisines: ['Coffee', 'Pastries', 'Light Bites', 'Desserts'],
      priceRange: ['Affordable', 'Mid-range', 'Specialty'],
      ambiance: ['Quiet', 'Minimal', 'Cozy', 'Artistic'],
      dietaryRestrictions: []
    }
  },
  {
    id: 'jun-tanaka',
    name: 'Jun Tanaka',
    username: '@minimal_jun',
    bio: 'Minimalist taste explorer. Celebrating sushi, ramen, and the art of simplicity. 🍣🧘',
    avatar: 'https://images.unsplash.com/photo-1742968922494-d464972b81a7?w=400',
    coverImage: 'https://images.unsplash.com/photo-1742968922494-d464972b81a7?w=800',
    specialty: ['Japanese Cuisine', 'Minimalism', 'Traditional Craft'],
    location: 'Tokyo & Global',
    joinedDate: '2023-07-22',
    stats: {
      discoveries: 445,
      followers: 13600,
      following: 89,
      points: 6780
    },
    badges: [
      {
        id: 'sushi-sensei',
        name: 'Sushi Sensei',
        icon: '🍣',
        color: '#E91E63',
        description: 'Master of sushi appreciation and tradition'
      },
      {
        id: 'ramen-scholar',
        name: 'Ramen Scholar',
        icon: '🍜',
        color: '#FF9800',
        description: 'Deep knowledge of ramen regional styles'
      },
      {
        id: 'zen-foodie',
        name: 'Zen Foodie',
        icon: '🧘',
        color: '#9E9E9E',
        description: 'Finds beauty in culinary simplicity'
      }
    ],
    personalityTraits: ['Minimalist', 'Thoughtful', 'Traditional', 'Precise'],
    plateItems: [
      {
        id: 'tsukiji-sushi',
        type: 'restaurant',
        name: 'Tsukiji Outer Market Sushi',
        image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=400',
        location: 'Tokyo, Japan',
        cuisine: 'Japanese',
        rating: 4.9,
        tags: ['Sushi', 'Fresh', 'Minimal', 'Japanese classic'],
        savedDate: '2024-02-15',
        note: 'Perfect uni, no need for wasabi'
      },
      {
        id: 'ramen-sen-no-kaze',
        type: 'restaurant',
        name: 'Ramen Sen no Kaze',
        image: 'https://images.unsplash.com/photo-1742968922494-d464972b81a7?w=400',
        location: 'Kyoto, Japan',
        cuisine: 'Japanese',
        rating: 4.8,
        tags: ['Ramen', 'Minimalist', 'Japanese', 'Cozy'],
        savedDate: '2024-01-28',
        note: 'Broth aged like a secret'
      }
    ],
    recentPosts: [
      {
        id: 'post-jun-1',
        type: 'restaurant',
        title: 'Tsukiji Market Sushi Perfection',
        content: 'A single piece of uni nigiri, still briny from the morning catch. No need for wasabi, perfection as is. The chef\'s knife work - centuries of technique in each cut. When ingredients are this pure, less becomes everything.',
        image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=400',
        location: 'Tokyo, Japan',
        cuisine: 'Japanese',
        rating: 4.9,
        tags: ['Sushi', 'Fresh', 'Minimal', 'Japanese classic'],
        timestamp: '2024-02-15T12:00:00Z',
        likes: 523,
        comments: 41,
        voice: 'Zen-like appreciation for simplicity and traditional craftsmanship'
      },
      {
        id: 'post-jun-2',
        type: 'restaurant',
        title: 'Kyoto Ramen Meditation',
        content: 'A broth aged like a secret. Deep, umami-rich, with just three toppings. Less is more. The master spent 20 years perfecting this single bowl - each sip reveals layers of patience and dedication. This is meditation you can taste.',
        image: 'https://images.unsplash.com/photo-1742968922494-d464972b81a7?w=400',
        location: 'Kyoto, Japan',
        cuisine: 'Japanese',
        rating: 4.8,
        tags: ['Ramen', 'Minimalist', 'Japanese', 'Cozy'],
        timestamp: '2024-01-28T19:30:00Z',
        likes: 467,
        comments: 33,
        voice: 'Philosophical and reverential, emphasizes craft and tradition'
      }
    ],
    preferences: {
      cuisines: ['Japanese', 'Sushi', 'Ramen', 'Traditional'],
      priceRange: ['Mid-range', 'Fine Dining', 'Traditional'],
      ambiance: ['Minimal', 'Quiet', 'Traditional', 'Authentic'],
      dietaryRestrictions: []
    }
  }
];

export const getAllMasterBots = (): MasterBot[] => {
  return masterBots;
};

export const getMasterBotById = (id: string): MasterBot | undefined => {
  return masterBots.find(bot => bot.id === id);
};

export const getMasterBotsBySpecialty = (specialty: string): MasterBot[] => {
  return masterBots.filter(bot => 
    bot.specialty.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
  );
};

export const getAllMasterBotPosts = (): BotPost[] => {
  return masterBots.flatMap(bot => bot.recentPosts);
};

export const getMasterBotPostsForFeed = (count: number = 10): BotPost[] => {
  const allPosts = getAllMasterBotPosts();
  return allPosts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, count);
};