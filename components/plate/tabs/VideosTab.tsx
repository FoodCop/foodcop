'use client';

import { useState, useEffect } from 'react';
import { Video, Play, Clock, Eye, ExternalLink, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseBrowser } from '@/lib/supabase/client';
import { EnhancedVideoPlayerDialog } from '@/components/youtube/EnhancedVideoPlayerDialog';

interface SavedVideo {
  id: string;
  item_id: string;
  metadata: {
    title: string;
    description?: string;
    image_url: string;
    channel: string;
    duration: string;
    view_count?: string;
    youtube_url: string;
  };
  created_at: string;
}

// Helper functions from YouTubeVideoCard
const formatDuration = (duration: string) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatViewCount = (count: string | undefined) => {
  if (!count) return "0 views";
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  }
  return `${num} views`;
};

export function VideosTab() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    const loadSavedVideos = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('saved_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('item_type', 'video')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading saved videos:', error);
          setError('Failed to load saved videos');
          return;
        }

        setVideos(data || []);
      } catch (err) {
        console.error('Error loading saved videos:', err);
        setError('Failed to load saved videos');
      } finally {
        setLoading(false);
      }
    };

    loadSavedVideos();
  }, [user]);

  const handleRemoveVideo = async (videoId: string) => {
    if (!user) return;

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing video:', error);
        return;
      }

      // Update local state
      setVideos(prev => prev.filter(video => video.id !== videoId));
    } catch (err) {
      console.error('Error removing video:', err);
    }
  };

  const handleWatchVideo = (video: SavedVideo) => {
    // Convert SavedVideo to the format expected by EnhancedVideoPlayerDialog
    const videoData = {
      id: video.item_id,
      title: video.metadata.title,
      channelTitle: video.metadata.channel,
      description: video.metadata.description,
      thumbnail: video.metadata.image_url,
      duration: video.metadata.duration,
      viewCount: video.metadata.view_count,
      youtube_url: video.metadata.youtube_url
    };
    
    setSelectedVideo(videoData);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your saved videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Videos</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
        <p className="text-gray-600 mb-4">
          Please sign in to view your saved videos.
        </p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Videos</h3>
        <p className="text-gray-600 mb-4">
          Discover cooking videos in the Bites section and save them here.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/bites'}>
          <Video className="w-4 h-4 mr-2" />
          Browse Videos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Your Saved Videos</h3>
          <p className="text-sm text-gray-600">{videos.length} video{videos.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/bites'}>
          <Video className="w-4 h-4 mr-2" />
          Browse More
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-video">
              <Image
                src={video.metadata.image_url}
                alt={video.metadata.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button 
                  size="lg" 
                  className="rounded-full"
                  onClick={() => handleWatchVideo(video)}
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                {formatDuration(video.metadata.duration)}
              </div>
            </div>
            
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground line-clamp-2 mb-2">
                {video.metadata.title}
              </h4>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="font-medium">{video.metadata.channel}</span>
                {video.metadata.view_count && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViewCount(video.metadata.view_count)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Clock className="h-3 w-3" />
                <span>Saved {new Date(video.created_at).toLocaleDateString()}</span>
              </div>
              
              {video.metadata.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {video.metadata.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleWatchVideo(video)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Watch
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveVideo(video.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Video Player Dialog */}
      <EnhancedVideoPlayerDialog
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
        showExternalLink={true}
      />
    </div>
  );
}