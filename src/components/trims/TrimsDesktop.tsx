import { useState, useEffect, useCallback } from 'react';
import { Search, Bookmark, Play, ChevronLeft, ChevronRight, X, Send, Star } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { toast } from 'sonner';
import { savedItemsService } from '../../services/savedItemsService';
import { YouTubeService } from '../../services/youtube';

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

const VIDEOS_PER_PAGE = 12;

export default function TrimsDesktop() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<TrimVideo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [videos, setVideos] = useState<TrimVideo[]>([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  
  // Filter states
  const [videoLength, setVideoLength] = useState('all');
  const [ratingFilters, setRatingFilters] = useState<number[]>([]);

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

  // Filter videos based on search, category, length, and rating
  const filteredVideos = videos.filter(video => {
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
    
    // Video length filter
    let matchesLength = true;
    if (videoLength !== 'all') {
      const durationParts = video.duration.split(':');
      const totalSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
      if (videoLength === 'short') matchesLength = totalSeconds < 60;
      else if (videoLength === 'medium') matchesLength = totalSeconds >= 60 && totalSeconds <= 300;
      else if (videoLength === 'long') matchesLength = totalSeconds > 300;
    }
    
    // Rating filter (for now, all videos match since we don't have ratings in mock data)
    const matchesRating = ratingFilters.length === 0; // Will be implemented when we have real rating data
    
    return matchesCategory && matchesSearch && matchesLength && matchesRating;
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
  
  const handleLengthChange = (length: string) => {
    setVideoLength(length);
  };
  
  const handleRatingToggle = (rating: number) => {
    setRatingFilters(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };
  
  const handleClearFilters = () => {
    setVideoLength('all');
    setRatingFilters([]);
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
    console.log('🎬 TrimsDesktop: handleSaveToPlate called', { video, user });
    
    if (!user) {
      console.log('❌ TrimsDesktop: No user found, showing error');
      toast.error('Please sign in to save videos');
      return;
    }

    console.log('✅ TrimsDesktop: User authenticated, attempting to save...');

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
      
      console.log('📦 TrimsDesktop: Save result:', result);
      
      if (result.success) {
        toast.success('Video saved to Plate!');
      } else {
        toast.error(result.error || 'Failed to save video');
        console.error('❌ TrimsDesktop: Save failed:', result.error);
      }
    } catch (err) {
      toast.error('Failed to save video');
      console.error('❌ TrimsDesktop: Error saving video:', err);
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
    <div 
      className="flex min-h-screen bg-[#FAFAFA] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/bg.svg)',
      }}
    >
      {/* Sidebar Filters */}
      <aside className="hidden lg:block w-64 bg-white border-r border-[#EEE] sticky top-0 h-screen overflow-y-auto flex-shrink-0">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-6">Filters</h2>
          
          {/* Video Length Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Video Length</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="length"
                  value="all"
                  checked={videoLength === 'all'}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span className="ml-2 text-sm text-[#666666]">All</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="length"
                  value="short"
                  checked={videoLength === 'short'}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span className="ml-2 text-sm text-[#666666]">Under 1 minute</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="length"
                  value="medium"
                  checked={videoLength === 'medium'}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span className="ml-2 text-sm text-[#666666]">1-5 minutes</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="length"
                  value="long"
                  checked={videoLength === 'long'}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span className="ml-2 text-sm text-[#666666]">Over 5 minutes</span>
              </label>
            </div>
          </div>
          
          <hr className="border-[#EEE] mb-6" />
          
          {/* Rating Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Rating</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ratingFilters.includes(5)}
                  onChange={() => handleRatingToggle(5)}
                  className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35] rounded"
                />
                <span className="ml-2 text-sm text-[#666666] flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#FFD500] text-[#FFD500]" />
                  ))}
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ratingFilters.includes(4)}
                  onChange={() => handleRatingToggle(4)}
                  className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35] rounded"
                />
                <span className="ml-2 text-sm text-[#666666] flex items-center">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#FFD500] text-[#FFD500]" />
                  ))}
                  <Star className="w-3 h-3 text-[#FFD500]" />
                  <span className="ml-1">& up</span>
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ratingFilters.includes(3)}
                  onChange={() => handleRatingToggle(3)}
                  className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35] rounded"
                />
                <span className="ml-2 text-sm text-[#666666] flex items-center">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#FFD500] text-[#FFD500]" />
                  ))}
                  {[...Array(2)].map((_, i) => (
                    <Star key={`empty-${i}`} className="w-3 h-3 text-[#FFD500]" />
                  ))}
                  <span className="ml-1">& up</span>
                </span>
              </label>
            </div>
          </div>
          
          <button
            onClick={handleClearFilters}
            className="w-full py-2 px-4 border border-[#EEE] rounded-lg text-sm text-[#666666] hover:bg-[#FAFAFA] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1">
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
    </div>
  );
}// Video Card Component
function VideoCard({
  video,
  onVideoClick
}: {
  video: TrimVideo; 
  onVideoClick: (video: TrimVideo) => void;
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
      </div>

      {/* Video Info */}
      <div className="p-3">
        <h3 className="text-[#1A1A1A] font-semibold text-base line-clamp-2 mb-1.5">
          {video.title}
        </h3>
        <p className="text-[#666666] text-sm">{video.channelName}</p>
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
