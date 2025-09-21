import { motion } from "framer-motion";
import {
  Clock,
  Eye,
  Heart,
  Play,
  Search,
  Share2,
  Trash2,
  Video as VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number; // in seconds
  description?: string;
  tags?: string[];
  views?: number;
  likes?: number;
  isSaved?: boolean;
  uploadedAt?: string;
  channel?: string;
}

interface VideosTabProps {
  videos: Video[];
  onVideoClick?: (video: Video) => void;
  onVideoUnsave?: (video: Video) => void;
  showSearch?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  className?: string;
}

export function VideosTab({
  videos,
  onVideoClick,
  onVideoUnsave,
  showSearch = true,
  showFilters = true,
  showStats = true,
  className = "",
}: VideosTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "recent" | "duration" | "views" | "likes"
  >("recent");
  const [filterBy, setFilterBy] = useState<"all" | "short" | "medium" | "long">(
    "all"
  );

  const filteredVideos = videos
    .filter((video) => {
      // Search filter
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Duration filter
      let matchesDuration = true;
      if (filterBy === "short") {
        matchesDuration = video.duration <= 300; // 5 minutes
      } else if (filterBy === "medium") {
        matchesDuration = video.duration > 300 && video.duration <= 900; // 5-15 minutes
      } else if (filterBy === "long") {
        matchesDuration = video.duration > 900; // 15+ minutes
      }

      return matchesSearch && matchesDuration;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "duration":
          return a.duration - b.duration;
        case "views":
          return (b.views || 0) - (a.views || 0);
        case "likes":
          return (b.likes || 0) - (a.likes || 0);
        default:
          return 0; // Keep original order for 'recent'
      }
    });

  const getSortLabel = () => {
    switch (sortBy) {
      case "duration":
        return "Duration";
      case "views":
        return "Views";
      case "likes":
        return "Likes";
      default:
        return "Recent";
    }
  };

  const cycleSortBy = () => {
    const options: ("recent" | "duration" | "views" | "likes")[] = [
      "recent",
      "duration",
      "views",
      "likes",
    ];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatViews = (views?: number) => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getDurationCategory = (duration: number) => {
    if (duration <= 300) return "short";
    if (duration <= 900) return "medium";
    return "long";
  };

  if (videos.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 py-12 ${className}`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          {/* Empty State Illustration */}
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <VideoIcon className="w-12 h-12 text-gray-400" />
          </div>

          <h3 className="font-bold text-[#0B1F3A] text-xl mb-2">
            No saved videos yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            Start exploring and save your favorite cooking videos to your plate!
            They'll appear here for easy access.
          </p>

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
            className="w-16 h-16 bg-[#F14C35] rounded-full flex items-center justify-center mx-auto"
          >
            <span className="text-3xl">🐙</span>
          </motion.div>

          <p className="text-sm text-gray-500 mt-4 italic">
            "Let's watch some delicious cooking together!" - Tako
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1F3A]">My Videos</h2>
            <p className="text-sm text-gray-600">Your saved cooking videos</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search saved videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-[#0B1F3A] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20 focus:bg-white transition-all"
            />
          </div>

          {/* Stats & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <VideoIcon className="w-5 h-5 text-[#F14C35]" />
              <span className="font-bold text-[#0B1F3A]">
                {filteredVideos.length} saved video
                {filteredVideos.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sort Button */}
              {showFilters && (
                <button
                  onClick={cycleSortBy}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {getSortLabel()}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {showFilters && (
            <div className="flex space-x-1 bg-[#F8F9FA] rounded-xl p-1">
              {[
                { id: "all", label: "All", count: videos.length },
                {
                  id: "short",
                  label: "Short",
                  count: videos.filter(
                    (v) => getDurationCategory(v.duration) === "short"
                  ).length,
                },
                {
                  id: "medium",
                  label: "Medium",
                  count: videos.filter(
                    (v) => getDurationCategory(v.duration) === "medium"
                  ).length,
                },
                {
                  id: "long",
                  label: "Long",
                  count: videos.filter(
                    (v) => getDurationCategory(v.duration) === "long"
                  ).length,
                },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterBy(filter.id as any)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterBy === filter.id
                      ? "bg-white text-[#F14C35] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span
                      className={`ml-1 ${
                        filterBy === filter.id
                          ? "text-[#F14C35]"
                          : "text-gray-400"
                      }`}
                    >
                      ({filter.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-bold text-[#0B1F3A] mb-2">No results found</h3>
            <p className="text-gray-600">
              Try searching for different videos or channels
            </p>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" layout>
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  {/* Thumbnail */}
                  <div className="relative aspect-video">
                    <ImageWithFallback
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <button
                        onClick={() => onVideoClick?.(video)}
                        className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Play className="w-6 h-6 text-[#F14C35] ml-1" />
                      </button>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#0B1F3A] mb-1 line-clamp-2">
                          {video.title}
                        </h4>
                        {video.channel && (
                          <p className="text-sm text-gray-600 mb-2">
                            {video.channel}
                          </p>
                        )}
                        {video.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {video.views && (
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{formatViews(video.views)} views</span>
                          </div>
                        )}
                        {video.likes && (
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{formatViews(video.likes)} likes</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {video.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {video.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{video.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onVideoClick?.(video)}
                        className="px-4 py-2 bg-[#F14C35] text-white text-sm rounded-lg font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Watch</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {onVideoUnsave && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onVideoUnsave(video);
                            }}
                            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        )}
                        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Share2 className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="bg-[#F8F9FA] rounded-xl p-4 border border-gray-200 m-4">
          <h3 className="font-medium text-[#0B1F3A] mb-3">Video Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {videos.length}
              </p>
              <p className="text-xs text-gray-600">Total Videos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {formatDuration(
                  Math.round(
                    videos.reduce((sum, video) => sum + video.duration, 0) /
                      videos.length
                  ) || 0
                )}
              </p>
              <p className="text-xs text-gray-600">Avg Duration</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F14C35]">
                {formatViews(
                  videos.reduce((sum, video) => sum + (video.views || 0), 0)
                )}
              </p>
              <p className="text-xs text-gray-600">Total Views</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Padding for Navigation */}
      <div className="h-20" />
    </div>
  );
}
