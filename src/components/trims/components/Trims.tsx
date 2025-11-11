import { useState, useMemo, useEffect } from 'react';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Card } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import { AspectRatio } from '../../ui/aspect-ratio';
import { Search, Play, Heart, Share2, X, Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '../../ui/dialog';
import { SmartSaveButton } from '../../ui/smart-save-button';
import { YouTubeService } from '../../../services/youtube';
import { useAuth } from '../../auth/AuthProvider';
import { toast } from 'sonner';

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

// YouTube API connected - TrimVideo interface for food cooking videos
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

export function Trims() {
  // Authentication
  const { user: _user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
        // Transform YouTube data to our TrimVideo interface
        const transformedVideos: TrimVideo[] = result.data.items.map((video: YouTubeVideo) => ({
          id: video.id.videoId,
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.medium.url,
          channelName: video.snippet.channelTitle,
          views: "Unknown", // YouTube API v3 doesn't provide view count in search
          duration: "0:60", // Default duration for shorts
          category: ["Food"], // Default category, could be enhanced with AI categorization
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
      }, 500); // Debounce search
      
      return () => clearTimeout(timeoutId);
    } else {
      loadVideos("cooking recipes short");
    }
  }, [searchQuery]);

  // Extract unique categories for filters
  const ALL_CATEGORIES = Array.from(
    new Set(videos.flatMap(video => video.category))
  ).sort((a, b) => a.localeCompare(b));

  // Filter videos based on search and categories
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesCategory = selectedCategories.length === 0 ||
                             selectedCategories.some(cat => video.category.includes(cat));
      
      return matchesCategory;
    });
  }, [videos, selectedCategories]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };



  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-4">
        <h1>Trims</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search food shorts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filters */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {ALL_CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Video Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading cooking videos...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div className="ml-2 text-center">
                <p className="text-red-600 font-medium">Failed to load videos</p>
                <p className="text-gray-500 text-sm">{error}</p>
                <Button 
                  onClick={() => loadVideos("cooking recipes short")} 
                  variant="outline" 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {filteredVideos.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No videos found. Try adjusting your filters or search.
                </div>
              ) : (
                filteredVideos.map(video => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onPlay={() => setSelectedVideo(video)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-sm md:max-w-lg max-h-[90vh] p-0 gap-0 bg-white overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedVideo?.title || 'Video Player'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {selectedVideo?.channelName || 'Playing video'}
          </DialogDescription>
          
          <DialogClose className="absolute right-2 top-2 z-50 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          {selectedVideo && (
            <div className="w-full flex flex-col max-h-[90vh]">
              {/* Video Container */}
              <div className="bg-black">
                <AspectRatio ratio={16 / 9} className="bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </AspectRatio>
              </div>
              
              {/* Video Info - Scrollable content area */}
              <div className="bg-background px-4 py-3 flex-1 overflow-y-auto">
                <h2 className="mb-1 line-clamp-2 font-semibold">{selectedVideo.title}</h2>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-muted-foreground text-sm">{selectedVideo.channelName}</p>
                  <span className="text-sm text-muted-foreground">{selectedVideo.views} views</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {selectedVideo.category.map(cat => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Fixed Action Buttons */}
              <div className="bg-background border-t px-4 py-3 flex gap-3">
                <SmartSaveButton
                  item={selectedVideo}
                  itemType="video"
                  className="flex-1"
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
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // Will be connected to share functionality
                    console.log('Share to friend:', selectedVideo.id);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  SHARE TO FRIEND
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VideoCard({ video, onPlay }: Readonly<{ 
  video: TrimVideo; 
  onPlay: () => void;
}>) {
  const [liked, setLiked] = useState(false);

  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={onPlay}>
      <div className="relative">
        <AspectRatio ratio={9 / 16}>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-full bg-black/60 p-4">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-sm">
            {video.duration}
          </div>
        </AspectRatio>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <SmartSaveButton
            item={video}
            itemType="video"
            size="sm"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white"
            showDuplicatePreview={false}
            onSaveSuccess={(savedItem, isDuplicate) => {
              const message = isDuplicate ? "Video already saved" : "Video saved to Plate";
              const toastFn = isDuplicate ? toast.info : toast.success;
              
              toastFn(message, isDuplicate ? undefined : {
                description: video.title,
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
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video info */}
      <div className="p-3 space-y-1">
        <h3 className="line-clamp-2">{video.title}</h3>
        <p className="text-muted-foreground">{video.channelName}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{video.views} views</span>
        </div>
        <div className="flex gap-1 flex-wrap mt-2">
          {video.category.slice(0, 3).map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}