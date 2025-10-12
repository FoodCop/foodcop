"use client";

import { useState, useEffect } from "react";
import { X, Maximize2, Minimize2, Volume2, VolumeX, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoData {
  id: string;
  title: string;
  channelTitle: string;
  description?: string;
  thumbnail: string;
  duration: string;
  viewCount?: string;
  youtube_url?: string;
}

interface EnhancedVideoPlayerDialogProps {
  video: VideoData | null;
  isOpen: boolean;
  onClose: () => void;
  showExternalLink?: boolean;
}

export function EnhancedVideoPlayerDialog({ 
  video, 
  isOpen, 
  onClose, 
  showExternalLink = false 
}: EnhancedVideoPlayerDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Clean up when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      setIsMuted(false);
    }
  }, [isOpen]);

  if (!video) return null;

  const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1${isMuted ? '&mute=1' : ''}`;
  const youtubeUrl = video.youtube_url || `https://www.youtube.com/watch?v=${video.id}`;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const openInYouTube = () => {
    window.open(youtubeUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`p-0 border-0 bg-black ${
          isFullscreen 
            ? 'max-w-full max-h-full w-screen h-screen' 
            : 'max-w-4xl w-[90vw] max-h-[80vh]'
        }`}
      >
        <div className="relative w-full h-full bg-black">
          {/* Video Player */}
          <div className={`relative ${isFullscreen ? 'h-full' : 'aspect-video'} bg-black`}>
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleMute}
                className="bg-black/70 text-white hover:bg-black/90"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              {showExternalLink && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openInYouTube}
                  className="bg-black/70 text-white hover:bg-black/90"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-black/70 text-white hover:bg-black/90"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="bg-black/70 text-white hover:bg-black/90"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video Info (only show when not fullscreen) */}
          {!isFullscreen && (
            <div className="p-4 bg-background">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium">{video.channelTitle}</span>
                <span>•</span>
                <span>{video.viewCount ? `${parseInt(video.viewCount).toLocaleString()} views` : 'Views unavailable'}</span>
                {showExternalLink && (
                  <>
                    <span>•</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-sm text-primary"
                      onClick={openInYouTube}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Watch on YouTube
                    </Button>
                  </>
                )}
              </div>
              {video.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {video.description}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedVideoPlayerDialog;