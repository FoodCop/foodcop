import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Badge } from '../../badge';
import { Button } from '../../button';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Calendar,
  Clock,
  Eye,
  ExternalLink
} from 'lucide-react';
import type { VideoViewerProps } from '../types';

export const VideoViewer: React.FC<VideoViewerProps> = ({ data }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openInYouTube = () => {
    if (data.youtubeUrl) {
      window.open(data.youtubeUrl, '_blank');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Video Player */}
      <div className="relative">
        <div className="relative overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            src={data.url}
            poster={data.thumbnail}
            className="w-full h-auto max-h-[70vh]"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false} // We'll use custom controls
            onClick={togglePlay}
          />

          {/* Custom Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              <div className="flex-1 text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 w-full bg-white/30 rounded-full h-1">
              <div 
                className="bg-red-500 h-1 rounded-full transition-all duration-150"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Play Overlay for Paused State */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={togglePlay}
            >
              <div className="bg-white/90 rounded-full p-4">
                <Play className="w-8 h-8 text-gray-800 ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Video Fallback */}
        {data.youtubeUrl && (
          <div className="mt-2">
            <Button
              variant="outline"
              onClick={openInYouTube}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch on YouTube
            </Button>
          </div>
        )}
      </div>

      {/* Video Information */}
      <div className="grid gap-4">
        {/* Title and Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-start justify-between">
              <span>{data.title || 'Untitled Video'}</span>
              {data.youtubeUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInYouTube}
                  className="text-red-600 hover:text-red-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          {data.description && (
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {data.description}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Video Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Duration */}
          {data.duration && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {formatTime(data.duration)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* View Count */}
          {data.viewCount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-500" />
                  Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {data.viewCount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upload Date */}
          {data.uploadDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Uploaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  {new Date(data.uploadDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Channel Information */}
        {data.channelName && (
          <Card>
            <CardHeader>
              <CardTitle>Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {data.channelAvatar && (
                  <img 
                    src={data.channelAvatar} 
                    alt={data.channelName}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <p className="font-medium">{data.channelName}</p>
                  {data.subscriberCount && (
                    <p className="text-sm text-gray-600">
                      {data.subscriberCount.toLocaleString()} subscribers
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipe Connection */}
        {data.recipeTitle && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Connected Recipe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 font-medium">{data.recipeTitle}</p>
              {data.recipeDescription && (
                <p className="text-sm text-orange-600 mt-1">
                  {data.recipeDescription}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state for minimal metadata */}
      {!data.title && !data.description && !data.channelName && !data.duration && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">🎥</div>
            <p className="text-gray-500 mb-2">Saved Video</p>
            <p className="text-sm text-gray-400">
              No additional information available for this video.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-purple-500 mt-1">💡</div>
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Video Player Tips:</p>
              <ul className="text-xs text-purple-600 space-y-1">
                <li>• Click anywhere on the video to play/pause</li>
                <li>• Use the fullscreen button for better viewing</li>
                <li>• Click "Watch on YouTube" to open in a new tab</li>
                <li>• Press ESC to close the viewer</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoViewer;