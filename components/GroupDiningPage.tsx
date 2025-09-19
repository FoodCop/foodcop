import { ArrowLeft, Calendar, MapPin, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

export interface DiningEvent {
  id: string;
  title: string;
  description: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    image: string;
    rating: number;
    cuisine: string;
  };
  organizer: {
    id: string;
    name: string;
    avatar: string;
  };
  date: string;
  time: string;
  maxGuests: number;
  attendees: {
    id: string;
    name: string;
    avatar: string;
    status: "confirmed" | "pending" | "declined";
  }[];
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  isPublic: boolean;
  chatMessages: number;
}

export interface DiningGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  image: string;
  isPrivate: boolean;
  tags: string[];
  lastActivity: string;
}

interface GroupDiningPageProps {
  onNavigateBack?: () => void;
}

type TabType = "events" | "groups" | "hosting";

export function GroupDiningPage({ onNavigateBack }: GroupDiningPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<DiningEvent[]>([]);
  const [groups, setGroups] = useState<DiningGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API calls to fetch events and groups
      // For now, show empty state
      setEvents([]);
      setGroups([]);
    } catch (error) {
      console.error("Failed to load group dining data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const renderEventsTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first group dining event to get started
          </p>
          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Event
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {event.description}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{event.restaurant.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {event.date}
                </div>
                <div className="text-sm text-gray-500">{event.time}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {event.attendees.slice(0, 3).map((attendee) => (
                    <img
                      key={attendee.id}
                      src={attendee.avatar}
                      alt={attendee.name}
                      className="w-6 h-6 rounded-full border-2 border-white"
                    />
                  ))}
                  {event.attendees.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                      +{event.attendees.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {event.attendees.length}/{event.maxGuests} guests
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === "upcoming"
                      ? "bg-green-100 text-green-800"
                      : event.status === "ongoing"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGroupsTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading groups...</p>
          </div>
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No groups yet
          </h3>
          <p className="text-gray-600 mb-4">
            Join or create a dining group to discover new restaurants together
          </p>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Group
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3 mb-3">
              <img
                src={group.image}
                alt={group.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {group.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {group.description}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  <span>
                    {group.memberCount}/{group.maxMembers} members
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {group.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {group.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{group.tags.length - 3}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">{group.lastActivity}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderHostingTab = () => {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Calendar className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Hosting features coming soon
        </h3>
        <p className="text-gray-600 mb-4">
          You'll be able to create and manage your own dining events here
        </p>
        <button
          onClick={handleCreateEvent}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Event
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Group Dining</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("events")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "events"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "groups"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Groups
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "hosting"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Hosting
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "events" && renderEventsTab()}
        {activeTab === "groups" && renderGroupsTab()}
        {activeTab === "hosting" && renderHostingTab()}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {activeTab === "events" ? "Create Event" : "Create Group"}
              </h3>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                {activeTab === "events"
                  ? "Event creation coming soon..."
                  : "Group creation coming soon..."}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
