import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import {
  createMockActivities,
  interestGroups,
  suggestedFriends,
} from "../constants/friendsData";
import { ActivityTabContent } from "../friends/ActivityTabContent";
import { DiscoverTabContent } from "../friends/DiscoverTabContent";
import { FriendsTabContent } from "../friends/FriendsTabContent";
import { FuzoButton } from "../global/FuzoButton";
import { FuzoTabs } from "../global/FuzoTabs";
import { useFriendsTabLogic } from "../hooks/useFriendsTabLogic";
import type { Friend, Restaurant } from "../ScoutPage";

interface FriendsTabProps {
  friends: Friend[];
  onRestaurantClick: (restaurant: Restaurant) => void;
  onCopyToPlate: (restaurant: Restaurant) => void;
}

export function FriendsTab({
  friends,
  onRestaurantClick,
  onCopyToPlate,
}: FriendsTabProps) {
  const {
    expandedFriends,
    copiedItems,
    activeTab,
    tabs,
    toggleFriendExpanded,
    handleCopyToPlate,
    setActiveTab,
  } = useFriendsTabLogic(onCopyToPlate);

  const activities = createMockActivities(friends);

  if (friends.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          {/* Empty State Illustration */}
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Users className="w-12 h-12 text-gray-400" />
          </div>

          <h3 className="font-bold text-[#0B1F3A] text-xl mb-2">
            No friends yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            Connect with friends to discover their favorite restaurants and
            share your own food finds!
          </p>

          <FuzoButton variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Find Friends
          </FuzoButton>

          <motion.div
            animate={{
              y: [0, -5, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-16 h-16 bg-[#F14C35] rounded-full flex items-center justify-center mx-auto mt-8"
          >
            <span className="text-3xl">🐙</span>
          </motion.div>

          <p className="text-sm text-gray-500 mt-4 italic">
            "Food tastes better when shared with friends!" - Tako
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#F14C35]" />
            <span className="font-bold text-[#0B1F3A]">Social Feed</span>
          </div>

          <FuzoButton variant="tertiary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Friends
          </FuzoButton>
        </div>

        {/* Tabs */}
        <FuzoTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showContent={false}
        />
      </div>

      {/* Content based on active tab */}
      <div className="p-4">
        {activeTab === "friends" && (
          <FriendsTabContent
            friends={friends}
            expandedFriends={expandedFriends}
            copiedItems={copiedItems}
            onToggleFriendExpanded={toggleFriendExpanded}
            onRestaurantClick={onRestaurantClick}
            onCopyToPlate={handleCopyToPlate}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTabContent
            activities={activities}
            onCopyToPlate={handleCopyToPlate}
          />
        )}

        {activeTab === "discover" && (
          <DiscoverTabContent
            suggestedFriends={suggestedFriends}
            interestGroups={interestGroups}
          />
        )}
      </div>

      {/* Bottom Padding for Navigation */}
      <div className="h-20" />
    </div>
  );
}
