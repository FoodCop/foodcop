'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, MapPin, Star, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { savedItemsService } from '@/lib/savedItemsService';

interface FoodSnap {
  id: string;
  image_url: string;
  restaurant_name: string;
  rating: number;
  food_tags: string[];
  visit_date: string;
  location_address?: string;
  created_at: string;
  source?: string; // 'saved_item' for photos saved via SaveToPlate
}

interface PhotosTabProps {
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export function PhotosTab({ loading, error, onRefresh }: PhotosTabProps) {
  const [photos, setPhotos] = useState<FoodSnap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      
      // Load both food_snaps and saved photos from saved_items
      const [snapsResponse, savedPhotosResult] = await Promise.all([
        fetch('/api/user/snaps'),
        savedItemsService.listSavedItems({ itemType: 'photo' })
      ]);
      
      const snapsData = await snapsResponse.json();
      
      let allPhotos: FoodSnap[] = [];
      
      // Add food_snaps
      if (snapsData.success && snapsData.data) {
        allPhotos = [...snapsData.data];
      }
      
      // Add saved photos from saved_items table
      if (savedPhotosResult.success && savedPhotosResult.data) {
        const savedPhotos = savedPhotosResult.data.map((item: any) => ({
          id: `saved_${item.id}`,
          image_url: item.metadata?.image_url || item.metadata?.imageUrl,
          restaurant_name: item.metadata?.restaurant_name || item.metadata?.title || 'Saved Photo',
          rating: item.metadata?.rating || 0,
          food_tags: item.metadata?.food_tags || [],
          visit_date: item.created_at,
          location_address: item.metadata?.location_address || item.metadata?.location?.address,
          created_at: item.created_at,
          source: 'saved_item'
        })).filter((photo: any) => photo.image_url); // Only include photos with valid image URLs
        
        allPhotos = [...allPhotos, ...savedPhotos];
      }
      
      // Sort by creation date (most recent first)
      allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your food photos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Photos</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="outline" onClick={onRefresh}>
          Try Again
        </Button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Food Photos Yet</h3>
        <p className="text-gray-600 mb-6">
          Start capturing your culinary adventures! Take photos of your meals and earn points.
        </p>
        <Link href="/snap">
          <Button className="bg-primary hover:bg-primary/90">
            <Camera className="w-4 h-4 mr-2" />
            Take Your First Snap
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Your Food Photos</h3>
          <p className="text-sm text-gray-600">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/snap">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </Link>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            {/* Photo */}
            <div className="relative aspect-square">
              <Image
                src={photo.image_url}
                alt={`Food at ${photo.restaurant_name}`}
                fill
                className="object-cover"
              />
              
              {/* Rating overlay */}
              {photo.rating > 0 && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-white text-xs font-medium">{photo.rating}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Restaurant name */}
              <div>
                <h4 className="font-semibold text-gray-900 truncate">
                  {photo.restaurant_name}
                </h4>
                
                {/* Location */}
                {photo.location_address && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{photo.location_address}</span>
                  </div>
                )}
              </div>

              {/* Food tags */}
              {photo.food_tags && photo.food_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.food_tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {photo.food_tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{photo.food_tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(photo.visit_date || photo.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}