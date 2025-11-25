import { useState, useEffect } from "react";
import { MapPin, Camera, Heart, Star, Clock, Navigation } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { useAuth } from "../../auth/AuthProvider";
import { ProfileService } from "../../../services/profileService";
import DashboardService, { type DashboardData } from "../../../services/dashboardService";
import type { UserProfile } from "../../../types/profile";
import { MinimalHeader } from "../../common/MinimalHeader";
import { GeolocationService } from "../../../services/geolocationService";
import { SectionHeading } from "../../ui/section-heading";
import { PreferencesHintModal } from "../../common/PreferencesHintModal";
import { PreferencesChips } from "../../common/PreferencesChips";

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
  const [currentLocation, setCurrentLocation] = useState<{ city?: string; state?: string } | null>(null);
  const [showPreferencesHint, setShowPreferencesHint] = useState(false);

  // Check if preferences hint should be shown
  useEffect(() => {
    const checkPreferencesHint = async () => {
      if (!user) return;
      
      try {
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          // Show hint if preferences_hint_shown is false or undefined
          if (!profileResult.data.preferences_hint_shown) {
            setShowPreferencesHint(true);
          }
        }
      } catch (error) {
        console.error('Error checking preferences hint:', error);
      }
    };

    checkPreferencesHint();
  }, [user]);

  // Get location from geolocation if profile doesn't have it
  useEffect(() => {
    const fetchGeolocation = async () => {
      // Only fetch if profile doesn't have location
      if (userProfile?.location_city) {
        return;
      }

      try {
        const locationData = await GeolocationService.getCurrentLocationData();
        if (locationData) {
          setCurrentLocation({
            city: locationData.city,
            state: locationData.state
          });
        }
      } catch (error) {
        console.error('Error fetching geolocation:', error);
      }
    };

    fetchGeolocation();
  }, [userProfile]);

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

  const getUserDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.first_name) return userProfile.first_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user?.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  const getUserLocation = () => {
    // First try profile location
    if (userProfile?.location_city) {
      const state = userProfile.location_state;
      return state ? `${userProfile.location_city}, ${state}` : userProfile.location_city;
    }
    // Then try geolocation
    if (currentLocation?.city) {
      const state = currentLocation.state;
      return state ? `${currentLocation.city}, ${state}` : currentLocation.city;
    }
    return 'Location not set';
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-background flex items-center justify-center max-w-[375px] mx-auto bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg.svg)',
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto"></div>
          <p className="mt-4 text-[#6B7280] text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handlePreferencesUpdated = () => {
    // Reload dashboard data when preferences are updated
    if (user) {
      const fetchDashboardData = async () => {
        try {
          const profileResult = await ProfileService.getProfile();
          if (profileResult.success && profileResult.data) {
            setUserProfile(profileResult.data);
          }

          let userLocation: { lat: number; lng: number } | undefined;
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
              console.log('Geolocation not available');
            }
          }

          const data = await DashboardService.fetchDashboardData(user.id, userLocation);
          setDashboardData(data);
        } catch (error) {
          console.error('Error refreshing dashboard data:', error);
        }
      };
      fetchDashboardData();
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] flex flex-col max-w-[375px] md:max-w-full lg:max-w-7xl mx-auto relative pb-20 md:pb-0 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/bg.svg)',
        fontSize: '10pt',
      }}
    >
      {showPreferencesHint && (
        <PreferencesHintModal
          onClose={() => setShowPreferencesHint(false)}
          onPreferencesSet={() => {
            setShowPreferencesHint(false);
            handlePreferencesUpdated();
          }}
        />
      )}
      <MinimalHeader showLogo={true} logoPosition="left" />
      
      {/* Header Content - Minimal */}
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <h1 className="font-bold mb-1" style={{ fontSize: '14pt', lineHeight: '1.2' }}>
          {getUserDisplayName()}
          {getUserLocation() !== 'Location not set' && (
            <span className="ml-2 text-sm font-normal opacity-70">
              <MapPin className="w-3 h-3 inline mr-1" />
              {getUserLocation()}
            </span>
          )}
        </h1>
        <div className="mt-2">
          <PreferencesChips 
            userProfile={userProfile} 
            onPreferencesUpdated={handlePreferencesUpdated}
          />
        </div>
      </div>

      {/* Desktop Header - White Card with Profile */}
      <section className="hidden md:block px-6 pt-8 mb-8">
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)] border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">
                {getUserDisplayName()}
                {getUserLocation() !== 'Location not set' && (
                  <span className="ml-3 text-xl font-normal text-[#6B7280]">
                    <MapPin className="w-5 h-5 inline mr-1" />
                    {getUserLocation()}
                  </span>
                )}
              </h1>
              <p className="text-lg text-[#6B7280] mb-3">Ready to discover something delicious?</p>
              <PreferencesChips 
                userProfile={userProfile} 
                onPreferencesUpdated={handlePreferencesUpdated}
              />
            </div>
            {userProfile?.avatar_url && (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FF6B35] shadow-lg shrink-0 ml-6 bg-gray-200">
                <img
                  src={userProfile.avatar_url}
                  alt={getUserDisplayName()}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                      const initials = getUserDisplayName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      if (fallback.textContent === '') {
                        fallback.textContent = initials || 'U';
                      }
                    }
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6B35] to-[#EA580C] text-white font-bold text-xl">
                  {getUserDisplayName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 pb-6">
        {/* Snap Your Plate CTA - Mobile Only */}
        <div className="px-4 -mt-6 relative z-10 mb-6 md:hidden">
          <button className="w-full bg-linear-to-r from-[#FF6B35] to-[#EA580C] text-white font-bold text-lg py-4 rounded-full shadow-lg shadow-[#FF6B35]/50 flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:shadow-[#FF6B35]/60 hover:scale-[1.02]">
            <Camera className="w-5 h-5 mr-3" />
            Snap Your Plate
          </button>
        </div>

        {/* My Crew - Story Style */}
        <section className="mb-6 md:mb-10">
          {/* Mobile Header */}
          <div className="px-4 md:hidden mb-4">
            <SectionHeading>My Crew</SectionHeading>
          </div>
          
          {/* Mobile Design - White Card */}
          <div className="px-4 md:hidden">
            <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_0_rgba(0,0,0,0.1)]">
              {loadingSection.crew ? (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mt-2" />
                    </div>
                  ))}
                </div>
              ) : dashboardData.crew.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {dashboardData.crew.map((member) => (
                    <button
                      key={member.id}
                      className="flex flex-col items-center shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#FF6B35] to-[#F7C59F] p-[3px]">
                        <Avatar className="w-full h-full border-2 border-white">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-gray-100 text-sm">{member.initials}</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-xs text-[#1A1A1A] font-medium mt-2 max-w-16 truncate">
                        {member.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#9CA3AF]">
                  <p className="text-sm">No crew members yet</p>
                  <p className="text-xs mt-1">Add friends to build your crew!</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Design - White Card Container */}
          <div className="hidden md:block px-6">
            <div className="bg-white rounded-3xl p-6 shadow-[0_2px_4px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)]">
              <div className="mb-6">
                <SectionHeading>My Crew</SectionHeading>
              </div>
              {loadingSection.crew ? (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex flex-col items-center shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mb-2" />
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : dashboardData.crew.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {dashboardData.crew.map((member) => (
                    <button
                      key={member.id}
                      className="flex flex-col items-center shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="p-1 bg-linear-to-br from-[#FF6B35] to-[#F7C59F] rounded-full mb-2">
                        <div className="w-16 h-16 rounded-full bg-white p-1">
                          <Avatar className="w-full h-full">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="bg-gray-100 text-sm">{member.initials}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {member.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#9CA3AF]">
                  <p className="text-base">No crew members yet</p>
                  <p className="text-sm mt-1">Add friends to build your crew!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Saved Recipes */}
        <section className="mb-6 md:mb-8">
          <div className="px-4 md:px-6 mb-4">
            <SectionHeading>Saved Recipes</SectionHeading>
          </div>
          {loadingSection.recipes ? (
            <div className="px-4 md:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  <div className="h-36 md:h-40 bg-gray-200 animate-pulse" />
                  <div className="p-3 md:p-4 space-y-2">
                    <div className="h-4 md:h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 md:h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData.savedRecipes.length > 0 ? (
            <div className="px-4 md:px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {dashboardData.savedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="relative h-36 md:h-48">
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                    <button className="absolute top-2 right-2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                      <Heart className="w-4 h-4 md:w-4.5 md:h-4.5 text-[#FF6B35]" fill="#FF6B35" />
                    </button>
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="text-[#1A1A1A] font-bold text-sm md:text-base mb-1 line-clamp-2 leading-tight">
                      {recipe.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[#6B7280] text-xs md:text-sm">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span>{recipe.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 md:px-8 lg:px-12 text-center py-6 text-[#9CA3AF]">
              <p className="text-sm md:text-base">No saved recipes yet</p>
              <p className="text-xs md:text-sm mt-1">Save recipes from Bites to see them here!</p>
            </div>
          )}
        </section>

        {/* Restaurant Recommendations */}
        <section className="mb-6 md:mb-8">
          <div className="px-4 md:px-6 flex items-center justify-between mb-4">
            <SectionHeading>Nearby Restaurants</SectionHeading>
            <button className="flex items-center gap-1.5 text-[#FF6B35] text-sm md:text-base font-medium md:font-semibold">
              <span>Map View</span>
              <Navigation className="w-4 h-4 fill-current" />
            </button>
          </div>
          {loadingSection.restaurants ? (
            <div className="px-4 md:px-8 lg:px-12 space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  <div className="h-44 md:h-40 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardData.restaurantRecommendations.length > 0 ? (
            <div className="px-4 md:px-6 space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {dashboardData.restaurantRecommendations.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="relative h-44 md:h-56">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#10B981] text-white shadow-md">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      <span className="text-xs font-bold">{restaurant.rating.toFixed(1)}</span>
                    </div>
                    <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                      <Heart className="w-4 h-4 text-[#6B7280]" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[#1A1A1A] font-bold text-base mb-1 line-clamp-1">
                      {restaurant.name}
                    </h3>
                    <p className="text-[#6B7280] text-sm mb-3">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-2 text-[#6B7280] text-sm">
                      <Navigation className="w-4 h-4 text-[#FF6B35]" />
                      <span>{restaurant.distance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 md:px-8 lg:px-12 text-center py-6 text-[#9CA3AF]">
              <p className="text-sm md:text-base">No restaurant recommendations</p>
              <p className="text-xs md:text-sm mt-1">Enable location to see nearby restaurants!</p>
            </div>
          )}
        </section>

        {/* Trending Food Posts */}
        <section className="mb-6">
          <div className="px-4 md:px-6 mb-4">
            <SectionHeading>Trending Posts</SectionHeading>
          </div>
          {loadingSection.masterbot ? (
            <div className="flex gap-3 overflow-x-auto pl-4 pb-2 hide-scrollbar">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-[280px] shrink-0 bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] overflow-hidden">
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
            <div className="flex gap-3 overflow-x-auto pl-4 md:pl-6 pb-2 hide-scrollbar">
              {dashboardData.masterbotPosts.map((post) => (
                <div
                  key={post.id}
                  className="w-[280px] md:w-80 shrink-0 bg-white rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <div className="relative h-48 md:h-64">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow-sm">
                        <AvatarImage src={post.masterbot_avatar} alt={post.masterbot_name} />
                        <AvatarFallback className="text-xs md:text-sm bg-orange-100 text-[#FF6B35] font-semibold">
                          {post.masterbot_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs md:text-sm font-semibold text-[#1A1A1A]">{post.masterbot_name}</span>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-[#1A1A1A] mb-2 line-clamp-2 leading-tight">{post.title}</h3>
                    <p className="text-xs md:text-sm text-[#6B7280] line-clamp-2 mb-2 leading-relaxed">{post.content}</p>
                    {post.restaurant_name && (
                      <div className="flex items-center gap-1 text-xs md:text-sm text-[#FF6B35] font-semibold mt-3">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>{post.restaurant_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 text-center py-6 text-[#9CA3AF]">
              <p className="text-sm">No trending posts</p>
              <p className="text-xs mt-1">Check back soon for food inspiration!</p>
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
