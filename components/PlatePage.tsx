import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Camera,
  ChefHat,
  Edit,
  LogOut,
  MapPin,
  Settings,
  Star,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
// Removed mock data import - using only real user data
import { useAuth } from "../contexts/AuthContext";
import { getAllMasterBots, getMasterBotById } from "./constants/masterBotsData";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useMasterBotPlateData } from "./hooks/useMasterBotPlateData";
import { CrewTab } from "./plate/CrewTab";
import { PhotosTab } from "./plate/PhotosTab";
import { PlacesTab } from "./plate/PlacesTab";
import { PointsTab } from "./plate/PointsTab";
import { RecipesTab } from "./plate/RecipesTab";
import { RewardsTab } from "./plate/RewardsTab";
import { VideosTab } from "./plate/VideosTab";
import { ProfileEditModal } from "./profile/ProfileEditModal";

type PlateTab =
  | "crew"
  | "places"
  | "recipes"
  | "photos"
  | "videos"
  | "rewards"
  | "points";

interface PlatePageProps {
  onNavigateBack?: () => void;
  onNavigateToFriend?: (friendId: string) => void;
  masterBotId?: string;
  userId?: string; // If provided, viewing another user's profile
}

export function PlatePage({
  onNavigateBack,
  onNavigateToFriend,
  masterBotId,
  userId,
}: PlatePageProps) {
  const [activeTab, setActiveTab] = useState<PlateTab>("crew");
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  // Fetch Masterbot plate data if viewing a Masterbot
  const { plateData: masterBotPlateData } = useMasterBotPlateData(
    masterBotId || null
  );

  // Set default tab to "places" when viewing a Masterbot
  useEffect(() => {
    if (masterBotId) {
      setActiveTab("places");
    }
  }, [masterBotId]);

  // Get Masterbot profile if masterBotId is provided
  const masterBot = masterBotId ? getMasterBotById(masterBotId) : null;

  // Determine if we're viewing our own profile
  const isOwnProfile = !masterBotId && !userId;

  // Create crew of other Master Bots when viewing a Master Bot profile
  const getMasterBotCrew = (currentBotId: string) => {
    const allBots = getAllMasterBots();
    return allBots
      .filter((bot) => bot.id !== currentBotId)
      .map((bot) => ({
        id: bot.id,
        displayName: bot.name,
        handle: bot.username,
        avatar: getMasterBotAvatarUrl(bot.id),
        bio: bot.bio,
        points: bot.stats.points,
        preferences: bot.specialty,
        badges: bot.badges.map((badge) => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          earnedAt: new Date().toISOString(),
          isUnlocked: true,
        })),
        isFollowing: false,
        mutualFriends: Math.floor(Math.random() * 5) + 1, // Random mutual friends for variety
        savedPlaces: [],
        photos: [],
        reviews: [],
      }));
  };

  // Get correct avatar URL for Masterbots (local images)
  const getMasterBotAvatarUrl = (botId: string): string => {
    const avatarMap: { [key: string]: string } = {
      "aurelia-voss": "/images/users/Aurelia Voss.png",
      "sebastian-leclair": "/images/users/Sebastian LeClair.png",
      "lila-cheng": "/images/users/Lila Cheng.png",
      "rafael-mendez": "/images/users/Rafael Mendez.png",
      "anika-kapoor": "/images/users/Anika Kapoor.png",
      "omar-darzi": "/images/users/Omar Darzi.png",
      "jun-tanaka": "/images/users/Jun Tanaka.png",
    };
    return avatarMap[botId] || "/images/users/Aurelia Voss.png";
  };

  // Convert Masterbot places to Restaurant format for PlacesTab
  const convertMasterBotPlacesToRestaurants = (places: any[]) => {
    return places.map((place) => ({
      id: place.id,
      placeId: place.id,
      name: place.name,
      image: place.image,
      rating: place.rating,
      cuisine: [place.cuisine],
      location: place.location,
      priceRange: place.price_range,
      savedAt: place.saved_at,
      tags: place.tags || [],
      metadata: {
        title: place.name,
        imageUrl: place.image,
        description: place.description,
        restaurant_name: place.restaurant_name,
        content_type: place.content_type,
        personality_trait: place.personality_trait,
        post_id: place.post_id,
        post_index: place.post_index,
      },
    }));
  };

  // Convert Masterbot recipes to Recipe format for PlacesTab
  const convertMasterBotRecipesToRecipes = (recipes: any[]) => {
    return recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      description: recipe.description,
      difficulty: recipe.difficulty,
      prepTime: recipe.prep_time,
      cuisine: recipe.cuisine,
      savedAt: recipe.saved_at,
      tags: recipe.tags || [],
      metadata: {
        title: recipe.title,
        imageUrl: recipe.image,
        description: recipe.description,
      },
    }));
  };

  // Use Masterbot profile or real user profile data
  const userProfile = masterBot
    ? {
        id: masterBot.id,
        displayName: masterBot.name,
        handle: masterBot.username,
        avatar: getMasterBotAvatarUrl(masterBotId!),
        email: "",
        bio: masterBot.bio,
        location: masterBot.location,
        preferences: masterBot.specialty,
        points: masterBot.stats.points,
        // Masterbot crew - other Master Bots
        crew: masterBotId
          ? getMasterBotCrew(masterBotId)
          : masterBotPlateData.crew,
        savedPlaces: masterBotPlateData.savedPlaces,
        savedRecipes: masterBotPlateData.savedRecipes,
        photos: masterBotPlateData.photos,
        videos: masterBotPlateData.videos,
        badges: masterBot.badges,
        achievements: [],
      }
    : {
        id: user?.id || "new_user",
        displayName:
          profile?.display_name ||
          user?.user_metadata?.full_name ||
          user?.email?.split("@")[0] ||
          "FUZO User",
        handle: `@${profile?.username || user?.email?.split("@")[0] || "user"}`,
        avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || null,
        email: profile?.email || user?.email || "",
        bio: profile?.bio || "",
        location:
          [
            profile?.location_city,
            profile?.location_state,
            profile?.location_country,
          ]
            .filter(Boolean)
            .join(", ") || "",
        preferences: [
          ...(profile?.dietary_preferences || []),
          ...(profile?.cuisine_preferences || []),
        ],
        points: profile?.total_points || 0,
        // Fresh profile data - no mock data
        crew: [],
        savedPlaces: [],
        savedRecipes: [],
        photos: [],
        videos: [],
        badges: [],
        achievements: [],
      };

  const handleSignOut = async () => {
    try {
      console.log("🚪 User signing out...");
      await signOut();
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  };

  // const handleProfileUpdate = async (updates: any) => {
  //   try {
  //     console.log("📝 Updating profile from UI...", updates);
  //     await updateProfile(updates);
  //   } catch (error) {
  //     console.error("❌ Profile update error:", error);
  //     // TODO: Show error toast
  //   }
  // };

  const tabs = [
    { id: "crew" as PlateTab, label: "Crew", icon: Users, count: 0 }, // Will be loaded from backend
    { id: "places" as PlateTab, label: "Places", icon: MapPin, count: 0 }, // Renamed from "Plate"
    { id: "recipes" as PlateTab, label: "Recipes", icon: ChefHat, count: 0 }, // New tab
    { id: "photos" as PlateTab, label: "Photos", icon: Camera, count: 0 }, // Will be loaded from backend
    { id: "videos" as PlateTab, label: "Videos", icon: Video, count: 0 }, // New tab
    { id: "rewards" as PlateTab, label: "Rewards", icon: Award, count: 0 }, // Will be loaded from backend
    {
      id: "points" as PlateTab,
      label: "Points",
      icon: Star,
      count: userProfile.points,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "crew":
        return (
          <CrewTab
            crew={userProfile.crew}
            onFriendClick={onNavigateToFriend}
            isMasterBotCrew={!!masterBot}
          />
        );
      case "places":
        return (
          <PlacesTab
            variant="profile"
            showSearch={false}
            showFilters={true}
            showViewToggle={false}
            showStats={true}
            externalRestaurants={
              masterBot
                ? convertMasterBotPlacesToRestaurants(
                    masterBotPlateData.savedPlaces
                  )
                : undefined
            }
            externalRecipes={
              masterBot
                ? convertMasterBotRecipesToRecipes(
                    masterBotPlateData.savedRecipes
                  )
                : undefined
            }
          />
        );
      case "recipes":
        return <RecipesTab recipes={userProfile.savedRecipes} />;
      case "photos":
        return <PhotosTab photos={userProfile.photos} />;
      case "videos":
        return <VideosTab videos={userProfile.videos} />;
      case "rewards":
        return (
          <RewardsTab
            badges={userProfile.badges}
            currentPoints={userProfile.points}
          />
        );
      case "points":
        return <PointsTab currentPoints={userProfile.points} />;
      default:
        return (
          <CrewTab
            crew={userProfile.crew}
            onFriendClick={onNavigateToFriend}
            isMasterBotCrew={!!masterBot}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F14C35]/5 to-[#A6471E]/5">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-8 left-8 text-4xl">🍽️</div>
            <div className="absolute top-16 right-16 text-3xl">✨</div>
            <div className="absolute bottom-16 left-16 text-3xl">🎉</div>
            <div className="absolute bottom-8 right-8 text-2xl">🍕</div>
          </div>
        </div>

        <div className="relative z-10 p-6 pb-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
              </button>
            )}
            <div className="flex space-x-2">
              {!masterBot && isOwnProfile && (
                <>
                  <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200">
                    <Settings className="w-5 h-5 text-[#0B1F3A]" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5 text-[#0B1F3A]" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="relative">
                <ImageWithFallback
                  src={userProfile.avatar || undefined}
                  alt={userProfile.displayName}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                />
                {!masterBot && isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#F14C35] rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-[#E63E26] transition-colors"
                    style={{ transform: "translate(25%, 25%)" }}
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Name & Handle */}
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">
                {userProfile.displayName}
              </h1>
              <p className="text-[#A6471E] font-medium">{userProfile.handle}</p>
              {masterBot && (
                <div className="mt-2">
                  <span className="px-3 py-1 bg-[#F14C35] text-white rounded-full text-sm font-medium">
                    Master Bot
                  </span>
                </div>
              )}
            </div>

            {/* Bio */}
            <p className="text-gray-700 mb-4 max-w-sm mx-auto leading-relaxed">
              {userProfile.bio}
            </p>

            {/* Preferences */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {userProfile.preferences.map((preference) => (
                <span
                  key={preference}
                  className="px-3 py-1 bg-white/80 backdrop-blur-sm text-[#0B1F3A] rounded-full text-sm font-medium border border-gray-200"
                >
                  {preference}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">
                  {userProfile.points}
                </p>
                <p className="text-sm text-gray-600">Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">
                  {userProfile.crew.length}
                </p>
                <p className="text-sm text-gray-600">Crew</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F14C35]">
                  {userProfile.badges.length}
                </p>
                <p className="text-sm text-gray-600">Badges</p>
              </div>
            </div>

            {/* Edit Profile Button - Only show for own profile */}
            {isOwnProfile && (
              <button
                onClick={() => setIsProfileEditModalOpen(true)}
                className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 px-4 py-4 text-sm font-medium border-b-2 transition-colors relative ${
                  isActive
                    ? "border-[#F14C35] text-[#F14C35]"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="relative">
                    <IconComponent className="w-5 h-5" />
                    {tab.count > 0 && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#F14C35] text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {tab.count > 99 ? "99+" : tab.count}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F14C35]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        onSave={() => {
          setIsProfileEditModalOpen(false);
          // Profile will be automatically updated via AuthContext
        }}
      />
    </div>
  );
}
