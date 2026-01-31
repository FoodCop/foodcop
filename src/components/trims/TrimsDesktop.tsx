import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Search } from 'lucide-react';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { YouTubeService } from '../../services/youtube';
import { CardHeading } from '../ui/card-heading';
import { useUniversalViewer } from '../../contexts/UniversalViewerContext';
import { transformTrimVideoToUnified } from '../../utils/unifiedContentTransformers';import { mixVideosWithAds, isAd, type TrimsContent } from '../../utils/trimsMixer';
import { AdCard as TrimsAdCard } from './AdCard';
import type { AdItem } from '../../types/ad';import { Card } from '../ui/card';

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
  const { openViewer } = useUniversalViewer();
  const [mixedContent, setMixedContent] = useState<TrimsContent<TrimVideo>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Prevent multiple video loading attempts
  const videosLoaded = useRef(false);

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
    if (videosLoaded.current) return;
    videosLoaded.current = true;

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
    // Add "shorts" to query to get vertical content
    loadVideos('cooking food recipe shorts tutorial');
  }, [loadVideos]);

  const handleVideoClick = (video: TrimVideo) => {
    const unified = transformTrimVideoToUnified(video);
    openViewer(unified);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background justify-center">
      {/* Main Content Area - Centered Feed with Search */}
      <div className="h-screen w-full md:max-w-[450px] overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative bg-background">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-background px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cooking videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  videosLoaded.current = false;
                  loadVideos(searchQuery.trim());
                }
              }}
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white text-sm text-[var(--gray-600)] placeholder:text-[var(--gray-400)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--yellow-primary)]/20"
            />
          </div>
        </div>

        <div
          className="px-4 py-4"
          style={{
            fontSize: '10pt',
          }}
        >
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-[var(--yellow-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-400 text-sm">Finding best content...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-500 text-2xl">⚠</span>
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-2">Failed to load</h3>
              <p className="text-gray-500 text-sm text-center mb-6">{error}</p>
              <button
                type="button"
                onClick={() => loadVideos('cooking shorts')}
                className="px-6 py-3 bg-[var(--yellow-primary)] text-gray-900 rounded-xl font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Vertical Scroll Video Feed */}
          {!loading && !error && (
            <div className="flex flex-col gap-10 pb-40">
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
      className="overflow-hidden cursor-pointer snap-start transition-all hover:shadow-xl w-full group shadow-lg"
      onClick={() => onVideoClick(video)}
      style={{ borderColor: 'var(--yellow-feed)', borderWidth: '2px' }}
    >
      {/* Video Content Area */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-gray-50">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />

        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 text-[#FFC909] fill-[#FFC909] ml-1" />
          </div>
        </div>
      </div>

      {/* Info Section - Just Title */}
      <div className="p-6" style={{ backgroundColor: '#ffe838' }}>
        <CardHeading
          variant="accent"
          size="lg"
          weight="bold"
          className="text-center leading-tight tracking-tight text-gray-900"
        >
          {cleanTitle(video.title)}
        </CardHeading>
      </div>
    </Card>
  );
}
