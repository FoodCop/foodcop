import { useState, useEffect } from "react";
import { MapPin, Camera, Loader2 } from "lucide-react";
import { Card } from "../../ui/card";
import { ImageWithFallback } from "../../ui/image-with-fallback";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { useAuth } from "../../auth/AuthProvider";
import { ProfileService } from "../../../services/profileService";
import DashboardService, { type DashboardData } from "../../../services/dashboardService";
import type { UserProfile } from "../../../types/profile";

export function Dashboard() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    crew: [],
    savedRecipes: [],
    restaurantRecommendations: [],
    masterbotPosts: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingSection, setLoadingSection] = useState({
    crew: true,
    recipes: true,
    restaurants: true,
    masterbot: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch user profile
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
        }

        // Get user location from profile or geolocation
        let userLocation: { lat: number; lng: number } | undefined;
        
        // Try to get from browser geolocation
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
          } catch {
            console.log('Geolocation not available, using default');
          }
        }

        // Fetch all dashboard data
        const data = await DashboardService.fetchDashboardData(user.id, userLocation);
        setDashboardData(data);
        
        setLoadingSection({
          crew: false,
          recipes: false,
          restaurants: false,
          masterbot: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
          {loadingSection.crew ? (
            <div className="flex gap-6 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-fit">
                  <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : dashboardData.crew.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-2">
              {dashboardData.crew.map((member) => (
                <button
                  key={member.id}
                  className="flex flex-col items-center gap-2 min-w-fit hover:opacity-70 transition-opacity"
                >
                  <Avatar className="w-16 h-16 border-2 border-gray-200">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-gray-100">{member.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-gray-700 text-sm">{member.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No crew members yet</p>
              <p className="text-xs mt-1">Add friends to build your crew!</p>
            </div>
          )}
        </div>

        {/* Saved Recipes Section */}
        <div className="mb-12">
          <h2 className="mb-6">Saved Recipes</h2>
          {loadingSection.recipes ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden border-gray-200">
                  <div className="h-32 bg-gray-200 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          ) : dashboardData.savedRecipes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboardData.savedRecipes.map((recipe) => (
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
                    <h3 className="mb-1 text-sm font-medium line-clamp-1">{recipe.name}</h3>
                    <p className="text-xs text-gray-500">{recipe.time}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No saved recipes yet</p>
              <p className="text-xs mt-1">Save recipes from Bites to see them here!</p>
            </div>
          )}
        </div>

        {/* Restaurant Recommendations Section */}
        <div className="mb-12">
          <h2 className="mb-6">Restaurant Recommendations</h2>
          {loadingSection.restaurants ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden border-gray-200">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          ) : dashboardData.restaurantRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.restaurantRecommendations.map((item) => (
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
                    <h3 className="mb-1 font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{item.cuisine}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500">{item.distance}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No restaurant recommendations</p>
              <p className="text-xs mt-1">Enable location to see nearby restaurants!</p>
            </div>
          )}
        </div>

        {/* MasterBot Posts Section */}
        <div>
          <h2 className="mb-6">Trending Food Posts</h2>
          {loadingSection.masterbot ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden border-gray-200">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          ) : dashboardData.masterbotPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardData.masterbotPosts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
                >
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={post.masterbot_avatar} alt={post.masterbot_name} />
                        <AvatarFallback className="text-xs bg-orange-100">
                          {post.masterbot_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-gray-700">{post.masterbot_name}</span>
                    </div>
                    <h3 className="text-sm font-medium mb-1 line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                    {post.restaurant_name && (
                      <p className="text-xs text-gray-500">📍 {post.restaurant_name}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No trending posts</p>
              <p className="text-xs mt-1">Check back soon for food inspiration!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
