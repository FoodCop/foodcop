'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';
import { MediaFile, MediaViewerState } from '../utils/ChatTypes';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaFile[];
  initialIndex?: number;
  canDelete?: boolean;
  canShare?: boolean;
  onDelete?: (mediaId: string) => void;
  onShare?: (media: MediaFile) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
  canDelete = false,
  canShare = true,
  onDelete,
  onShare
}) => {
  const [viewerState, setViewerState] = useState<MediaViewerState>({
    isOpen: false,
    currentIndex: initialIndex,
    media: [],
    showControls: true,
    zoom: 1,
    canDelete,
    canShare
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [videoControls, setVideoControls] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMedia = media[viewerState.currentIndex];

  // Initialize viewer state when props change
  useEffect(() => {
    setViewerState(prev => ({
      ...prev,
      isOpen,
      currentIndex: Math.max(0, Math.min(initialIndex, media.length - 1)),
      media,
      canDelete,
      canShare
    }));
  }, [isOpen, media, initialIndex, canDelete, canShare]);

  // Reset zoom and position when media changes
  useEffect(() => {
    setViewerState(prev => ({ ...prev, zoom: 1 }));
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setVideoControls(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, [viewerState.currentIndex]);

  // Auto-hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    setViewerState(prev => ({ ...prev, showControls: true }));
    
    controlsTimeoutRef.current = setTimeout(() => {
      setViewerState(prev => ({ ...prev, showControls: false }));
    }, 3000);
  }, []);

  // Handle mouse movement for auto-hiding controls
  const handleControlsMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (media.length <= 1) return;
    setViewerState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : media.length - 1
    }));
  }, [media.length]);

  const goToNext = useCallback(() => {
    if (media.length <= 1) return;
    setViewerState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex < media.length - 1 ? prev.currentIndex + 1 : 0
    }));
  }, [media.length]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, 5)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.5, 0.1)
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setViewerState(prev => ({ ...prev, zoom: 1 }));
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // Rotation
  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  // Drag functionality for zoomed images
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewerState.zoom <= 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [viewerState.zoom, position]);

  const handleDragMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || viewerState.zoom <= 1) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, viewerState.zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gestures for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom (simplified)
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      // Store initial distance for pinch calculations
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        case 'r':
        case 'R':
          rotate();
          break;
        case ' ':
          e.preventDefault();
          if (currentMedia?.type === 'video' && videoRef.current) {
            if (videoControls.isPlaying) {
              videoRef.current.pause();
            } else {
              videoRef.current.play();
            }
            setVideoControls(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, zoomIn, zoomOut, resetZoom, rotate, currentMedia, videoControls.isPlaying, onClose]);

  // Video controls
  const toggleVideoPlayback = useCallback(() => {
    if (!videoRef.current) return;

    if (videoControls.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setVideoControls(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [videoControls.isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;

    videoRef.current.muted = !videoRef.current.muted;
    setVideoControls(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Handle video events
  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    setVideoControls(prev => ({
      ...prev,
      currentTime: videoRef.current!.currentTime
    }));
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    
    setVideoControls(prev => ({
      ...prev,
      duration: videoRef.current!.duration
    }));
  }, []);

  // Download media
  const downloadMedia = useCallback(async () => {
    if (!currentMedia) return;

    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = currentMedia.metadata?.filename || `media_${currentMedia.id}`;
      link.style.display = 'none';
      
      // Safer DOM manipulation
      document.body.appendChild(link);
      link.click();
      
      // Clean up immediately
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading media:', error);
    }
  }, [currentMedia]);

  // Share media
  const shareMedia = useCallback(() => {
    if (!currentMedia || !onShare) return;
    onShare(currentMedia);
  }, [currentMedia, onShare]);

  // Delete media
  const deleteMedia = useCallback(() => {
    if (!currentMedia || !onDelete) return;
    onDelete(currentMedia.id);
    
    // Navigate to next media or close if no more media
    if (media.length > 1) {
      if (viewerState.currentIndex >= media.length - 1) {
        setViewerState(prev => ({ ...prev, currentIndex: 0 }));
      }
    } else {
      onClose();
    }
  }, [currentMedia, onDelete, media.length, viewerState.currentIndex, onClose]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Format time for video
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentMedia) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-none max-h-none w-screen h-screen p-0 bg-black/95"
        ref={containerRef}
        onMouseMove={handleControlsMouseMove}
      >
        {/* Media Content */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleDragMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
        >
          {currentMedia.type === 'image' ? (
            <div
              ref={imageRef}
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${viewerState.zoom}) rotate(${rotation}deg)`,
                cursor: viewerState.zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <img
                src={currentMedia.url}
                alt={currentMedia.metadata?.filename || 'Media'}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                draggable={false}
              />
            </div>
          ) : currentMedia.type === 'video' ? (
            <video
              ref={videoRef}
              src={currentMedia.url}
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '90vh', maxWidth: '90vw' }}
              controls={false}
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onPlay={() => setVideoControls(prev => ({ ...prev, isPlaying: true }))}
              onPause={() => setVideoControls(prev => ({ ...prev, isPlaying: false }))}
            />
          ) : (
            <div className="flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg">{currentMedia.metadata?.filename}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {(currentMedia.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls Overlay */}
        {viewerState.showControls && (
          <>
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  
                  <div className="text-white">
                    <h3 className="font-medium">{currentMedia.metadata?.filename}</h3>
                    <p className="text-sm text-gray-300">
                      {viewerState.currentIndex + 1} of {media.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentMedia.type === 'image' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={zoomOut}
                        className="text-white hover:bg-white/20"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      
                      <Badge variant="secondary" className="px-2 py-1">
                        {Math.round(viewerState.zoom * 100)}%
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={zoomIn}
                        className="text-white hover:bg-white/20"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={rotate}
                        className="text-white hover:bg-white/20"
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>

                  {canShare && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={shareMedia}
                      className="text-white hover:bg-white/20"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadMedia}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            {media.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Video Controls */}
            {currentMedia.type === 'video' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVideoPlayback}
                    className="text-white hover:bg-white/20"
                  >
                    {videoControls.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>

                  <div className="flex-1 flex items-center gap-2 text-white text-sm">
                    <span>{formatTime(videoControls.currentTime)}</span>
                    <div className="flex-1 bg-white/20 rounded-full h-1">
                      <div 
                        className="bg-white rounded-full h-1 transition-all"
                        style={{ 
                          width: `${(videoControls.currentTime / videoControls.duration) * 100}%` 
                        }}
                      />
                    </div>
                    <span>{formatTime(videoControls.duration)}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {videoControls.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Click overlay for video play/pause */}
        {currentMedia.type === 'video' && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            onClick={toggleVideoPlayback}
          >
            {/* Transparent overlay for clicks */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;