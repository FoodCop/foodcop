"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Users, Utensils, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { YouTubeVideo } from "@/app/api/youtube/videos/route";
import { ShareWithCrewDialog } from "./ShareWithCrewDialog";

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
  onSaveToPlate?: (video: YouTubeVideo) => void;
  onWatch?: (video: YouTubeVideo) => void;
}

// Convert ISO 8601 duration to readable format
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

// Format view count
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

// Format published date
const formatPublishedDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export function YouTubeVideoCard({ video, onSaveToPlate, onWatch }: YouTubeVideoCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  
  const handleSaveToPlate = () => {
    setIsSaved(!isSaved);
    onSaveToPlate?.(video);
  };
  
  const handleWatch = () => {
    onWatch?.(video);
  };
  
  return (
    <Card className="overflow-hidden bg-card border-border hover:shadow-lg transition-shadow">
      <div className="relative aspect-video cursor-pointer" onClick={handleWatch}>
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button size="lg" className="rounded-full">
            <Play className="h-6 w-6 ml-1" />
          </Button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
          {formatDuration(video.duration)}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 cursor-pointer hover:text-primary" onClick={handleWatch}>
          {video.title}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-medium">{video.channelTitle}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViewCount(video.viewCount)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatPublishedDate(video.publishedAt)}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {video.description}
        </p>
        
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {video.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveToPlate}
              className={isSaved ? "text-blue-500" : ""}
            >
              <Utensils className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="ml-1">Save to Plate</span>
            </Button>
            
            <ShareWithCrewDialog
              video={video}
              onShare={(selectedFriends, message) => {
                console.log('Sharing with crew:', { selectedFriends, message });
                // TODO: Implement actual sharing
              }}
            />
          </div>
          
          <Button variant="outline" size="sm" onClick={handleWatch}>
            Watch
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default YouTubeVideoCard;