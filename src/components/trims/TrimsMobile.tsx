import { useState, useEffect, useCallback } from 'react';
import { Play, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { YouTubeService } from '../../services/youtube';
import { CardHeading } from '../ui/card-heading';
import { useUniversalViewer } from '../../contexts/UniversalViewerContext';
import { transformTrimVideoToUnified } from '../../utils/unifiedContentTransformers';
import { PreferencesFilterDrawer } from '../common/PreferencesFilterDrawer';
import { useAuth } from '../auth/AuthProvider';
import { ProfileService } from '../../services/profileService';
import type { UserProfile } from '../../types/profile';
import { Card } from '../ui/card';
import { mixVideosWithAds, isAd, type TrimsContent } from '../../utils/trimsMixer';
import { AdCard as TrimsAdCard } from './AdCard';
import type { AdItem } from '../../types/ad';

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
  const { openViewer } = useUniversalViewer();
  const { user } = useAuth();
  const [mixedContent, setMixedContent] = useState<TrimsContent<TrimVideo>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

        const mixed = mixVideosWithAds(transformedVideos);
        setMixedContent(mixed);
      } else {
        setError(result.error || 'Failed to load videos');
        toastHelpers.error('Failed to load videos from YouTube');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      toastHelpers.error('Network error loading videos');
      console.error('Video loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [getCategoryFromTitle]);

  // Load initial videos
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
        }
      }
    };
    loadProfile();
    loadVideos('cooking food recipe shorts tutorial');
  }, [user, loadVideos]);

  // Compute filtered videos (excluding ads)
  const filteredVideos = mixedContent.filter((item): item is TrimVideo => !isAd(item));

  const handleVideoClick = (video: TrimVideo) => {
    const unified = transformTrimVideoToUnified(video);
    openViewer(unified);
  };

  return (
    <div className="flex flex-col h-screen bg-blood-orange">
      {/* Search/Filter Header for Mobile */}
      <header className="px-4 py-3 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center gap-3 border-b border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search Trims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadVideos(`${searchQuery} shorts`)}
            className="w-full h-9 pl-9 pr-4 rounded-full bg-white text-sm text-[#6B7280] placeholder:text-[#9CA3AF] border-none focus:outline-none focus:ring-1 focus:ring-orange-500/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </header>

      <div
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar px-4 py-6"
        style={{
          fontSize: '10pt',
        }}
      >
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#FFC909] border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-500 text-xs text-center font-medium">Baking fresh Trims...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 text-xl">⚠</span>
            </div>
            <h3 className="text-gray-900 font-bold text-base mb-1">Oops! Something went wrong</h3>
            <p className="text-gray-500 text-xs text-center mb-6">{error}</p>
            <button
              onClick={() => loadVideos('cooking shorts')}
              className="px-5 py-2.5 bg-[#FFC909] text-white rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold text-base mb-1">No videos found</h3>
            <p className="text-gray-500 text-xs text-center">Try a different search or filter</p>
          </div>
        )}

        {/* Vertical Scroll Video Feed */}
        {!loading && !error && mixedContent.length > 0 && (
          <div className="flex flex-col gap-10">
            {mixedContent.map((item) => {
              if (isAd(item)) {
                return <TrimsAdCard key={item.id} ad={item as AdItem} />;
              }
              const video = item as TrimVideo;
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  onVideoClick={handleVideoClick}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Preferences Filter Drawer */}
      <PreferencesFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        userProfile={userProfile}
        onPreferencesUpdated={async () => {
          if (user) {
            const profileResult = await ProfileService.getProfile();
            if (profileResult.success && profileResult.data) {
              setUserProfile(profileResult.data);
              // Reload videos with preferences
              const prefs = profileResult.data.dietary_preferences || [];
              const query = prefs.length > 0
                ? `${prefs.join(' ')} cooking food shorts`
                : 'cooking food shorts';
              loadVideos(query);
            }
          }
        }}
      />

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

// Video Card Component - Vertical Scroll Style (YouTube Shorts/Reels)
function VideoCard({
  video,
  onVideoClick
}: Readonly<{
  video: TrimVideo;
  onVideoClick: (video: TrimVideo) => void;
}>) {
  // Function to remove hashtags from title
  const cleanTitle = (title: string) => {
    return title.replace(/#\w+/g, '').trim();
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer snap-start shadow-md border-gray-100"
      onClick={() => onVideoClick(video)}
    >
      {/* Video Content Area */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-gray-50 border-b border-gray-100">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Play Button - Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-[#FFC909] fill-[#FFC909] ml-1" />
          </div>
        </div>
      </div>

      {/* Info Section - Just Title */}
      <div className="p-5">
        <CardHeading
          variant="accent"
          size="md"
          weight="bold"
          className="text-center"
        >
          {cleanTitle(video.title)}
        </CardHeading>
      </div>
    </Card>
  );
}
