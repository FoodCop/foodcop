export interface UserProfile {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  avatar: string;
  preferences: string[];
  points: number;
  badges: Badge[];
  crew: Friend[];
  savedPlaces: SavedPlace[];
  savedRecipes: SavedRecipe[];
  photos: UserPhoto[];
  reviews: UserReview[];
}

export interface Friend {
  id: string;
  displayName: string;
  handle: string;
  avatar: string;
  bio: string;
  preferences: string[];
  points: number;
  badges: Badge[];
  isFollowing: boolean;
  mutualFriends: number;
  savedPlaces: SavedPlace[];
  photos: UserPhoto[];
  reviews: UserReview[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
  isUnlocked: boolean;
}

export interface SavedPlace {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisine: string;
  price: string;
  location: string;
  savedAt: string;
}

export interface SavedRecipe {
  id: string;
  title: string;
  image: string;
  cookingTime: number;
  difficulty: string;
  cuisine: string;
  savedAt: string;
}

export interface UserPhoto {
  id: string;
  image: string;
  caption: string;
  tags: string[];
  points: number;
  likes: number;
  uploadedAt: string;
  location?: string;
}

export interface UserReview {
  id: string;
  placeName: string;
  placeImage: string;
  rating: number;
  reviewText: string;
  photos: string[];
  likes: number;
  createdAt: string;
}

export const mockUserProfile: UserProfile = {
  id: "user_1",
  displayName: "Alex Chen",
  handle: "@alexfoodie",
  bio: "Street food hunter & weekend chef 🍲 Exploring flavors around the world",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  preferences: ["Asian", "Street Food", "Vegetarian", "Spicy"],
  points: 2847,
  badges: [
    {
      id: "explorer",
      name: "Food Explorer", 
      description: "Discovered 50+ restaurants",
      icon: "🗺️",
      color: "#F14C35",
      earnedAt: "2024-01-15",
      isUnlocked: true
    },
    {
      id: "scout",
      name: "Scout Master",
      description: "Added 25+ new spots",
      icon: "📍",
      color: "#FFD74A", 
      earnedAt: "2024-01-10",
      isUnlocked: true
    },
    {
      id: "social",
      name: "Social Butterfly",
      description: "Connected with 100+ foodies",
      icon: "👥",
      color: "#A6471E",
      earnedAt: "2024-01-05",
      isUnlocked: true
    },
    {
      id: "master",
      name: "Taste Master",
      description: "Reach 5000 points",
      icon: "👑",
      color: "#0B1F3A",
      earnedAt: "",
      isUnlocked: false
    }
  ],
  crew: [
    {
      id: "friend_1",
      displayName: "Sarah Kim",
      handle: "@sarahkitchen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b3d6?w=400",
      bio: "Home chef sharing family recipes 👨‍🍳",
      preferences: ["Korean", "Healthy", "Baking"],
      points: 1923,
      badges: [],
      isFollowing: true,
      mutualFriends: 12,
      savedPlaces: [],
      photos: [],
      reviews: []
    },
    {
      id: "friend_2", 
      displayName: "Marco Rivera",
      handle: "@marcoeats",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      bio: "Pizza enthusiast from Naples 🍕",
      preferences: ["Italian", "Pizza", "Pasta"],
      points: 3142,
      badges: [],
      isFollowing: true,
      mutualFriends: 8,
      savedPlaces: [],
      photos: [],
      reviews: []
    }
  ],
  savedPlaces: [
    {
      id: "place_1",
      name: "Ramen Takeshi",
      image: "https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?w=400",
      rating: 4.8,
      cuisine: "Japanese",
      price: "$$",
      location: "Downtown",
      savedAt: "2024-01-18"
    },
    {
      id: "place_2", 
      name: "Verde Pizza",
      image: "https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400", 
      rating: 4.6,
      cuisine: "Italian", 
      price: "$$$",
      location: "Little Italy",
      savedAt: "2024-01-17"
    }
  ],
  savedRecipes: [
    {
      id: "recipe_1",
      title: "Spicy Ramen Bowl",
      image: "https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?w=400",
      cookingTime: 35,
      difficulty: "Medium", 
      cuisine: "Japanese",
      savedAt: "2024-01-16"
    }
  ],
  photos: [
    {
      id: "photo_1",
      image: "https://images.unsplash.com/photo-1693820206848-6ad84857832a?w=400",
      caption: "Perfect pasta night! 🍝",
      tags: ["Italian", "Homemade", "Pasta"],
      points: 15,
      likes: 23,
      uploadedAt: "2024-01-18",
      location: "Home"
    },
    {
      id: "photo_2",
      image: "https://images.unsplash.com/photo-1643750182373-b4a55a8c2801?w=400", 
      caption: "Fresh quinoa bowl for lunch",
      tags: ["Healthy", "Vegetarian", "Bowl"],
      points: 12,
      likes: 18,
      uploadedAt: "2024-01-17",
      location: "Verde Cafe"
    }
  ],
  reviews: [
    {
      id: "review_1",
      placeName: "Ramen Takeshi", 
      placeImage: "https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?w=400",
      rating: 5,
      reviewText: "Best ramen in the city! The tonkotsu broth is incredibly rich and the noodles have perfect texture.",
      photos: ["https://images.unsplash.com/photo-1677011454858-8ecb6d4e6ce0?w=400"],
      likes: 34,
      createdAt: "2024-01-15"
    }
  ]
};

export const mockFriendProfiles: Record<string, Friend> = {
  "friend_1": {
    id: "friend_1",
    displayName: "Sarah Kim",
    handle: "@sarahkitchen", 
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b3d6?w=400",
    bio: "Home chef sharing family recipes 👨‍🍳 Seoul → SF",
    preferences: ["Korean", "Healthy", "Baking", "Asian Fusion"],
    points: 1923,
    badges: [
      {
        id: "chef",
        name: "Home Chef",
        description: "Shared 20+ recipes",
        icon: "👨‍🍳",
        color: "#F14C35",
        earnedAt: "2024-01-12",
        isUnlocked: true
      },
      {
        id: "healthy",
        name: "Health Guru", 
        description: "Posted 30+ healthy meals",
        icon: "🥗",
        color: "#A6471E",
        earnedAt: "2024-01-08", 
        isUnlocked: true
      }
    ],
    isFollowing: true,
    mutualFriends: 12,
    savedPlaces: [
      {
        id: "sarah_place_1",
        name: "Seoul Kitchen",
        image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
        rating: 4.7,
        cuisine: "Korean", 
        price: "$$",
        location: "Koreatown",
        savedAt: "2024-01-16"
      },
      {
        id: "sarah_place_2",
        name: "Green Bowl",
        image: "https://images.unsplash.com/photo-1643750182373-b4a55a8c2801?w=400",
        rating: 4.5,
        cuisine: "Healthy",
        price: "$",
        location: "Mission District", 
        savedAt: "2024-01-14"
      }
    ],
    photos: [
      {
        id: "sarah_photo_1", 
        image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
        caption: "Homemade Korean BBQ night 🥢",
        tags: ["Korean", "BBQ", "Homemade"],
        points: 20,
        likes: 45,
        uploadedAt: "2024-01-17"
      },
      {
        id: "sarah_photo_2",
        image: "https://images.unsplash.com/photo-1643750182373-b4a55a8c2801?w=400", 
        caption: "Power bowl for post-workout fuel 💪",
        tags: ["Healthy", "Post-workout", "Bowl"],
        points: 18,
        likes: 32,
        uploadedAt: "2024-01-15"
      }
    ],
    reviews: [
      {
        id: "sarah_review_1", 
        placeName: "Seoul Kitchen",
        placeImage: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
        rating: 5,
        reviewText: "Authentic Korean flavors that remind me of home. The kimchi is fermented perfectly and the bulgogi melts in your mouth!",
        photos: ["https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400"],
        likes: 28,
        createdAt: "2024-01-16"
      }
    ]
  },
  "friend_2": {
    id: "friend_2",
    displayName: "Marco Rivera", 
    handle: "@marcoeats",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    bio: "Pizza enthusiast from Naples 🍕 Authentic Italian flavors",
    preferences: ["Italian", "Pizza", "Pasta", "Mediterranean"], 
    points: 3142,
    badges: [
      {
        id: "pizza_master",
        name: "Pizza Master",
        description: "Reviewed 50+ pizzerias", 
        icon: "🍕",
        color: "#F14C35",
        earnedAt: "2024-01-10",
        isUnlocked: true
      },
      {
        id: "italian_expert",
        name: "Italian Expert",
        description: "Expert in Italian cuisine",
        icon: "🇮🇹", 
        color: "#0B1F3A",
        earnedAt: "2024-01-05",
        isUnlocked: true
      }
    ],
    isFollowing: true,
    mutualFriends: 8,
    savedPlaces: [
      {
        id: "marco_place_1",
        name: "Nonna's Kitchen",
        image: "https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400",
        rating: 4.9,
        cuisine: "Italian",
        price: "$$$", 
        location: "North Beach",
        savedAt: "2024-01-18"
      },
      {
        id: "marco_place_2",
        name: "Pasta Fresca",
        image: "https://images.unsplash.com/photo-1693820206848-6ad84857832a?w=400",
        rating: 4.6,
        cuisine: "Italian",
        price: "$$",
        location: "Mission Bay",
        savedAt: "2024-01-15" 
      }
    ],
    photos: [
      {
        id: "marco_photo_1",
        image: "https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400",
        caption: "Perfect Margherita from Nonna's 🍕",
        tags: ["Pizza", "Italian", "Margherita"], 
        points: 25,
        likes: 67,
        uploadedAt: "2024-01-18"
      }
    ],
    reviews: [
      {
        id: "marco_review_1",
        placeName: "Nonna's Kitchen", 
        placeImage: "https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400",
        rating: 5,
        reviewText: "As someone from Naples, I can say this is the most authentic Neapolitan pizza outside of Italy. The dough has the perfect char and chew!",
        photos: ["https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400"],
        likes: 52,
        createdAt: "2024-01-18"
      }
    ]
  }
};