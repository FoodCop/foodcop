import { useState, useEffect } from 'react';
import { Search, Bookmark, Share2, Play, ChevronLeft, ChevronRight, X, Send } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { savedItemsService } from '../../services/savedItemsService';

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

// Mock data for videos
const MOCK_VIDEOS: TrimVideo[] = [
  {
    id: 'v1',
    title: '5-Minute Avocado Toast Hack',
    channelName: 'QuickBites Kitchen',
    views: '1.2M',
    duration: '0:45',
    category: ['Quick Bites', 'Breakfast'],
    thumbnail: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v2',
    title: 'Chocolate Lava Cake in 3 Steps',
    channelName: 'Sweet Moments',
    views: '890K',
    duration: '1:23',
    category: ['Desserts'],
    thumbnail: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v3',
    title: 'Buddha Bowl Meal Prep',
    channelName: 'Healthy Eats',
    views: '2.1M',
    duration: '2:15',
    category: ['Healthy'],
    thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v4',
    title: 'Perfect Pad Thai Tutorial',
    channelName: 'Asian Flavors',
    views: '1.5M',
    duration: '3:20',
    category: ['Asian'],
    thumbnail: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v5',
    title: 'Homemade Pasta from Scratch',
    channelName: 'Italian Traditions',
    views: '3.2M',
    duration: '4:10',
    category: ['Italian'],
    thumbnail: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v6',
    title: 'Street Tacos Like a Pro',
    channelName: 'Taco Tuesday',
    views: '670K',
    duration: '1:55',
    category: ['Mexican'],
    thumbnail: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v7',
    title: 'Fluffy Pancakes Every Time',
    channelName: 'Breakfast Club',
    views: '1.8M',
    duration: '2:30',
    category: ['Breakfast'],
    thumbnail: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v8',
    title: 'Vegan Burger That Tastes Like Beef',
    channelName: 'Plant Based',
    views: '920K',
    duration: '2:45',
    category: ['Vegan'],
    thumbnail: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v9',
    title: 'Crispy Air Fryer Wings',
    channelName: 'QuickBites Kitchen',
    views: '1.1M',
    duration: '1:40',
    category: ['Quick Bites'],
    thumbnail: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v10',
    title: 'No-Bake Cheesecake Magic',
    channelName: 'Sweet Moments',
    views: '2.4M',
    duration: '3:05',
    category: ['Desserts'],
    thumbnail: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v11',
    title: 'Green Smoothie Bowl',
    channelName: 'Healthy Eats',
    views: '780K',
    duration: '1:15',
    category: ['Healthy', 'Breakfast'],
    thumbnail: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v12',
    title: 'Authentic Ramen Bowl',
    channelName: 'Asian Flavors',
    views: '1.9M',
    duration: '4:30',
    category: ['Asian'],
    thumbnail: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v13',
    title: 'Margherita Pizza Perfection',
    channelName: 'Italian Traditions',
    views: '2.7M',
    duration: '3:45',
    category: ['Italian'],
    thumbnail: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v14',
    title: 'Breakfast Burrito Meal Prep',
    channelName: 'Breakfast Club',
    views: '1.3M',
    duration: '2:20',
    category: ['Breakfast', 'Mexican'],
    thumbnail: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: 'v15',
    title: 'Vegan Mac & Cheese',
    channelName: 'Plant Based',
    views: '1.6M',
    duration: '2:50',
    category: ['Vegan'],
    thumbnail: 'https://images.unsplash.com/photo-1543826173-3fd3e91bdb5c?w=400&h=711&fit=crop',
    videoId: 'dQw4w9WgXcQ'
  }
];

const VIDEOS_PER_PAGE = 12;

export default function TrimsDesktop() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<TrimVideo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter videos based on search and category
  const filteredVideos = MOCK_VIDEOS.filter(video => {
    const matchesCategory = selectedCategory === 'all' || video.category.includes(selectedCategory);
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.channelName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const startIdx = (currentPage - 1) * VIDEOS_PER_PAGE;
  const endIdx = startIdx + VIDEOS_PER_PAGE;
  const paginatedVideos = filteredVideos.slice(startIdx, endIdx);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Debounced search already handled in the filter
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleVideoClick = (video: TrimVideo) => {
    setSelectedVideo(video);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedVideo(null);
    document.body.style.overflow = 'auto';
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToPlate = async (video: TrimVideo) => {
    if (!user) {
      toast.error('Please sign in to save videos');
      return;
    }

    try {
      await savedItemsService.saveItem({
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
      toast.success('Video saved to Plate!');
    } catch (err) {
      toast.error('Failed to save video');
      console.error('Error saving video:', err);
    }
  };

  const handleShare = () => {
    toast.info('Share feature coming soon!');
  };

  // ESC key listener for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedVideo) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedVideo]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="container mx-auto px-4 max-w-[1200px] py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search cooking videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-white border border-[#EEE] rounded-full text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
        </div>
      </div>

      {/* Sticky Category Filter Bar */}
      <div className="sticky top-[72px] z-20 bg-white border-b border-[#EEE]">
        <div className="container mx-auto px-4 max-w-[1400px] py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {VIDEO_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#E8E8E8]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 max-w-[1400px] pt-8 pb-16">
        {/* Video Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onVideoClick={handleVideoClick}
              onSave={handleSaveToPlate}
              onShare={handleShare}
            />
          ))}
        </div>

        {/* Pagination Section */}
        {filteredVideos.length > 0 && (
          <div className="mt-12 pb-12">
            <div className="text-center text-sm text-[#666666] mb-4">
              Showing {startIdx + 1}-{Math.min(endIdx, filteredVideos.length)} of {filteredVideos.length} videos
            </div>
            <div className="flex justify-center items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded flex items-center justify-center ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FF6B35] text-white hover:bg-[#ff5722]'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded flex items-center justify-center ${
                        page === currentPage
                          ? 'bg-[#FF6B35] text-white font-bold'
                          : 'bg-white text-[#1A1A1A] border border-[#EEE] hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="text-[#666666]">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 rounded flex items-center justify-center ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FF6B35] text-white hover:bg-[#ff5722]'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={closeModal}
          onSave={handleSaveToPlate}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

// Video Card Component
function VideoCard({ 
  video, 
  onVideoClick,
  onSave,
  onShare
}: { 
  video: TrimVideo; 
  onVideoClick: (video: TrimVideo) => void;
  onSave: (video: TrimVideo) => void;
  onShare: () => void;
}) {
  return (
    <div 
      className="relative cursor-pointer group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all"
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
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-[#FF6B35] fill-[#FF6B35] ml-1" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2">
          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded font-medium">
            {video.duration}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(video);
            }}
            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <Bookmark className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-3">
        <h3 className="text-[#1A1A1A] font-medium text-sm line-clamp-2 mb-1">
          {video.title}
        </h3>
        <p className="text-[#666666] text-xs mb-1">{video.channelName}</p>
        <p className="text-[#999999] text-xs">{video.views} views</p>
      </div>
    </div>
  );
}

// Video Player Modal Component (imported from mobile but defined here for completeness)
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
        className="bg-white rounded-2xl w-full max-w-[800px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Video Player */}
        <div className="relative w-full bg-white rounded-t-2xl overflow-hidden" style={{ paddingBottom: '177.78%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&color=white&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video Info */}
        <div className="p-8">
          <h2 className="text-[#1A1A1A] font-bold text-xl mb-2">{video.title}</h2>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-[#666666] text-base">{video.channelName}</p>
          </div>
          <p className="text-[#666666] text-sm mb-6">{video.views} views</p>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => onSave(video)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#FF6B35] text-white rounded-xl font-medium hover:bg-[#EA580C] transition-colors"
            >
              <Bookmark className="w-5 h-5" />
              Save to Plate
            </button>
            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-[#1A1A1A] rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <Send className="w-5 h-5" />
              Share with Crew
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
