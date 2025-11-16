import { useState, useEffect } from 'react';
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
      <div className="max-w-[375px] md:max-w-full lg:max-w-7xl mx-auto bg-white">
        
        {/* Category Filters - Horizontal Scroll */}
        <div className="px-5 md:px-8 lg:px-12 py-4 md:py-5 overflow-x-auto md:overflow-x-visible hide-scrollbar">
          <div className="flex md:flex-wrap gap-2 md:gap-3 md:justify-center">
            {VIDEO_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all ${
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
          <div className="flex flex-col items-center justify-center py-20 md:py-24">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 md:border-[5px] border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[#666666] text-base md:text-lg">Loading videos... 🎬</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 md:py-24 px-5 md:px-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl md:text-4xl">⚠️</span>
            </div>
            <p className="text-[#1A1A1A] font-semibold text-base md:text-lg mb-1">Failed to load videos</p>
            <p className="text-[#666666] text-sm md:text-base mb-4 text-center">{error}</p>
            <button
              onClick={() => loadVideos("cooking recipes short")}
              className="px-6 md:px-8 py-3 md:py-3.5 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm md:text-base shadow-md active:scale-95 transition-transform"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video Grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="px-5 md:px-8 lg:px-12 pb-6 md:pb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
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
          <div className="flex flex-col items-center justify-center py-20 md:py-24 px-5 md:px-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl md:text-5xl">🎥</span>
            </div>
            <p className="text-[#1A1A1A] font-semibold text-base md:text-lg mb-2">No videos found</p>
            <p className="text-[#666666] text-sm md:text-base text-center">
              Try adjusting your search or category
            </p>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white rounded-2xl max-w-[400px] md:max-w-[600px] lg:max-w-[800px] w-full max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 md:top-6 right-4 md:right-6 z-50 w-10 h-10 md:w-12 md:h-12 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
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
              <div className="p-5 md:p-6 lg:p-8 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                <h2 className="text-[#1A1A1A] font-bold text-base md:text-lg lg:text-xl leading-6 mb-2">
                  {selectedVideo.title}
                </h2>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#666666] text-sm md:text-base">{selectedVideo.channelName}</p>
                  <span className="text-[#999999] text-xs md:text-sm">{selectedVideo.views} views</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 md:gap-3 mt-4">
                  <SmartSaveButton
                    item={selectedVideo}
                    itemType="video"
                    className="flex-1 h-11 md:h-12 lg:h-14 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm md:text-base shadow-md hover:bg-[#EA580C] transition-colors"
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
                    className="flex-1 h-11 md:h-12 lg:h-14 bg-[#F5F5F5] text-[#666666] rounded-xl font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:bg-[#E8E8E8] transition-colors"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
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
            <span className="text-white text-xs font-semibold">{video.duration}</span>
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
        <h3 className="text-[#1A1A1A] font-medium text-sm leading-5 line-clamp-2 mb-1">
          {video.title}
        </h3>
        <p className="text-[#666666] text-xs">{video.channelName}</p>
      </div>
    </div>
  );
}
