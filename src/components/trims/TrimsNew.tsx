import { useState, useMemo, useEffect } from 'react';
import { Search, Play, Heart, Share2, X, Send, SlidersHorizontal } from 'lucide-react';
import { YouTubeService } from '../../services/youtube';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { SmartSaveButton } from '../ui/smart-save-button';

// YouTube API response types
interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

// TrimVideo interface for short-form cooking videos
interface TrimVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  views: string;
  duration: string;
  category: string[];
  videoId: string;
}

// Predefined video categories
const VIDEO_CATEGORIES = [
  { id: 'quick', label: 'Quick Bites ⚡', query: 'quick easy cooking' },
  { id: 'dessert', label: 'Desserts 🍰', query: 'dessert baking' },
  { id: 'healthy', label: 'Healthy 🥗', query: 'healthy cooking' },
  { id: 'asian', label: 'Asian 🍜', query: 'asian cuisine cooking' },
  { id: 'italian', label: 'Italian 🍝', query: 'italian cooking pasta' },
  { id: 'mexican', label: 'Mexican 🌮', query: 'mexican cooking tacos' },
  { id: 'breakfast', label: 'Breakfast 🍳', query: 'breakfast cooking' },
  { id: 'vegan', label: 'Vegan 🌱', query: 'vegan cooking recipes' },
];

export default function TrimsNew() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TrimVideo | null>(null);
  const [videos, setVideos] = useState<TrimVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial videos
  useEffect(() => {
    loadVideos("cooking recipes short");
  }, []);

  const loadVideos = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await YouTubeService.searchVideos(query, 12);
      
      if (result.success && result.data?.items) {
        const transformedVideos: TrimVideo[] = result.data.items.map((video: YouTubeVideo) => ({
          id: video.id.videoId,
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.medium.url,
          channelName: video.snippet.channelTitle,
          views: "Unknown",
          duration: "0:60",
          category: ["Food"],
          videoId: video.id.videoId,
        }));
        
        setVideos(transformedVideos);
      } else {
        setError(result.error || "Failed to load videos");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Video loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search videos when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        loadVideos(`${searchQuery} cooking recipe short`);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      loadVideos("cooking recipes short");
    }
  }, [searchQuery]);

  // Handle category selection
  const handleCategoryClick = (categoryId: string) => {
    const category = VIDEO_CATEGORIES.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategory(categoryId);
      loadVideos(`${category.query} short`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Container */}
      <div className="max-w-[375px] mx-auto bg-white">
        
        {/* Header - Sticky */}
        <div className="bg-white shadow-sm px-5 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#EA580C] flex items-center justify-center shadow-md">
                <span className="text-white text-xl">✂️</span>
              </div>
              <h1 className="text-[#1A1A1A] font-bold text-xl leading-7 font-[Poppins]">Trims</h1>
            </div>
            {user?.user_metadata?.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-[#FF6B35]"
              />
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" />
            <input
              type="text"
              placeholder="Search cooking shorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-12 bg-[#F5F5F5] rounded-xl text-[#1A1A1A] text-base font-[Inter] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-[#666666]" />
            </button>
          </div>
        </div>

        {/* Category Filters - Horizontal Scroll */}
        <div className="px-5 py-4 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2">
            {VIDEO_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium font-[Inter] transition-all ${
                  selectedCategory === category.id
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#E8E8E8]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#666666] text-base font-[Inter]">Loading videos... 🎬</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-[#1A1A1A] font-semibold text-base mb-1 font-[Poppins]">Failed to load videos</p>
            <p className="text-[#666666] text-sm mb-4 font-[Inter] text-center">{error}</p>
            <button
              onClick={() => loadVideos("cooking recipes short")}
              className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm font-[Inter] shadow-md active:scale-95 transition-transform"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video Grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="px-5 pb-6">
            <div className="grid grid-cols-2 gap-3">
              {videos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onPlay={() => setSelectedVideo(video)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🎥</span>
            </div>
            <p className="text-[#1A1A1A] font-semibold text-base mb-2 font-[Poppins]">No videos found</p>
            <p className="text-[#666666] text-sm font-[Inter] text-center">
              Try adjusting your search or category
            </p>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-[400px] w-full max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Video Player */}
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>

              {/* Video Info */}
              <div className="p-5 max-h-[300px] overflow-y-auto">
                <h2 className="text-[#1A1A1A] font-bold text-base leading-6 mb-2 font-[Poppins]">
                  {selectedVideo.title}
                </h2>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#666666] text-sm font-[Inter]">{selectedVideo.channelName}</p>
                  <span className="text-[#999999] text-xs font-[Inter]">{selectedVideo.views} views</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <SmartSaveButton
                    item={selectedVideo}
                    itemType="video"
                    className="flex-1 h-11 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm font-[Inter] shadow-md hover:bg-[#EA580C] transition-colors"
                    onSaveSuccess={(savedItem, isDuplicate) => {
                      const message = isDuplicate ? "Video already saved" : "Video saved to Plate";
                      const toastFn = isDuplicate ? toast.info : toast.success;
                      
                      toastFn(message, isDuplicate ? undefined : {
                        description: selectedVideo.title,
                        action: {
                          label: "View",
                          onClick: () => globalThis.location.hash = '#plate'
                        }
                      });
                    }}
                    onSaveError={(error) => {
                      toast.error(`Failed to save video: ${error}`);
                    }}
                  />
                  <button
                    onClick={() => console.log('Share to friend:', selectedVideo.id)}
                    className="flex-1 h-11 bg-[#F5F5F5] text-[#666666] rounded-xl font-semibold text-sm font-[Inter] flex items-center justify-center gap-2 hover:bg-[#E8E8E8] transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

function VideoCard({ video, onPlay }: { video: TrimVideo; onPlay: () => void }) {
  const [liked, setLiked] = useState(false);

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={onPlay}
    >
      {/* Video Thumbnail - 9:16 aspect ratio for shorts */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#F5F5F5] shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]">
        <div style={{ paddingTop: '177.78%' }}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Play Button - Shows on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 text-[#FF6B35] fill-[#FF6B35] ml-1" />
            </div>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md">
            <span className="text-white text-xs font-semibold font-[Inter]">{video.duration}</span>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
              className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <SmartSaveButton
              item={video}
              itemType="video"
              className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              showDuplicatePreview={false}
              onSaveSuccess={(savedItem, isDuplicate) => {
                const message = isDuplicate ? "Video already saved" : "Video saved";
                toast.success(message);
              }}
              onSaveError={(error) => {
                toast.error(`Failed to save: ${error}`);
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="mt-2 px-1">
        <h3 className="text-[#1A1A1A] font-medium text-sm leading-5 line-clamp-2 mb-1 font-[Inter]">
          {video.title}
        </h3>
        <p className="text-[#666666] text-xs font-[Inter]">{video.channelName}</p>
      </div>
    </div>
  );
}
