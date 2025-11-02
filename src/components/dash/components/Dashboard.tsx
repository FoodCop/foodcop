import { useState, useEffect } from "react";
import { MapPin, Camera } from "lucide-react";
import { Card } from "../../ui/card";
import { ImageWithFallback } from "../../ui/image-with-fallback";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { useAuth } from "../../auth/AuthProvider";
import { ProfileService } from "../../../services/profileService";
import type { UserProfile } from "../../../types/profile";

interface RecommendationItem {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  distance: string;
  image: string;
}

interface SavedRecipeItem {
  id: number;
  name: string;
  time: string;
  image: string;
}

interface CrewMember {
  id: number;
  name: string;
  avatar: string;
  initials: string;
}

const recommendations: RecommendationItem[] = [
  {
    id: 1,
    name: "Gourmet Burger House",
    cuisine: "American",
    rating: 4.8,
    distance: "0.5 mi",
    image: "https://images.unsplash.com/photo-1656439659132-24c68e36b553?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwZm9vZHxlbnwxfHx8fDE3NjEwMjE3OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    name: "Pasta Paradise",
    cuisine: "Italian",
    rating: 4.9,
    distance: "0.8 mi",
    image: "https://images.unsplash.com/photo-1712746784067-e9e1bd86c043?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2glMjByZXN0YXVyYW50fGVufDF8fHx8MTc2MDk2NTg4NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    name: "Sakura Sushi Bar",
    cuisine: "Japanese",
    rating: 4.7,
    distance: "1.2 mi",
    image: "https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzYxMDYzNDA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 4,
    name: "Sweet Delights Bakery",
    cuisine: "Desserts",
    rating: 4.9,
    distance: "0.3 mi",
    image: "https://images.unsplash.com/photo-1705933774160-24298027a349?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NjEwMjEwMDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 5,
    name: "Green Bowl Café",
    cuisine: "Healthy",
    rating: 4.6,
    distance: "0.6 mi",
    image: "https://images.unsplash.com/photo-1643750182373-b4a55a8c2801?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwc2FsYWQlMjBib3dsfGVufDF8fHx8MTc2MTA0MzAyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 6,
    name: "Naples Pizza Co.",
    cuisine: "Italian",
    rating: 4.8,
    distance: "0.9 mi",
    image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHNsaWNlfGVufDF8fHx8MTc2MTA0MTYwMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

const savedRecipes: SavedRecipeItem[] = [
  {
    id: 1,
    name: "Avocado Toast",
    time: "10 min",
    image: "https://images.unsplash.com/photo-1676471970358-1cff04452e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvJTIwdG9hc3QlMjBicmVha2Zhc3R8ZW58MXx8fHwxNzYxMTE4NzU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    name: "Berry Smoothie Bowl",
    time: "5 min",
    image: "https://images.unsplash.com/photo-1627308594190-a057cd4bfac8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbW9vdGhpZSUyMGJvd2x8ZW58MXx8fHwxNzYxMTcxNTE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    name: "Street Tacos",
    time: "20 min",
    image: "https://images.unsplash.com/photo-1529704640551-eef9ba5d774a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWNvcyUyMGZvb2R8ZW58MXx8fHwxNzYxMTg3NDc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 4,
    name: "Ramen Bowl",
    time: "30 min",
    image: "https://images.unsplash.com/photo-1697652974652-a2336106043b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW1lbiUyMGJvd2x8ZW58MXx8fHwxNzYxMTI2MTMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

const crewMembers: CrewMember[] = [
  { id: 1, name: "Alex Chen", avatar: "", initials: "AC" },
  { id: 2, name: "Jordan Smith", avatar: "", initials: "JS" },
  { id: 3, name: "Morgan Lee", avatar: "", initials: "ML" },
  { id: 4, name: "Casey Brown", avatar: "", initials: "CB" },
  { id: 5, name: "Riley Davis", avatar: "", initials: "RD" },
  { id: 6, name: "Taylor Wilson", avatar: "", initials: "TW" },
];

export function Dashboard() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const result = await ProfileService.getProfile();
        if (result.success && result.data) {
          setUserProfile(result.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.first_name) return userProfile.first_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0]; // First name from auth
    if (user?.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there'; // Fallback
  };

  const getUserLocation = () => {
    if (userProfile?.location_city) {
      const state = userProfile.location_state;
      return state ? `${userProfile.location_city}, ${state}` : userProfile.location_city;
    }
    return 'Location not set';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 pt-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">{getGreeting()}, {getUserDisplayName()}</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm sm:text-base">{getUserLocation()}</span>
          </div>
        </div>

        {/* Photo CTA */}
        <div className="mb-6">
          <Button className="w-full bg-black hover:bg-gray-800 text-white py-4 sm:py-6 rounded-2xl text-base sm:text-lg">
            <Camera className="w-5 h-5 mr-2" />
            Snap Your Plate
          </Button>
        </div>

        {/* My Crew Section */}
        <div className="mb-12">
          <h2 className="mb-6">My Crew</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {crewMembers.map((member) => (
              <button
                key={member.id}
                className="flex flex-col items-center gap-2 min-w-fit hover:opacity-70 transition-opacity"
              >
                <Avatar className="w-16 h-16 border-2 border-gray-200">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-gray-100">{member.initials}</AvatarFallback>
                </Avatar>
                <span className="text-gray-700">{member.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Recipes Section */}
        <div className="mb-12">
          <h2 className="mb-6">Saved Recipes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {savedRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
              >
                <div className="relative h-32 overflow-hidden">
                  <ImageWithFallback
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="mb-1">{recipe.name}</h3>
                  <p className="text-gray-500">{recipe.time}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        <div>
          <h2 className="mb-6">Your Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-1">{item.name}</h3>
                  <p className="text-gray-600 mb-3">{item.cuisine}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span>{item.rating}</span>
                    </div>
                    <span className="text-gray-500">{item.distance}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
