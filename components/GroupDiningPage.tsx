import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageCircle,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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
  status: "upcoming" | "past" | "cancelled";
  isPublic: boolean;
  chatMessages: number;
}

export interface DiningGroup {
  id: string;
  name: string;
  description: string;
  image: string;
  members: {
    id: string;
    name: string;
    avatar: string;
    role: "admin" | "member";
  }[];
  upcomingEvents: number;
  totalEvents: number;
  createdAt: string;
}

interface GroupDiningPageProps {
  onNavigateBack?: () => void;
}

type TabType = "events" | "groups" | "hosting";

export function GroupDiningPage({ onNavigateBack }: GroupDiningPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const mockEvents: DiningEvent[] = [
    {
      id: "event_1",
      title: "Pizza Night at Verde",
      description:
        "Let's try that new Neapolitan pizza place everyone's talking about!",
      restaurant: {
        id: "resto_1",
        name: "Verde Pizza",
        address: "456 Italian Way, Little Italy",
        image:
          "https://images.unsplash.com/photo-1672856398893-2fb52d807874?w=400",
        rating: 4.6,
        cuisine: "Italian",
      },
      organizer: {
        id: "user_1",
        name: "Alex Chen",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      },
      date: "2024-02-15",
      time: "19:00",
      maxGuests: 6,
      attendees: [
        {
          id: "friend_1",
          name: "Sarah Kim",
          avatar:
            "https://images.unsplash.com/photo-1494790108755-2616b612b3d6?w=400",
          status: "confirmed",
        },
        {
          id: "friend_2",
          name: "Marco Rivera",
          avatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
          status: "confirmed",
        },
        {
          id: "friend_3",
          name: "Emma Wilson",
          avatar:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
          status: "pending",
        },
      ],
      status: "upcoming",
      isPublic: false,
      chatMessages: 12,
    },
  ];

  const mockGroups: DiningGroup[] = [
    {
      id: "group_1",
      name: "Foodie Friends",
      description:
        "A group of adventurous eaters exploring the city's best restaurants",
      image:
        "https://images.unsplash.com/photo-1529192988216-e87ab62c2f4b?w=400",
      members: [
        {
          id: "user_1",
          name: "Alex Chen",
          avatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
          role: "admin",
        },
        {
          id: "friend_1",
          name: "Sarah Kim",
          avatar:
            "https://images.unsplash.com/photo-1494790108755-2616b612b3d6?w=400",
          role: "member",
        },
      ],
      upcomingEvents: 2,
      totalEvents: 8,
      createdAt: "2024-01-10",
    },
  ];

  const tabs = [
    { id: "events" as TabType, label: "My Events", count: mockEvents.length },
    { id: "groups" as TabType, label: "Groups", count: mockGroups.length },
    { id: "hosting" as TabType, label: "Hosting", count: 1 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "events":
        return <EventsTab events={mockEvents} />;
      case "groups":
        return <GroupsTab groups={mockGroups} />;
      case "hosting":
        return (
          <HostingTab
            events={mockEvents.filter((e) => e.organizer.id === "user_1")}
          />
        );
      default:
        return <EventsTab events={mockEvents} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onNavigateBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
          </button>

          <div className="text-center">
            <h1 className="font-semibold text-[#0B1F3A]">Group Dining</h1>
            <p className="text-sm text-gray-600">Plan meals together</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-full bg-[#F14C35] flex items-center justify-center hover:bg-[#E63E26] transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-[#F14C35] text-[#F14C35]"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-[#F14C35] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
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

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function EventsTab({ events }: { events: DiningEvent[] }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
          <p className="text-2xl font-bold text-[#F14C35]">{events.length}</p>
          <p className="text-sm text-gray-600">Upcoming</p>
        </div>
        <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
          <p className="text-2xl font-bold text-[#F14C35]">12</p>
          <p className="text-sm text-gray-600">This Month</p>
        </div>
        <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
          <p className="text-2xl font-bold text-[#F14C35]">47</p>
          <p className="text-sm text-gray-600">Total Events</p>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create or join dining events to connect with fellow foodies.
          </p>
          <button className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupsTab({ groups }: { groups: DiningGroup[] }) {
  return (
    <div className="space-y-6">
      {/* Create Group CTA */}
      <div className="bg-gradient-to-r from-[#F14C35]/5 to-[#A6471E]/5 rounded-xl p-4 border border-[#F14C35]/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[#0B1F3A] mb-1">
              Start a Dining Group
            </h3>
            <p className="text-sm text-gray-600">
              Bring together friends with similar food interests
            </p>
          </div>
          <button className="px-4 py-2 bg-[#F14C35] text-white rounded-lg font-medium hover:bg-[#E63E26] transition-colors">
            Create Group
          </button>
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-[#0B1F3A] mb-2">
            No groups yet
          </h3>
          <p className="text-gray-600 mb-6">
            Join or create dining groups to plan regular meals together.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function HostingTab({ events }: { events: DiningEvent[] }) {
  return (
    <div className="space-y-6">
      {/* Hosting Stats */}
      <div className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Your Hosting Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-white/80">Events Hosted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">24</p>
            <p className="text-sm text-white/80">Total Guests</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-sm text-white/80">Host Rating</p>
          </div>
        </div>
      </div>

      {/* Hosted Events */}
      <div>
        <h3 className="font-semibold text-[#0B1F3A] mb-4">
          Events You're Hosting
        </h3>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              You haven't hosted any events yet
            </p>
            <button className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
              Host Your First Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} isHost />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  isHost = false,
}: {
  event: DiningEvent;
  isHost?: boolean;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const confirmedCount = event.attendees.filter(
    (a) => a.status === "confirmed"
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Event Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-[#0B1F3A] mb-1">{event.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{event.description}</p>

            {/* Restaurant Info */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={event.restaurant.image}
                  alt={event.restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h5 className="font-medium text-[#0B1F3A]">
                  {event.restaurant.name}
                </h5>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span>{event.restaurant.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{event.restaurant.cuisine}</span>
                </div>
              </div>
            </div>
          </div>

          {isHost && (
            <span className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] text-xs font-medium rounded-full">
              Host
            </span>
          )}
        </div>

        {/* Event Details */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>
              {confirmedCount}/{event.maxGuests}
            </span>
          </div>
        </div>

        {/* Attendees */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {event.attendees.slice(0, 3).map((attendee) => (
                <div
                  key={attendee.id}
                  className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
                >
                  <ImageWithFallback
                    src={attendee.avatar}
                    alt={attendee.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {event.attendees.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                  +{event.attendees.length - 3}
                </div>
              )}
            </div>
            {event.chatMessages > 0 && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{event.chatMessages}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              View Details
            </button>
            <button className="px-3 py-1 bg-[#F14C35] text-white rounded-lg text-sm font-medium hover:bg-[#E63E26] transition-colors">
              Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: DiningGroup }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-20 h-20 flex-shrink-0">
          <ImageWithFallback
            src={group.image}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-[#0B1F3A] mb-1">
                {group.name}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {group.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{group.members.length} members</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{group.upcomingEvents} upcoming</span>
              </div>
            </div>

            <button className="px-3 py-1 bg-[#F14C35] text-white rounded-lg text-sm font-medium hover:bg-[#E63E26] transition-colors">
              View Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#0B1F3A]">
              Create Dining Event
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                Event Title
              </label>
              <input
                type="text"
                placeholder="e.g., Sushi Night at Kiku"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                Restaurant
              </label>
              <button className="w-full p-3 border border-gray-300 rounded-xl text-left text-gray-500 hover:bg-gray-50 transition-colors">
                Choose a restaurant...
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                Max Guests
              </label>
              <input
                type="number"
                placeholder="6"
                min="2"
                max="20"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
                Description
              </label>
              <textarea
                placeholder="Tell people what to expect..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
