import { useState, useEffect, useCallback } from 'react';
import { Search, Bookmark, X, Play, Send } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { savedItemsService } from '../../services/savedItemsService';
import { YouTubeService } from '../../services/youtube';
import { MinimalHeader } from '../common/MinimalHeader';
import { CardHeading } from '../ui/card-heading';

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
      high?: {
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
  { id: 'all', label: 'All' },
  { id: 'quick', label: 'Quick Bites' },
  { id: 'dessert', label: 'Desserts' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'asian', label: 'Asian' },
  { id: 'italian', label: 'Italian' },
  { id: 'mexican', label: 'Mexican' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'vegan', label: 'Vegan' },
];

export default function TrimsMobile() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<TrimVideo | null>(null);
  const [videos, setVideos] = useState<TrimVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<TrimVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to categorize videos
  const getCategoryFromTitle = useCallback((title: string): string[] => {
    const lowerTitle = title.toLowerCase();
    const categories: string[] = [];
    
    if (lowerTitle.includes('quick') || lowerTitle.includes('minute') || lowerTitle.includes('fast')) categories.push('Quick Bites');
    if (lowerTitle.includes('dessert') || lowerTitle.includes('cake') || lowerTitle.includes('sweet')) categories.push('Desserts');
    if (lowerTitle.includes('healthy') || lowerTitle.includes('bowl') || lowerTitle.includes('salad')) categories.push('Healthy');
    if (lowerTitle.includes('asian') || lowerTitle.includes('thai') || lowerTitle.includes('chinese') || lowerTitle.includes('japanese') || lowerTitle.includes('ramen') || lowerTitle.includes('pad thai')) categories.push('Asian');
    if (lowerTitle.includes('italian') || lowerTitle.includes('pasta') || lowerTitle.includes('pizza')) categories.push('Italian');
    if (lowerTitle.includes('mexican') || lowerTitle.includes('taco') || lowerTitle.includes('burrito')) categories.push('Mexican');
    if (lowerTitle.includes('breakfast') || lowerTitle.includes('pancake') || lowerTitle.includes('egg')) categories.push('Breakfast');
    if (lowerTitle.includes('vegan') || lowerTitle.includes('plant-based')) categories.push('Vegan');
    
    return categories.length > 0 ? categories : ['Quick Bites'];
  }, []);

  // Load videos from YouTube
  const loadVideos = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await YouTubeService.searchVideos(query, 24);
      
      if (result.success && result.data?.items) {
        const transformedVideos: TrimVideo[] = result.data.items.map((video: YouTubeVideo) => ({
          id: video.id.videoId,
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium.url,
          channelName: video.snippet.channelTitle,
          views: 'Unknown',
          duration: '0:60',
          category: getCategoryFromTitle(video.snippet.title),
          videoId: video.id.videoId,
        }));
        
        setVideos(transformedVideos);
        setFilteredVideos(transformedVideos);
      } else {
        setError(result.error || 'Failed to load videos');
        toast.error('Failed to load videos from YouTube');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      toast.error('Network error loading videos');
      console.error('Video loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [getCategoryFromTitle]);

  // Load initial videos
  useEffect(() => {
    loadVideos('cooking food recipe tutorial');
  }, [loadVideos]);

  // Load videos when search or category changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Map category IDs to search queries
      const categoryQueries: Record<string, string> = {
        'all': 'cooking food recipe tutorial',
        'quick': 'quick easy cooking 5 minute',
        'dessert': 'dessert baking recipe',
        'healthy': 'healthy meal prep cooking',
        'asian': 'asian food cooking recipe',
        'italian': 'italian cooking pasta pizza',
        'mexican': 'mexican food tacos cooking',
        'breakfast': 'breakfast recipe morning',
        'vegan': 'vegan plant based cooking'
      };

      if (searchQuery.trim()) {
        const categoryQuery = categoryQueries[selectedCategory] || '';
        const combinedQuery = categoryQuery 
          ? `${searchQuery} ${categoryQuery} cooking`
          : `${searchQuery} cooking`;
        loadVideos(combinedQuery);
      } else if (selectedCategory !== 'all') {
        loadVideos(categoryQueries[selectedCategory] || `${selectedCategory} cooking`);
      } else {
        loadVideos(categoryQueries['all']);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, loadVideos]);

  // Filter videos based on search and category
  useEffect(() => {
    const filtered = videos.filter(video => {
      // Map category IDs to category labels for matching
      const categoryLabelMap: Record<string, string> = {
        'all': 'all',
        'quick': 'Quick Bites',
        'dessert': 'Desserts',
        'healthy': 'Healthy',
        'asian': 'Asian',
        'italian': 'Italian',
        'mexican': 'Mexican',
        'breakfast': 'Breakfast',
        'vegan': 'Vegan',
      };
      
      const categoryLabel = categoryLabelMap[selectedCategory] || selectedCategory;
      const matchesCategory = selectedCategory === 'all' || video.category.includes(categoryLabel);
      const matchesSearch = searchQuery === '' || 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channelName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    setFilteredVideos(filtered);
  }, [videos, searchQuery, selectedCategory]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Debounced search already handled in the filter effect
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleVideoClick = (video: TrimVideo) => {
    setSelectedVideo(video);
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  const handleSaveToPlate = async (video: TrimVideo) => {
    console.log('🎬 TrimsMobile: handleSaveToPlate called', { video, user });
    
    if (!user) {
      console.log('❌ TrimsMobile: No user found, showing error');
      toast.error('Please sign in to save videos');
      return;
    }

    console.log('✅ TrimsMobile: User authenticated, attempting to save...');

    try {
      const result = await savedItemsService.saveItem({
        itemId: `trim_${video.id}`,
        itemType: 'video',
        metadata: {
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          views: video.views,
          duration: video.duration,
          videoId: video.videoId
        }
      });
      
      console.log('📦 TrimsMobile: Save result:', result);
      
      if (result.success) {
        toastHelpers.saved('Video');
      } else {
        toast.error(result.error || 'Failed to save video');
        console.error('❌ TrimsMobile: Save failed:', result.error);
      }
    } catch (err) {
      toast.error('Failed to save video');
      console.error('❌ TrimsMobile: Error saving video:', err);
    }
  };

  const handleShare = () => {
    toast.info('Share feature coming soon!');
  };

  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] pb-20 bg-cover bg-center bg-no-repeat flex flex-col"
      style={{
        backgroundImage: 'url(/bg.svg)',
        fontSize: '10pt',
      }}
    >
      <MinimalHeader showLogo={true} logoPosition="left" />
      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-white shadow-sm px-4 py-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="Search cooking videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-white border border-[#EEE] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="sticky top-[72px] z-20 bg-white border-b border-[#EEE] px-4 py-3 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 w-max">
          {VIDEO_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-[#666666] text-sm">Loading videos...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-500 text-2xl">⚠</span>
          </div>
          <h3 className="text-[#1A1A1A] font-bold text-lg mb-2">Failed to load videos</h3>
          <p className="text-[#666666] text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-[#1A1A1A] font-bold text-lg mb-2">No videos found</h3>
          <p className="text-[#666666] text-sm text-center">Try adjusting your search or category</p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && !error && filteredVideos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {filteredVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onVideoClick={handleVideoClick}
            />
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={closeModal}
          onSave={handleSaveToPlate}
          onShare={handleShare}
        />
      )}

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

// Video Card Component
function VideoCard({ 
  video, 
  onVideoClick
}: Readonly<{ 
  video: TrimVideo; 
  onVideoClick: (video: TrimVideo) => void;
}>) {
  return (
    <div 
      className="relative cursor-pointer group bg-white rounded-lg overflow-hidden shadow-sm"
      onClick={() => onVideoClick(video)}
    >
      {/* Thumbnail - 9:16 aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: '177.78%' }}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Play Button - Shows on hover */}
        <div className="play-overlay absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-[#FF6B35] fill-[#FF6B35] ml-1" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2">
          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded font-medium">
            {video.duration}
          </span>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-3">
        <CardHeading variant="accent" size="md" weight="semibold" lineClamp={2} className="mb-1.5">
          {video.title}
        </CardHeading>
        <p className="text-[#666666] text-sm">{video.channelName}</p>
      </div>
    </div>
  );
}

// Video Player Modal Component
function VideoPlayerModal({
  video,
  onClose,
  onSave,
  onShare
}: {
  video: TrimVideo;
  onClose: () => void;
  onSave: (video: TrimVideo) => void;
  onShare: () => void;
}) {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player */}
        <div className="relative w-full bg-white" style={{ paddingBottom: '177.78%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&color=white&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video Info */}
        <div className="p-5">
          <h2 className="text-[#1A1A1A] font-bold text-lg mb-2">{video.title}</h2>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-[#666666] text-sm">{video.channelName}</p>
          </div>
          <p className="text-[#666666] text-xs mb-5">{video.views} views</p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onSave(video)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6B35] text-white rounded-xl font-medium hover:bg-[#EA580C] transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              Save to Plate
            </button>
            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-[#1A1A1A] rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <Send className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
