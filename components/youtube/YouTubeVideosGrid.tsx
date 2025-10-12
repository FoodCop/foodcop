"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { YouTubeVideoCard } from "./YouTubeVideoCard";
import { VideoPlayerDialog } from "./VideoPlayerDialog";
import { ShareWithCrewDialog } from "./ShareWithCrewDialog";
import { YouTubeVideo } from "@/app/api/youtube/videos/route";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";

const VIDEO_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "quick recipes", label: "Quick Recipes" },
  { value: "baking", label: "Baking" },
  { value: "healthy cooking", label: "Healthy Cooking" },
  { value: "street food", label: "Street Food" },
  { value: "desserts", label: "Desserts" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "asian cuisine", label: "Asian Cuisine" },
  { value: "italian food", label: "Italian Food" },
  { value: "mexican food", label: "Mexican Food" },
];

export function YouTubeVideosGrid() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("cooking food recipe");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const fetchVideos = async (query: string = searchQuery, category: string = selectedCategory) => {
    setIsSearching(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        q: query,
        maxResults: "24",
        ...(category && category !== "all" && { category })
      });
      
      const response = await fetch(`/api/youtube/videos?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.videos);
      } else {
        setError(data.message || "Failed to fetch videos");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching videos:", err);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          q: "cooking food recipe",
          maxResults: "24"
        });
        
        const response = await fetch(`/api/youtube/videos?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setVideos(data.videos);
        } else {
          setError(data.message || "Failed to fetch videos");
        }
      } catch (err) {
        setError("Network error occurred");
        console.error("Error fetching videos:", err);
      } finally {
        setIsSearching(false);
        setLoading(false);
      }
    };
    
    initialFetch();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(searchQuery, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchVideos(searchQuery, category);
  };

  const handleVideoSaveToPlate = async (video: YouTubeVideo) => {
    if (!user) {
      console.log("User not authenticated");
      return;
    }

    try {
      const response = await fetch('/api/save-to-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: 'video',
          itemId: video.id,
          metadata: {
            title: video.title,
            description: video.description,
            image_url: video.thumbnail,
            channel: video.channelTitle,
            duration: video.duration,
            view_count: video.viewCount,
            youtube_url: `https://www.youtube.com/watch?v=${video.id}`
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log("Video saved to plate:", video.title);
        // TODO: Show success toast
      } else {
        console.error("Failed to save video:", data.message);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Error saving video:", error);
      // TODO: Show error toast
    }
  };

  const handleVideoWatch = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading cooking videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Videos</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchVideos()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cooking videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>
        
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {VIDEO_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video Grid */}
      {videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No videos found. Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <YouTubeVideoCard
              key={video.id}
              video={video}
              onSaveToPlate={handleVideoSaveToPlate}
              onWatch={handleVideoWatch}
            />
          ))}
        </div>
      )}

      {/* Loading More State */}
      {isSearching && videos.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading more videos...</span>
        </div>
      )}

      {/* Video Player Dialog */}
      <VideoPlayerDialog
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
      />
    </div>
  );
}

export default YouTubeVideosGrid;