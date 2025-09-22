import { MessageCircle, UserPlus, Users } from "lucide-react";
import { Friend } from "../constants/profileData";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface CrewTabProps {
  crew: Friend[];
  onFriendClick?: (friendId: string) => void;
  isMasterBotCrew?: boolean;
}

export function CrewTab({
  crew,
  onFriendClick,
  isMasterBotCrew = false,
}: CrewTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#0B1F3A]">
            {isMasterBotCrew ? "Master Bot Crew" : "Your Crew"}
          </h2>
          <p className="text-sm text-gray-600">
            {isMasterBotCrew
              ? `${crew.length} master food explorers`
              : `${crew.length} food explorers`}
          </p>
        </div>
        {!isMasterBotCrew && (
          <button className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>
        )}
      </div>

      {crew.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">
            Build Your Food Crew
          </h3>
          <p className="text-gray-600 mb-6">
            Connect with fellow food lovers to discover amazing restaurants
            together.
          </p>
          <button className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
            Find Friends
          </button>
        </div>
      ) : (
        /* Crew Grid */
        <div className="space-y-4">
          {crew.map((friend) => (
            <div
              key={friend.id}
              onClick={() => onFriendClick?.(friend.id)}
              className="bg-[#F8F9FA] rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative">
                  <ImageWithFallback
                    src={friend.avatar}
                    alt={friend.displayName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {/* Online Status */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Friend Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[#0B1F3A]">
                      {friend.displayName}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-[#F14C35] font-medium">
                      <span>{friend.points}</span>
                      <span>pts</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{friend.handle}</p>

                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {friend.bio}
                  </p>

                  {/* Preferences */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {friend.preferences.slice(0, 3).map((preference) => (
                      <span
                        key={preference}
                        className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded-full"
                      >
                        {preference}
                      </span>
                    ))}
                    {friend.preferences.length > 3 && (
                      <span className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded-full">
                        +{friend.preferences.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Mutual Friends */}
                  {friend.mutualFriends > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{friend.mutualFriends} mutual friends</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle message action
                    }}
                    className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <MessageCircle className="w-4 h-4 text-[#0B1F3A]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="p-4 bg-[#F8F9FA] rounded-xl text-left hover:bg-gray-100 transition-colors border border-gray-200">
          <Users className="w-6 h-6 text-[#F14C35] mb-2" />
          <h3 className="font-medium text-[#0B1F3A] mb-1">Find Nearby</h3>
          <p className="text-sm text-gray-600">Discover foodies in your area</p>
        </button>

        <button className="p-4 bg-[#F8F9FA] rounded-xl text-left hover:bg-gray-100 transition-colors border border-gray-200">
          <UserPlus className="w-6 h-6 text-[#F14C35] mb-2" />
          <h3 className="font-medium text-[#0B1F3A] mb-1">Invite Contacts</h3>
          <p className="text-sm text-gray-600">Connect your phone contacts</p>
        </button>
      </div>

      {/* Crew Stats */}
      <div className="bg-[#F8F9FA] rounded-xl p-4 border border-gray-200">
        <h3 className="font-medium text-[#0B1F3A] mb-3">Crew Activity</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">42</p>
            <p className="text-xs text-gray-600">Places Shared</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">18</p>
            <p className="text-xs text-gray-600">Group Visits</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F14C35]">156</p>
            <p className="text-xs text-gray-600">Photos Tagged</p>
          </div>
        </div>
      </div>
    </div>
  );
}
