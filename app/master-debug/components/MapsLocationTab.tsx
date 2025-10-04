"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, MapPin, Search, Navigation } from "lucide-react";
import { DebugService } from "../lib/debug-service";
import type { SystemHealth, SearchResult, GeocodingResult } from "../lib/types";

interface MapsLocationTabProps {
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
}

export function MapsLocationTab({ systemHealth, onRefresh }: MapsLocationTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map when Google Maps API is available
    if (systemHealth?.apis.googleMaps?.connected && (window as any).google && mapRef.current) {
      initializeMap();
    }
  }, [systemHealth]);

  const initializeMap = () => {
    if (!mapRef.current || !(window as any).google) return;

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      zoom: 13,
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "on" }]
        }
      ]
    });

    // Add click listener for reverse geocoding
    map.addListener("click", async (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      await performReverseGeocode(lat, lng);
    });

    // If we have current location, center on it
    if (currentLocation) {
      map.setCenter(currentLocation);
      new (window as any).google.maps.Marker({
        position: currentLocation,
        map: map,
        title: "Your Location",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="#4285f4" stroke="#ffffff" stroke-width="2"/>
            </svg>
          `),
          scaledSize: new (window as any).google.maps.Size(20, 20)
        }
      });
    }

    // Add search results as markers
    searchResults.forEach((result, index) => {
      const marker = new (window as any).google.maps.Marker({
        position: result.location,
        map: map,
        title: result.name,
        label: (index + 1).toString()
      });

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div>
            <h3>${result.name}</h3>
            <p>${result.address}</p>
            ${result.rating ? `<p>Rating: ${result.rating}⭐</p>` : ''}
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const location = await DebugService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        await performReverseGeocode(location.lat, location.lng);
      }
    } catch (error) {
      console.error("Failed to get current location:", error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const performReverseGeocode = async (lat: number, lng: number) => {
    try {
      const result = await DebugService.reverseGeocode(lat, lng);
      setGeocodingResult(result);
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  const searchRestaurants = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await DebugService.searchRestaurants(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Restaurant search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading maps status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Maps API Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Maps & Location Services
              </CardTitle>
              <CardDescription>
                Google Maps API and location services status
              </CardDescription>
            </div>
            <Button onClick={onRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.apis.googleMaps?.connected)}
                <div>
                  <h4 className="font-medium">Google Maps API</h4>
                  <p className="text-sm text-muted-foreground">
                    Core mapping service
                  </p>
                </div>
              </div>
              <Badge variant={systemHealth.apis.googleMaps?.connected ? "default" : "destructive"}>
                {systemHealth.apis.googleMaps?.connected ? "Active" : "Failed"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.apis.googlePlaces?.connected)}
                <div>
                  <h4 className="font-medium">Google Places API</h4>
                  <p className="text-sm text-muted-foreground">
                    Places and restaurant search
                  </p>
                </div>
              </div>
              <Badge variant={systemHealth.apis.googlePlaces?.connected ? "default" : "destructive"}>
                {systemHealth.apis.googlePlaces?.connected ? "Active" : "Failed"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(!!navigator.geolocation)}
                <div>
                  <h4 className="font-medium">Browser Geolocation</h4>
                  <p className="text-sm text-muted-foreground">
                    User location access
                  </p>
                </div>
              </div>
              <Badge variant={navigator.geolocation ? "default" : "destructive"}>
                {navigator.geolocation ? "Available" : "Not supported"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Interactive Map
          </CardTitle>
          <CardDescription>
            Live Google Maps integration with markers and search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.apis.googleMaps?.connected ? (
              <div
                ref={mapRef}
                className="w-full h-96 rounded-lg border bg-gray-100"
                style={{ minHeight: '400px' }}
              >
                {!(window as any).google && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading Google Maps...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-96 rounded-lg border bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Google Maps API not available</p>
                  <p className="text-sm text-muted-foreground">Check API key configuration</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={getCurrentLocation}
                disabled={loadingLocation || !navigator.geolocation}
                variant="outline"
              >
                <Navigation className={`h-4 w-4 mr-2 ${loadingLocation ? 'animate-spin' : ''}`} />
                Get Current Location
              </Button>
              
              {currentLocation && (
                <Badge variant="outline">
                  Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Restaurant Search
          </CardTitle>
          <CardDescription>
            Live restaurant and location search interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for restaurants, cafes, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
              />
              <Button onClick={searchRestaurants} disabled={loading || !searchQuery.trim()}>
                <Search className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Search
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((result, index) => (
                    <div key={result.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium">{result.name}</h5>
                          <p className="text-sm text-muted-foreground">{result.address}</p>
                          {result.rating && (
                            <p className="text-sm">Rating: {result.rating}⭐</p>
                          )}
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reverse Geocoding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📍 Reverse Geocoding
          </CardTitle>
          <CardDescription>
            Click on the map to get address information for any location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {geocodingResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Address Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Full Address:</strong> {geocodingResult.address}</div>
                  <div><strong>Coordinates:</strong> {geocodingResult.location.lat.toFixed(6)}, {geocodingResult.location.lng.toFixed(6)}</div>
                  {geocodingResult.components.street && (
                    <div><strong>Street:</strong> {geocodingResult.components.street}</div>
                  )}
                  {geocodingResult.components.city && (
                    <div><strong>City:</strong> {geocodingResult.components.city}</div>
                  )}
                  {geocodingResult.components.state && (
                    <div><strong>State:</strong> {geocodingResult.components.state}</div>
                  )}
                  {geocodingResult.components.country && (
                    <div><strong>Country:</strong> {geocodingResult.components.country}</div>
                  )}
                  {geocodingResult.components.postal_code && (
                    <div><strong>Postal Code:</strong> {geocodingResult.components.postal_code}</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Click anywhere on the map to get address information for that location.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}