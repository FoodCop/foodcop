import { useState, useEffect } from "react";
import { MapPin, Camera, Bell, Heart, Star, Clock, Navigation } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { useAuth } from "../../auth/AuthProvider";
import { ProfileService } from "../../../services/profileService";
import DashboardService, { type DashboardData } from "../../../services/dashboardService";
import type { UserProfile } from "../../../types/profile";

export function DashboardNew() {
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
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user?.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
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
      <div className="min-h-screen bg-white flex items-center justify-center max-w-[375px] mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto"></div>
          <p className="mt-4 text-[#6B7280] text-sm font-[Inter]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-[#1A1A1A] font-bold text-lg leading-[18px] font-[Poppins]">FUZO</h1>
            <p className="text-[#6B7280] text-xs leading-4 font-[Inter]">Your Food Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1">
            <Bell className="w-4.5 h-5 text-[#374151]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-94"></span>
          </button>
          <Avatar className="w-9 h-9 rounded-full shadow-[0_0_0_0_#FF6B35,0_0_0_0_#FFF]">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white text-sm">
              {getUserDisplayName()[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-6">
        {/* Greeting Section */}
        <section className="px-5 pt-5 pb-4">
          <h2 className="text-[#1A1A1A] font-bold text-2xl leading-8 mb-1 font-[Poppins]">
            {getGreeting()}, {getUserDisplayName()}
          </h2>
          <div className="flex items-center gap-2 text-[#6B7280]">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-[Inter]">{getUserLocation()}</span>
          </div>
        </section>

        {/* Snap Your Plate CTA */}
        <section className="px-5 pb-6">
          <button className="w-full h-14 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] shadow-[0_8px_10px_0_rgba(0,0,0,0.1),0_20px_25px_0_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 hover:shadow-xl transition-shadow">
            <Camera className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-base font-[Poppins]">Snap Your Plate</span>
          </button>
        </section>

        {/* My Crew - Story Style */}
        <section className="mb-6">
          <div className="px-5 flex items-center justify-between mb-3">
            <h2 className="text-[#1A1A1A] font-bold text-base leading-6 font-[Poppins]">My Crew</h2>
            <button className="text-[#FF6B35] text-sm font-semibold font-[Inter]">View All</button>
          </div>
          {loadingSection.crew ? (
            <div className="flex gap-4 overflow-x-auto pl-5 pb-2 hide-scrollbar">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[64px]">
                  <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : dashboardData.crew.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pl-5 pb-2 hide-scrollbar">
              {dashboardData.crew.map((member) => (
                <button
                  key={member.id}
                  className="flex flex-col items-center gap-2 min-w-[64px] hover:opacity-80 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#FF6B35] via-[#FF6B35] to-[#F7C59F]">
                    <div className="w-full h-full rounded-full p-0.5 bg-white">
                      <Avatar className="w-full h-full">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-gray-100 text-sm">{member.initials}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-[#4B5563] text-xs font-medium text-center leading-4 font-[Inter]">
                    {member.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 text-center py-6 text-[#9CA3AF]">
              <p className="text-sm font-[Inter]">No crew members yet</p>
              <p className="text-xs mt-1 font-[Inter]">Add friends to build your crew!</p>
            </div>
          )}
        </section>

        {/* Saved Recipes */}
        <section className="mb-6">
          <div className="px-5 flex items-center justify-between mb-3">
            <h2 className="text-[#1A1A1A] font-bold text-base leading-6 font-[Poppins]">Saved Recipes</h2>
            <button className="text-[#FF6B35] text-sm font-semibold font-[Inter]">See All</button>
          </div>
          {loadingSection.recipes ? (
            <div className="px-5 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  <div className="h-32 bg-gray-200 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData.savedRecipes.length > 0 ? (
            <div className="px-5 grid grid-cols-2 gap-4">
              {dashboardData.savedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-32">
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                    <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-[#FF6B35]" fill="#FF6B35" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[#1A1A1A] font-bold text-sm leading-5 mb-1 font-[Poppins] line-clamp-1">
                      {recipe.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[#6B7280] text-xs font-[Inter]">
                      <Clock className="w-3 h-3" />
                      <span>{recipe.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 text-center py-6 text-[#9CA3AF]">
              <p className="text-sm font-[Inter]">No saved recipes yet</p>
              <p className="text-xs mt-1 font-[Inter]">Save recipes from Bites to see them here!</p>
            </div>
          )}
        </section>

        {/* Restaurant Recommendations */}
        <section className="mb-6">
          <div className="px-5 flex items-center justify-between mb-3">
            <h2 className="text-[#1A1A1A] font-bold text-base leading-6 font-[Poppins]">Nearby Restaurants</h2>
            <button className="flex items-center gap-1 text-[#FF6B35] text-sm font-semibold font-[Inter]">
              <span>Map View</span>
              <Navigation className="w-3.5 h-3 fill-current" />
            </button>
          </div>
          {loadingSection.restaurants ? (
            <div className="px-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  <div className="h-40 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData.restaurantRecommendations.length > 0 ? (
            <div className="px-5 space-y-4">
              {dashboardData.restaurantRecommendations.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-40">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500 text-white">
                      <Star className="w-3 h-3" />
                      <span className="text-xs font-bold">{restaurant.rating.toFixed(1)}</span>
                    </div>
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-[0_4px_6px_0_rgba(0,0,0,0.1)] flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-[#374151]" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-[#1A1A1A] font-bold text-base leading-6 mb-1 font-[Poppins]">
                          {restaurant.name}
                        </h3>
                        <p className="text-[#6B7280] text-xs leading-4 font-[Inter]">{restaurant.cuisine}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[#4B5563] text-xs font-[Inter]">
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-[#9CA3AF]" />
                          <span>{restaurant.distance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 text-center py-6 text-[#9CA3AF]">
              <p className="text-sm font-[Inter]">No restaurant recommendations</p>
              <p className="text-xs mt-1 font-[Inter]">Enable location to see nearby restaurants!</p>
            </div>
          )}
        </section>

        {/* Trending Food Posts */}
        <section className="mb-6">
          <div className="px-5 flex items-center justify-between mb-3">
            <h2 className="text-[#1A1A1A] font-bold text-base leading-6 font-[Poppins]">Trending Posts</h2>
            <button className="text-[#FF6B35] text-sm font-semibold font-[Inter]">See All</button>
          </div>
          {loadingSection.masterbot ? (
            <div className="flex gap-4 overflow-x-auto pl-5 pb-2 hide-scrollbar">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[280px] bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData.masterbotPosts.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pl-5 pb-2 hide-scrollbar">
              {dashboardData.masterbotPosts.map((post) => (
                <div
                  key={post.id}
                  className="min-w-[280px] bg-white rounded-2xl shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-48">
                    <img
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
                      <span className="text-xs font-medium text-[#374151] font-[Inter]">{post.masterbot_name}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-1 line-clamp-2 font-[Poppins]">{post.title}</h3>
                    <p className="text-xs text-[#6B7280] line-clamp-2 mb-2 font-[Inter]">{post.content}</p>
                    {post.restaurant_name && (
                      <p className="text-xs text-[#FF6B35] font-semibold font-[Inter]">📍 {post.restaurant_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 text-center py-6 text-[#9CA3AF]">
              <p className="text-sm font-[Inter]">No trending posts</p>
              <p className="text-xs mt-1 font-[Inter]">Check back soon for food inspiration!</p>
            </div>
          )}
        </section>
      </main>

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
