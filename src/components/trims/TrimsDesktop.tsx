import { useState, useEffect, useCallback, useRef } from 'react';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { toastHelpers } from '../../utils/toastHelpers';
import { YouTubeService } from '../../services/youtube';
import { CardHeading } from '../ui/card-heading';
import { useUniversalViewer } from '../../contexts/UniversalViewerContext';
import { transformTrimVideoToUnified } from '../../utils/unifiedContentTransformers';import { mixVideosWithAds, isAd, type TrimsContent } from '../../utils/trimsMixer';
import { AdCard as TrimsAdCard } from './AdCard';
import type { AdItem } from '../../types/ad';import { SidebarPanel, SidebarSection } from '../common/SidebarPanel';
import { useAuth } from '../auth/AuthProvider';
import { ProfileService } from '../../services/profileService';
import { DIETARY_OPTIONS } from '../../types/onboarding';
import type { UserProfile } from '../../types/profile';
import { Card } from '../ui/card';

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
  const { openViewer } = useUniversalViewer();
  const [mixedContent, setMixedContent] = useState<TrimsContent<TrimVideo>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [desktopDietaryFilters, setDesktopDietaryFilters] = useState<string[]>([]);
  const [savingDesktopPrefs, setSavingDesktopPrefs] = useState(false);

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
    const loadProfile = async () => {
      if (user) {
        const profileResult = await ProfileService.getProfile();
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
          if (profileResult.data.dietary_preferences) {
            setDesktopDietaryFilters(profileResult.data.dietary_preferences);
          }
        }
      }
    };
    loadProfile();

    // Add "shorts" to query to get vertical content
    loadVideos('cooking food recipe shorts tutorial');
  }, [user, loadVideos]);

  const toggleDesktopDietary = (option: string) => {
    const normalized = option.toLowerCase();
    setDesktopDietaryFilters((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((item) => item !== normalized);
      }
      if (normalized === "no restrictions") {
        return [normalized];
      }
      return [...prev.filter((item) => item !== "no restrictions"), normalized];
    });
  };

  const clearDesktopDietary = () => setDesktopDietaryFilters([]);

  const handleDesktopPreferencesSave = async () => {
    if (!user) {
      toast.warning("Sign in to save your preferences");
      return;
    }

    setSavingDesktopPrefs(true);

    try {
      const dietaryPrefs = desktopDietaryFilters.includes("no restrictions")
        ? []
        : desktopDietaryFilters;

      const result = await ProfileService.updateProfile({
        dietary_preferences: dietaryPrefs,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save preferences");
      }

      toast.success("Preferences updated");

      const profileResult = await ProfileService.getProfile();
      if (profileResult.success && profileResult.data) {
        setUserProfile(profileResult.data);
      }

      // Reload videos with updated preferences context
      const query = dietaryPrefs.length > 0
        ? `${dietaryPrefs.join(' ')} cooking food recipe shorts`
        : 'cooking food recipe shorts tutorial';

      await loadVideos(query);
    } catch (error) {
      console.error("Error saving desktop preferences:", error);
      toast.error("Unable to save preferences");
    } finally {
      setSavingDesktopPrefs(false);
    }
  };

  const handleVideoClick = (video: TrimVideo) => {
    const unified = transformTrimVideoToUnified(video);
    openViewer(unified);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-page-profile">
      {/* Sidebar Panel - Vibrant Pink Theme */}
      <SidebarPanel
        className="hidden md:flex flex-shrink-0"
        fullHeight
        themeColor="vibrant-pink"
        eyebrow="Customize"
        title="Trims Filters"
        action={
          desktopDietaryFilters.length > 0 ? (
            <button
              onClick={clearDesktopDietary}
              className="text-sm font-semibold text-[#f59e0b] hover:text-[#d97706]"
            >
              Clear
            </button>
          ) : undefined
        }
      >
        <SidebarSection
          title="Dietary Preferences"
          description="Filter video content by your dietary needs."
        >
          <div className="space-y-2">
            {DIETARY_OPTIONS.map((option) => {
              const normalized = option.toLowerCase();
              const isSelected = desktopDietaryFilters.includes(normalized);

              return (
                <button
                  key={option}
                  onClick={() => toggleDesktopDietary(option)}
                  className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between text-sm transition-colors ${isSelected
                    ? "bg-orange-50 border-orange-500 text-orange-700"
                    : "bg-white border-gray-200 text-gray-700 hover:border-orange-300"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-seedling text-orange-500" />
                    {option}
                  </span>
                  {isSelected && <span className="text-xs font-medium">✓</span>}
                </button>
              );
            })}
          </div>
        </SidebarSection>

        {/* Save Preferences Button - Positioned below filters */}
        <div className="pt-4">
          <button
            onClick={handleDesktopPreferencesSave}
            disabled={savingDesktopPrefs}
            className="w-full py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {savingDesktopPrefs ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </SidebarPanel>

      {/* Main Content Area - Centered Feed (Single Column) */}
      <div className="flex-1 flex justify-center bg-page-profile overflow-hidden">
        <div
          className="h-screen w-full md:max-w-[450px] overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative bg-page-profile px-4 py-8"
          style={{
            fontSize: '10pt',
          }}
        >
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#FFC909] border-t-transparent rounded-full animate-spin" />
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
                className="px-6 py-3 bg-[#FFC909] text-white rounded-xl font-medium"
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
      className="overflow-hidden cursor-pointer snap-start transition-all hover:shadow-xl border-gray-100 w-full group shadow-lg"
      onClick={() => onVideoClick(video)}
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
      <div className="p-6 bg-white">
        <CardHeading
          variant="accent"
          size="lg"
          weight="bold"
          className="text-center leading-tight tracking-tight"
        >
          {cleanTitle(video.title)}
        </CardHeading>
      </div>
    </Card>
  );
}
