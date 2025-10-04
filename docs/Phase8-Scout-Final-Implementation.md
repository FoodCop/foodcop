# Phase 8: Scout Page - Final Implementation Plan

**Date**: October 1, 2025  
**Status**: 🚀 READY TO IMPLEMENT  
**Dependencies**: MapLibre GL JS, Google Places API, Google Directions API, Supabase Realtime  

---

## 🎯 **Implementation Objectives**

### **Primary Goals**
1. **Restaurant Markers Integration** - Display restaurants on MapLibre map with category icons
2. **Restaurant Details Panel** - Rich info panels with save-to-plate integration
3. **Search & Filter System** - Map-based restaurant discovery with real-time filtering
4. **Route Planning** - Google Directions integration with polyline display

### **Success Metrics**
- Map load time: <3 seconds
- Restaurant search results: <2 seconds
- Location detection: <5 seconds accuracy
- Save-to-plate conversion: 25%+ from map

---

## 🏗️ **Technical Architecture**

### **Component Structure**
```
components/scout/
├── RestaurantMarkers.tsx         # Restaurant marker system with clustering
├── RestaurantDetailsPanel.tsx    # Rich restaurant info panel
├── MapSearchControl.tsx          # Search overlay on map
├── FilterPanel.tsx               # Advanced filtering system
├── RouteLayer.tsx                # Route display with polylines
├── MarkerCluster.tsx             # Performance marker clustering
├── RestaurantPopup.tsx           # Quick info popup on marker click
└── NavigationControls.tsx        # Enhanced map controls

lib/scout/
├── restaurantMarkerService.ts    # Restaurant marker management
├── routeService.ts               # Google Directions integration
├── mapBoundsService.ts           # Viewport-based restaurant loading
├── markerClusterService.ts       # High-performance clustering
└── geoJsonConverter.ts           # Route polyline to GeoJSON conversion
```

---

## 🗺️ **Phase 8A: Restaurant Markers System (Week 1)**

### **1. Restaurant Marker Components**

#### **File: `components/scout/RestaurantMarkers.tsx`**
```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { RestaurantMarkerService } from '@/lib/scout/restaurantMarkerService';

interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating?: number;
  price_level?: number;
  types: string[];
  photos?: string[];
  address: string;
  distance?: number;
}

interface RestaurantMarkersProps {
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onRestaurantHover: (restaurant: Restaurant | null) => void;
  mapViewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  clustering?: boolean;
}

export function RestaurantMarkers({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  onRestaurantHover,
  mapViewport,
  clustering = true
}: RestaurantMarkersProps) {
  const [hoveredRestaurant, setHoveredRestaurant] = useState<Restaurant | null>(null);

  // Cluster restaurants based on zoom level and density
  const clusteredRestaurants = useMemo(() => {
    if (!clustering || mapViewport.zoom > 14) {
      return restaurants.map(r => ({ ...r, isCluster: false, count: 1 }));
    }

    return RestaurantMarkerService.clusterRestaurants(restaurants, mapViewport);
  }, [restaurants, mapViewport, clustering]);

  const getMarkerIcon = (restaurant: Restaurant, isSelected: boolean, isHovered: boolean) => {
    const primaryType = restaurant.types[0] || 'restaurant';
    const config = RestaurantMarkerService.getMarkerConfig(primaryType);
    
    const baseSize = isSelected ? 36 : isHovered ? 32 : 28;
    const zoomScale = Math.max(0.6, Math.min(1.2, mapViewport.zoom / 14));
    const size = baseSize * zoomScale;

    return {
      icon: config.icon,
      color: config.color,
      size: size,
      borderColor: isSelected ? '#2563eb' : isHovered ? '#3b82f6' : '#ffffff',
      borderWidth: isSelected ? 3 : 2
    };
  };

  const handleMarkerClick = (restaurant: Restaurant, event: any) => {
    event.originalEvent.stopPropagation();
    onRestaurantSelect(restaurant);
  };

  const handleMarkerHover = (restaurant: Restaurant | null) => {
    setHoveredRestaurant(restaurant);
    onRestaurantHover(restaurant);
  };

  return (
    <>
      {clusteredRestaurants.map((item) => {
        const isSelected = selectedRestaurant?.id === item.id;
        const isHovered = hoveredRestaurant?.id === item.id;
        const markerConfig = getMarkerIcon(item, isSelected, isHovered);

        return (
          <div key={item.id}>
            <Marker
              longitude={item.longitude}
              latitude={item.latitude}
              anchor="bottom"
              onClick={(event) => handleMarkerClick(item, event)}
            >
              <div
                className={`restaurant-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{
                  width: markerConfig.size,
                  height: markerConfig.size,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  transform: isSelected ? 'scale(1.1)' : isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={() => handleMarkerHover(item)}
                onMouseLeave={() => handleMarkerHover(null)}
              >
                {/* Marker Background */}
                <div
                  className="marker-background"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: markerConfig.color,
                    borderRadius: '50% 50% 50% 0%',
                    transform: 'rotate(-45deg)',
                    border: `${markerConfig.borderWidth}px solid ${markerConfig.borderColor}`,
                    boxShadow: isSelected || isHovered 
                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                      : '0 2px 6px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Marker Icon */}
                  <div
                    style={{
                      transform: 'rotate(45deg)',
                      fontSize: markerConfig.size * 0.5,
                      color: 'white',
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {item.isCluster ? item.count : markerConfig.icon}
                  </div>
                </div>

                {/* Rating Badge */}
                {!item.isCluster && item.rating && (
                  <div
                    className="rating-badge"
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {item.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </Marker>

            {/* Quick Info Popup on Hover */}
            {isHovered && !item.isCluster && (
              <Popup
                longitude={item.longitude}
                latitude={item.latitude}
                anchor="top"
                closeButton={false}
                closeOnClick={false}
                className="restaurant-popup"
                offset={[0, -markerConfig.size - 10]}
              >
                <div className="p-3 min-w-[200px]">
                  <h3 className="font-semibold text-sm text-gray-800 mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    {item.rating && (
                      <span className="flex items-center gap-1">
                        ⭐ {item.rating.toFixed(1)}
                      </span>
                    )}
                    {item.price_level && (
                      <span className="text-green-600 font-semibold">
                        {'$'.repeat(item.price_level)}
                      </span>
                    )}
                    {item.distance && (
                      <span>{(item.distance / 1000).toFixed(1)}km</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {item.address}
                  </p>
                  <div className="mt-2 pt-2 border-t text-center">
                    <span className="text-xs text-blue-600 font-medium">
                      Click for details
                    </span>
                  </div>
                </div>
              </Popup>
            )}
          </div>
        );
      })}
    </>
  );
}
```

#### **File: `lib/scout/restaurantMarkerService.ts`**
```typescript
interface MarkerConfig {
  icon: string;
  color: string;
  category: string;
}

interface ClusteredRestaurant extends Restaurant {
  isCluster: boolean;
  count: number;
  childRestaurants?: Restaurant[];
}

export class RestaurantMarkerService {
  private static markerConfigs: Record<string, MarkerConfig> = {
    // Primary restaurant categories
    restaurant: { icon: '🍽️', color: '#ef4444', category: 'Dining' },
    food: { icon: '🍽️', color: '#ef4444', category: 'Dining' },
    
    // Specific cuisine types
    meal_takeaway: { icon: '🥡', color: '#f97316', category: 'Takeaway' },
    cafe: { icon: '☕', color: '#8b5cf6', category: 'Café' },
    bakery: { icon: '🥐', color: '#f59e0b', category: 'Bakery' },
    bar: { icon: '🍺', color: '#3b82f6', category: 'Bar' },
    
    // Fast food
    meal_delivery: { icon: '🚚', color: '#10b981', category: 'Delivery' },
    fast_food: { icon: '🍔', color: '#ef4444', category: 'Fast Food' },
    
    // Fine dining
    fine_dining: { icon: '🍷', color: '#7c3aed', category: 'Fine Dining' },
    
    // Default fallback
    default: { icon: '🍽️', color: '#6b7280', category: 'Restaurant' }
  };

  static getMarkerConfig(restaurantType: string): MarkerConfig {
    const normalizedType = restaurantType.toLowerCase().replace(/\s+/g, '_');
    return this.markerConfigs[normalizedType] || this.markerConfigs.default;
  }

  static clusterRestaurants(
    restaurants: Restaurant[], 
    viewport: { latitude: number; longitude: number; zoom: number }
  ): ClusteredRestaurant[] {
    if (viewport.zoom > 14) {
      return restaurants.map(r => ({ ...r, isCluster: false, count: 1 }));
    }

    const clustered: ClusteredRestaurant[] = [];
    const processed = new Set<string>();
    const clusterDistance = this.getClusterDistance(viewport.zoom);

    restaurants.forEach(restaurant => {
      if (processed.has(restaurant.id)) return;

      const cluster: Restaurant[] = [restaurant];
      processed.add(restaurant.id);

      // Find nearby restaurants for clustering
      restaurants.forEach(other => {
        if (processed.has(other.id)) return;

        const distance = this.calculateDistance(
          restaurant.latitude, restaurant.longitude,
          other.latitude, other.longitude
        );

        if (distance < clusterDistance) {
          cluster.push(other);
          processed.add(other.id);
        }
      });

      if (cluster.length > 1) {
        // Create cluster marker
        const centerLat = cluster.reduce((sum, r) => sum + r.latitude, 0) / cluster.length;
        const centerLng = cluster.reduce((sum, r) => sum + r.longitude, 0) / cluster.length;
        
        clustered.push({
          id: `cluster_${restaurant.id}`,
          name: `${cluster.length} restaurants`,
          latitude: centerLat,
          longitude: centerLng,
          types: ['cluster'],
          address: 'Multiple locations',
          isCluster: true,
          count: cluster.length,
          childRestaurants: cluster
        });
      } else {
        // Single restaurant
        clustered.push({
          ...restaurant,
          isCluster: false,
          count: 1
        });
      }
    });

    return clustered;
  }

  private static getClusterDistance(zoom: number): number {
    // Return clustering distance in meters based on zoom level
    const distances = {
      10: 1000,  // 1km at city level
      11: 500,   // 500m
      12: 250,   // 250m
      13: 100,   // 100m
      14: 50     // 50m
    };

    return distances[Math.floor(zoom) as keyof typeof distances] || 50;
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  static getAllCategories(): Array<{ type: string; config: MarkerConfig }> {
    return Object.entries(this.markerConfigs)
      .filter(([type]) => type !== 'default')
      .map(([type, config]) => ({ type, config }));
  }

  static filterRestaurantsByType(restaurants: Restaurant[], types: string[]): Restaurant[] {
    if (types.length === 0) return restaurants;
    
    return restaurants.filter(restaurant => 
      restaurant.types.some(type => 
        types.some(filterType => 
          type.toLowerCase().includes(filterType.toLowerCase())
        )
      )
    );
  }
}
```

### **2. Restaurant Details Panel**

#### **File: `components/scout/RestaurantDetailsPanel.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, MapPin, Star, Phone, Globe, Clock, 
  Navigation, Share2, Heart 
} from 'lucide-react';
import { SaveToPlate } from '@/components/SaveToPlate';
import Image from 'next/image';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  price_level?: number;
  types: string[];
  photos?: string[];
  phone?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
  }>;
  distance?: number;
}

interface RestaurantDetailsPanelProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onGetDirections: (restaurant: Restaurant) => void;
  onShareRestaurant: (restaurant: Restaurant) => void;
  userLocation?: { lat: number; lng: number };
}

export function RestaurantDetailsPanel({
  restaurant,
  isOpen,
  onClose,
  onGetDirections,
  onShareRestaurant,
  userLocation
}: RestaurantDetailsPanelProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (!restaurant || !isOpen) return null;

  const priceDisplay = restaurant.price_level 
    ? '$'.repeat(restaurant.price_level) 
    : '';

  const primaryType = restaurant.types[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Restaurant';

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set([...prev, index]));
  };

  const validPhotos = restaurant.photos?.filter((_, index) => !imageErrors.has(index)) || [];

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            Restaurant Details
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo Gallery */}
          {validPhotos.length > 0 && (
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <Image
                  src={validPhotos[activePhotoIndex]}
                  alt={restaurant.name}
                  width={400}
                  height={225}
                  className="w-full h-56 object-cover"
                  onError={() => handleImageError(activePhotoIndex)}
                />
              </div>
              
              {/* Photo Navigation */}
              {validPhotos.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-2">
                    {validPhotos.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === activePhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => setActivePhotoIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* Restaurant Name & Basic Info */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{primaryType}</Badge>
                {restaurant.opening_hours?.open_now !== undefined && (
                  <Badge variant={restaurant.opening_hours.open_now ? "default" : "destructive"}>
                    {restaurant.opening_hours.open_now ? 'Open Now' : 'Closed'}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                {restaurant.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {priceDisplay && (
                  <div className="text-green-600 font-semibold">
                    {priceDisplay}
                  </div>
                )}
                
                {restaurant.distance && (
                  <div className="flex items-center gap-1">
                    <Navigation className="h-4 w-4" />
                    <span>{(restaurant.distance / 1000).toFixed(1)}km away</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
              <span className="text-sm text-gray-700">{restaurant.address}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <SaveToPlate
                itemId={restaurant.id}
                itemType="restaurant"
                title={restaurant.name}
                variant="button"
                size="sm"
                className="w-full"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGetDirections(restaurant)}
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Directions
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {restaurant.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${restaurant.phone}`)}
                  className="w-full"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShareRestaurant(restaurant)}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>

            {/* Website Link */}
            {restaurant.website && (
              <Button
                variant="link"
                size="sm"
                onClick={() => window.open(restaurant.website, '_blank')}
                className="w-full p-0 h-auto text-blue-600 hover:text-blue-800"
              >
                <Globe className="h-4 w-4 mr-1" />
                Visit Website
              </Button>
            )}

            {/* Opening Hours */}
            {restaurant.opening_hours?.weekday_text && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Opening Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  {restaurant.opening_hours.weekday_text.map((hours, index) => (
                    <div key={index} className="text-gray-600">
                      {hours}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reviews Sample */}
            {restaurant.reviews && restaurant.reviews.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {restaurant.reviews.slice(0, 2).map((review, index) => (
                    <div key={index} className="border-b last:border-b-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{review.author_name}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {review.text}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔍 **Phase 8B: Search & Filter Integration (Week 2)**

### **3. Map Search Control**

#### **File: `components/scout/MapSearchControl.tsx`**
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, MapPin, Loader2, 
  X, SlidersHorizontal 
} from 'lucide-react';

interface SearchFilters {
  query: string;
  types: string[];
  minRating: number;
  maxDistance: number; // in meters
  priceLevel: number[];
  openNow: boolean;
}

interface MapSearchControlProps {
  onSearch: (filters: SearchFilters) => void;
  onClearSearch: () => void;
  isLoading: boolean;
  resultCount: number;
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  userLocation?: { lat: number; lng: number };
}

const RESTAURANT_TYPES = [
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { id: 'cafe', label: 'Cafés', icon: '☕' },
  { id: 'fast_food', label: 'Fast Food', icon: '🍔' },
  { id: 'bar', label: 'Bars', icon: '🍺' },
  { id: 'bakery', label: 'Bakeries', icon: '🥐' },
  { id: 'meal_takeaway', label: 'Takeaway', icon: '🥡' }
];

const PRICE_LEVELS = [
  { value: 1, label: '$', description: 'Inexpensive' },
  { value: 2, label: '$$', description: 'Moderate' },
  { value: 3, label: '$$$', description: 'Expensive' },
  { value: 4, label: '$$$$', description: 'Very Expensive' }
];

export function MapSearchControl({
  onSearch,
  onClearSearch,
  isLoading,
  resultCount,
  mapBounds,
  userLocation
}: MapSearchControlProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    types: [],
    minRating: 0,
    maxDistance: 5000, // 5km default
    priceLevel: [],
    openNow: false
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasFilters = 
      filters.query.length > 0 ||
      filters.types.length > 0 ||
      filters.minRating > 0 ||
      filters.maxDistance < 5000 ||
      filters.priceLevel.length > 0 ||
      filters.openNow;
    
    setHasActiveFilters(hasFilters);
  }, [filters]);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      query: '',
      types: [],
      minRating: 0,
      maxDistance: 5000,
      priceLevel: [],
      openNow: false
    });
    onClearSearch();
  };

  const toggleType = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(typeId)
        ? prev.types.filter(t => t !== typeId)
        : [...prev.types, typeId]
    }));
  };

  const togglePriceLevel = (level: number) => {
    setFilters(prev => ({
      ...prev,
      priceLevel: prev.priceLevel.includes(level)
        ? prev.priceLevel.filter(p => p !== level)
        : [...prev.priceLevel, level]
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      {/* Main Search Bar */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center p-3">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search restaurants, cuisines, or dishes..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              onKeyPress={handleKeyPress}
              className="border-0 focus-visible:ring-0 p-0"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-2 ${hasActiveFilters ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Restaurant Types */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Restaurant Types
              </label>
              <div className="flex flex-wrap gap-2">
                {RESTAURANT_TYPES.map(type => (
                  <Badge
                    key={type.id}
                    variant={filters.types.includes(type.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleType(type.id)}
                  >
                    {type.icon} {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Price Level */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Price Range
              </label>
              <div className="flex gap-2">
                {PRICE_LEVELS.map(price => (
                  <Button
                    key={price.value}
                    variant={filters.priceLevel.includes(price.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePriceLevel(price.value)}
                    title={price.description}
                  >
                    {price.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rating & Distance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value={0}>Any rating</option>
                  <option value={3}>3+ stars</option>
                  <option value={4}>4+ stars</option>
                  <option value={4.5}>4.5+ stars</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Max Distance
                </label>
                <select
                  value={filters.maxDistance}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={20000}>20 km</option>
                </select>
              </div>
            </div>

            {/* Open Now Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="openNow"
                checked={filters.openNow}
                onChange={(e) => setFilters(prev => ({ ...prev, openNow: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="openNow" className="text-sm text-gray-700">
                Open now only
              </label>
            </div>
          </div>
        )}

        {/* Search Results Summary */}
        {resultCount > 0 && (
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{resultCount} restaurants found</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Search this area
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🛣️ **Phase 8C: Route Planning Integration (Week 3)**

### **4. Route Service**

#### **File: `lib/scout/routeService.ts`**
```typescript
interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  polyline: string;
}

interface Route {
  overview_polyline: string;
  legs: Array<{
    steps: RouteStep[];
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    start_address: string;
    end_address: string;
  }>;
  summary: string;
  warnings: string[];
}

interface DirectionsResponse {
  routes: Route[];
  status: string;
}

export class RouteService {
  private static readonly GOOGLE_DIRECTIONS_URL = '/api/scout/directions';

  static async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING' = 'DRIVING'
  ): Promise<Route | null> {
    try {
      const response = await fetch(this.GOOGLE_DIRECTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: travelMode.toLowerCase()
        })
      });

      const data: DirectionsResponse = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        return data.routes[0];
      }

      console.error('Directions API error:', data.status);
      return null;
    } catch (error) {
      console.error('Failed to get directions:', error);
      return null;
    }
  }

  static decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates: Array<{ lat: number; lng: number }> = [];

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return coordinates;
  }

  static polylineToGeoJSON(encoded: string): GeoJSON.Feature<GeoJSON.LineString> {
    const coordinates = this.decodePolyline(encoded);
    
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map(coord => [coord.lng, coord.lat])
      }
    };
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${minutes}m`;
  }

  static formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  }
}
```

#### **File: `app/api/scout/directions/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, mode = 'driving' } = body;

    if (!origin || !destination) {
      return NextResponse.json({
        error: 'Origin and destination are required'
      }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'Google Maps API key not configured'
      }, { status: 500 });
    }

    // Build Google Directions API URL
    const params = new URLSearchParams({
      origin,
      destination,
      mode,
      key: apiKey,
      alternatives: 'false',
      units: 'metric'
    });

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data);
      return NextResponse.json({
        error: `Directions API error: ${data.status}`,
        details: data.error_message
      }, { status: 400 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Directions API error:', error);
    return NextResponse.json({
      error: 'Failed to get directions'
    }, { status: 500 });
  }
}
```

### **5. Route Layer Component**

#### **File: `components/scout/RouteLayer.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl';
import { RouteService } from '@/lib/scout/routeService';

interface RouteLayerProps {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  onRouteCalculated?: (route: any) => void;
  visible?: boolean;
}

export function RouteLayer({
  origin,
  destination,
  travelMode = 'DRIVING',
  onRouteCalculated,
  visible = true
}: RouteLayerProps) {
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!origin || !destination || !visible) {
      setRouteGeoJSON(null);
      return;
    }

    calculateRoute();
  }, [origin, destination, travelMode, visible]);

  const calculateRoute = async () => {
    if (!origin || !destination) return;

    setIsLoading(true);
    
    try {
      const route = await RouteService.getDirections(origin, destination, travelMode);
      
      if (route) {
        const geoJSON = RouteService.polylineToGeoJSON(route.overview_polyline);
        setRouteGeoJSON(geoJSON);
        onRouteCalculated?.(route);
      } else {
        setRouteGeoJSON(null);
      }
    } catch (error) {
      console.error('Failed to calculate route:', error);
      setRouteGeoJSON(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!routeGeoJSON || !visible) return null;

  return (
    <Source id="route" type="geojson" data={routeGeoJSON}>
      <Layer
        id="route-line"
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round'
        }}
        paint={{
          'line-color': '#3b82f6',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 3,
            18, 8
          ],
          'line-opacity': 0.8
        }}
      />
      
      {/* Route outline for better visibility */}
      <Layer
        id="route-outline"
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round'
        }}
        paint={{
          'line-color': '#ffffff',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 5,
            18, 12
          ],
          'line-opacity': 0.6
        }}
      />
    </Source>
  );
}
```

---

## 📋 **Implementation Timeline**

### **Week 1: Restaurant Markers**
- [ ] Day 1-2: RestaurantMarkers component with clustering
- [ ] Day 3-4: RestaurantMarkerService and configuration
- [ ] Day 5-7: Integration with existing ScoutDebug search

### **Week 2: Search & Details**
- [ ] Day 1-2: MapSearchControl with advanced filtering
- [ ] Day 3-4: RestaurantDetailsPanel with full info display
- [ ] Day 5-7: Integration and performance optimization

### **Week 3: Route Planning**
- [ ] Day 1-2: RouteService and Google Directions API
- [ ] Day 3-4: RouteLayer component with polyline display
- [ ] Day 5-7: Complete integration and testing

### **Testing & Polish**
- [ ] Cross-browser testing
- [ ] Mobile optimization
- [ ] Performance monitoring
- [ ] User experience refinement

---

## 🎯 **Success Metrics**

### **Performance Targets**
- [ ] Map load time: <3 seconds
- [ ] Restaurant search: <2 seconds
- [ ] Route calculation: <3 seconds
- [ ] Marker clustering: Handle 500+ restaurants smoothly

### **Feature Adoption**
- [ ] Save-to-plate from map: 25%+ conversion
- [ ] Directions usage: 40%+ of restaurant views
- [ ] Filter usage: 60%+ of searches
- [ ] Mobile usage: 70%+ of interactions

This implementation plan provides complete technical specifications for transforming the Scout page into a fully-featured restaurant discovery and navigation system.