'use client';

import { Minus, Navigation, Plus } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { reverseGeocodingService } from "@/lib/scout/reverseGeocodingService";

// Type declaration for MapLibre GL global variable
declare const maplibregl: any;

interface MapViewDynamicProps {
  currentLocation?: { lat: number; lng: number };
  searchRadius?: number;
  onLocationFound?: (location: any) => void;
  onMapError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  focusedRestaurant?: {
    name: string;
    coordinates: { lat: number; lng: number };
    address?: string;
    rating?: number;
    cuisine?: string;
    priceLevel?: string;
  } | null;
}

export function MapViewDynamic({
  currentLocation,
  searchRadius = 5000,
  onLocationFound,
  onMapError,
  className,
  style,
  focusedRestaurant,
}: MapViewDynamicProps) {
  const [zoomLevel, setZoomLevel] = useState(15);
  const [centerCoords, setCenterCoords] = useState({
    lat: currentLocation?.lat || 13.1262,
    lng: currentLocation?.lng || 80.2335,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState("Streets");
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapLibreRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<any>(null);
  const restaurantMarkerRef = useRef<any>(null);

  // Check backend availability and initialize MapLibre
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsInitializing(true);
        setMapError(null);
        await loadMapLibreAndInitialize();
      } catch (error) {
        console.error("❌ Map initialization failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to initialize map";
        setMapError(errorMessage);
        if (onMapError) {
          onMapError(error instanceof Error ? error : new Error(errorMessage));
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load MapLibre and initialize map
  const loadMapLibreAndInitialize = async () => {
    // Check if MapLibre is already loaded
    if (typeof maplibregl !== "undefined") {
      initializeMapLibre();
      return;
    }

    try {
      // Check if CSS is already loaded
      const existingCss = document.querySelector('link[href*="maplibre-gl.css"]');
      if (!existingCss) {
        // Load MapLibre GL CSS
        const cssLink = document.createElement("link");
        cssLink.rel = "stylesheet";
        cssLink.href = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css";
        cssLink.onerror = () => {
          console.warn("⚠️ Failed to load MapLibre CSS from CDN, using local fallback");
        };
        document.head.appendChild(cssLink);
      }

      // Check if script is already loaded
      const existingScript = document.querySelector('script[src*="maplibre-gl.js"]');
      if (!existingScript) {
        // Load MapLibre GL JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js";
        script.async = true;
        script.onload = () => {
          // Small delay to ensure CSS is applied
          setTimeout(() => {
            initializeMapLibre();
          }, 100);
        };
        script.onerror = () => {
          console.error("❌ Failed to load MapLibre GL JS from CDN");
          setMapError("Failed to load map library from primary CDN");
          // Try alternative CDN
          loadMapLibreFromAlternativeCDN();
        };
        document.head.appendChild(script);
      } else {
        // Script already exists, initialize directly
        initializeMapLibre();
      }
    } catch (error) {
      console.error("Error loading MapLibre:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMapLoaded(false);
      setMapError(`Failed to load map resources: ${errorMessage}`);
    }
  };

  // Fallback CDN loader
  const loadMapLibreFromAlternativeCDN = () => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/maplibre-gl@4/dist/maplibre-gl.js";
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        initializeMapLibre();
      }, 100);
    };
    script.onerror = () => {
      console.error("❌ Failed to load MapLibre GL JS from all CDNs");
      setMapLoaded(false);
      setMapError("Failed to load map library from all available sources. Please check your internet connection.");
    };
    document.head.appendChild(script);
  };

  // Get map style configuration - using reliable free styles
  const getMapStyle = () => {
    const styles = {
      Streets: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"],
            tileSize: 256,
            attribution: "© CARTO © OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "carto",
            type: "raster",
            source: "carto",
          },
        ],
      },
      OpenStreetMap: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
    };
    return styles[mapStyle as keyof typeof styles] || styles.Streets;
  };

  // Initialize MapLibre
  const initializeMapLibre = async () => {
    if (!mapRef.current || typeof maplibregl === "undefined") {
      console.log("⚠️ MapLibre initialization skipped - container or library not ready");
      return;
    }

    // Clean up any existing map instance
    if (mapLibreRef.current) {
      try {
        mapLibreRef.current.remove();
        mapLibreRef.current = null;
      } catch (error) {
        console.warn("Warning cleaning up previous map instance:", error);
      }
    }

    try {
      const mapStyleConfig = getMapStyle();
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyleConfig,
        center: [centerCoords.lng, centerCoords.lat], // MapLibre uses [lng, lat]
        zoom: zoomLevel,
        pitch: 0,
        bearing: 0,
        antialias: true,
        attributionControl: true,
      });

      // Set up event handlers
      map.on("load", () => {
        console.log("✅ MapLibre map loaded successfully");
        setMapLoaded(true);

        // Add user location marker
        setTimeout(() => {
          addUserLocationMarker();
        }, 100);

        // Add zoom event listener
        map.on("zoom", () => {
          const currentZoom = Math.round(map.getZoom());
          setZoomLevel(currentZoom);
        });
      });

      map.on("error", (e: any) => {
        const errorInfo = {
          type: e.type || "unknown",
          message: e.error?.message || "Unknown MapLibre error",
          sourceId: e.sourceId || "unknown",
          timestamp: new Date().toISOString(),
        };

        console.error("MapLibre error:", errorInfo);
        
        // Only set error state for significant errors
        if (!e.error?.message?.includes("Failed to fetch") || e.error?.message?.includes("403")) {
          setMapError(`Map error: ${errorInfo.message}`);
        }
      });

      mapLibreRef.current = map;
    } catch (error) {
      console.error("❌ Failed to initialize MapLibre:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMapLoaded(false);
      setMapError(`Map initialization failed: ${errorMessage}`);
    }
  };

  // Add user location marker
  const addUserLocationMarker = async () => {
    if (!mapLibreRef.current) return;

    // Create user location marker element
    const userLocationElement = document.createElement("div");
    userLocationElement.className = "user-location-marker";
    userLocationElement.innerHTML = `
      <div class="relative">
        <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
      </div>
    `;

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
    }

    userLocationMarkerRef.current = new maplibregl.Marker({
      element: userLocationElement,
      anchor: "center",
    })
      .setLngLat([centerCoords.lng, centerCoords.lat])
      .addTo(mapLibreRef.current);

    // Perform reverse geocoding
    try {
      console.log('🔍 Starting reverse geocoding for location...');
      const addressResult = await reverseGeocodingService.getAddressFromCoordinates(
        centerCoords.lat, 
        centerCoords.lng
      );
      
      const formattedAddress = reverseGeocodingService.formatAddressForDisplay(addressResult);
      
      // Trigger location found callback with address
      if (onLocationFound) {
        onLocationFound({
          latitude: centerCoords.lat,
          longitude: centerCoords.lng,
          accuracy: 50000, // Approximate accuracy for demo
          timestamp: new Date().toLocaleString(),
          address: formattedAddress,
          formatted_address: addressResult.formatted_address,
          geocoding_success: addressResult.success,
          address_components: reverseGeocodingService.extractAddressComponents(addressResult)
        });
      }
      
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error);
      
      // Trigger callback with fallback data
      if (onLocationFound) {
        onLocationFound({
          latitude: centerCoords.lat,
          longitude: centerCoords.lng,
          accuracy: 50000,
          timestamp: new Date().toLocaleString(),
          address: "Address lookup failed",
          geocoding_success: false
        });
      }
    }
  };

  // Add restaurant marker with info popup (similar to Google Maps)
  const addRestaurantMarker = useCallback(() => {
    if (!mapLibreRef.current || !focusedRestaurant || !currentLocation) return;

    // Remove existing restaurant marker
    if (restaurantMarkerRef.current) {
      restaurantMarkerRef.current.remove();
    }

    // Create restaurant marker element with info popup
    const restaurantElement = document.createElement("div");
    restaurantElement.className = "restaurant-marker";
    restaurantElement.innerHTML = `
      <div class="relative">
        <!-- Main marker pin -->
        <div class="flex flex-col items-center">
          <!-- Info card (like Google Maps) -->
          <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-3 mb-2 min-w-[200px] max-w-[280px]">
            <div class="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
              ${focusedRestaurant.name}
            </div>
            ${focusedRestaurant.rating ? `
              <div class="flex items-center gap-1 mb-1">
                <div class="flex text-yellow-400">
                  ${'★'.repeat(Math.floor(focusedRestaurant.rating))}${'☆'.repeat(5 - Math.floor(focusedRestaurant.rating))}
                </div>
                <span class="text-xs text-gray-600">${focusedRestaurant.rating}</span>
              </div>
            ` : ''}
            ${focusedRestaurant.cuisine ? `
              <div class="text-xs text-gray-600 mb-1">${focusedRestaurant.cuisine}</div>
            ` : ''}
            ${focusedRestaurant.priceLevel ? `
              <div class="text-xs text-gray-600 mb-1">${focusedRestaurant.priceLevel.includes('$') ? focusedRestaurant.priceLevel : '$'.repeat(parseInt(focusedRestaurant.priceLevel) || 1)}</div>
            ` : ''}
            ${focusedRestaurant.address ? `
              <div class="text-xs text-gray-500 line-clamp-2">${focusedRestaurant.address}</div>
            ` : ''}
            <div class="mt-2 pt-2 border-t border-gray-100">
              <div class="text-xs text-blue-600 font-medium">📍 From your Plate</div>
            </div>
          </div>
          <!-- Marker pin -->
          <div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg relative">
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
            <!-- Pin tail -->
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500"></div>
          </div>
        </div>
      </div>
    `;

    // Add styles for proper positioning
    restaurantElement.style.cssText = `
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: auto;
    `;

    restaurantMarkerRef.current = new maplibregl.Marker({
      element: restaurantElement,
      anchor: "bottom",
    })
      .setLngLat([focusedRestaurant.coordinates.lng, focusedRestaurant.coordinates.lat])
      .addTo(mapLibreRef.current);
  }, [focusedRestaurant, currentLocation]);

  // Update map center when currentLocation changes
  useEffect(() => {
    if (currentLocation) {
      setCenterCoords(currentLocation);
      if (mapLibreRef.current) {
        mapLibreRef.current.flyTo({
          center: [currentLocation.lng, currentLocation.lat],
          zoom: 15,
          duration: 1000,
        });
        
        // Update user location marker
        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setLngLat([currentLocation.lng, currentLocation.lat]);
        }
      }
    }
  }, [currentLocation]);

  // Add restaurant marker when focusedRestaurant changes
  useEffect(() => {
    if (focusedRestaurant && currentLocation && mapLibreRef.current) {
      // Small delay to ensure map is ready
      setTimeout(() => {
        addRestaurantMarker();
      }, 500);
    }
  }, [focusedRestaurant, currentLocation, addRestaurantMarker]);

  // Control handlers
  const handleZoomIn = () => {
    const newZoom = Math.min(18, zoomLevel + 1);
    setZoomLevel(newZoom);
    if (mapLibreRef.current) {
      mapLibreRef.current.setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(10, zoomLevel - 1);
    setZoomLevel(newZoom);
    if (mapLibreRef.current) {
      mapLibreRef.current.setZoom(newZoom);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenterCoords(userLocation);
        if (mapLibreRef.current) {
          mapLibreRef.current.flyTo({
            center: [userLocation.lng, userLocation.lat],
            zoom: 15,
            duration: 1500,
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Stay with current location or default
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (mapLibreRef.current) {
        mapLibreRef.current.remove();
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
      }
      if (restaurantMarkerRef.current) {
        restaurantMarkerRef.current.remove();
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ''}`} style={style}>
      {/* MapLibre Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Error State */}
      {mapError && !mapLoaded && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-lg font-bold text-red-700 mb-2">Map Loading Error</h3>
            <p className="text-red-600 text-sm mb-4">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null);
                setMapLoaded(false);
                loadMapLibreAndInitialize();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry Loading Map
            </button>
          </div>
        </div>
      )}

      {/* Map Loading State */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#F14C35] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-[#0B1F3A] font-medium">
              {isInitializing ? "Initializing Map..." : "Loading Map..."}
            </p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-5 h-5 text-[#0B1F3A]" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Minus className="w-5 h-5 text-[#0B1F3A]" />
        </button>
      </div>

      {/* My Location Button */}
      <div className="absolute bottom-4 right-4 z-30">
        <button
          onClick={handleMyLocation}
          className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Navigation className="w-5 h-5 text-[#F14C35]" />
        </button>
      </div>

      {/* Debug Info */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-2 text-xs text-gray-800">
          <div className="font-medium">Zoom: {zoomLevel}</div>
          <div>Center: {centerCoords.lat.toFixed(4)}, {centerCoords.lng.toFixed(4)}</div>
          <div>Style: {mapStyle}</div>
        </div>
      )}
    </div>
  );
}