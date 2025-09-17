// import { motion } from 'framer-motion'; // Uncomment if you use motion animations in this file
import { Minus, Navigation, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { API_CONFIG } from "../config/apiConfig";
import type { Restaurant } from "../ScoutPage";
import { backendService } from "../services/backendService";
import {
  LocationData,
  mapLibreLocationService,
} from "../services/mapLibreLocationService";
// MapLibre custom styles are imported in globals.css

// MapLibre GL JS types

interface MapViewProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  currentLocation?: { lat: number; lng: number }; // Add current location prop
}

export function MapView({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  currentLocation,
}: MapViewProps) {
  const [zoomLevel, setZoomLevel] = useState(14);
  const [centerCoords, setCenterCoords] = useState({
    lat: currentLocation?.lat || 37.7749,
    lng: currentLocation?.lng || -122.4194,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState("Streets");
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<LocationData[]>([]);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const nearbyMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Check backend availability and initialize MapLibre
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsInitializing(true);
        setMapError(null);

        await checkBackendAvailability();
        await loadMapLibreAndInitialize();
      } catch (error) {
        console.error("❌ Map initialization failed:", error);
        setMapError(
          error instanceof Error ? error.message : "Failed to initialize map"
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initializeMap();
  }, []);

  const checkBackendAvailability = async () => {
    try {
      const status = await backendService.checkServiceAvailability();
      setBackendAvailable(status.backend && status.googleMaps);
    } catch (error) {
      console.log("Backend not available, using mock data");
      setBackendAvailable(false);
    }
  };

  // Load MapLibre and initialize map
  const loadMapLibreAndInitialize = async () => {
    // Check if MapLibre is already loaded
    if (typeof maplibregl !== "undefined") {
      initializeMapLibre();
      return;
    }

    try {
      // Check if CSS is already loaded
      const existingCss = document.querySelector(
        'link[href*="maplibre-gl.css"]'
      );
      if (!existingCss) {
        // Load MapLibre GL CSS
        const cssLink = document.createElement("link");
        cssLink.rel = "stylesheet";
        cssLink.href = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css";
        cssLink.onerror = () => {
          console.warn(
            "⚠️ Failed to load MapLibre CSS from CDN, using local fallback"
          );
          // CSS is already imported in globals.css as fallback
        };
        document.head.appendChild(cssLink);
      }

      // Check if script is already loaded
      const existingScript = document.querySelector(
        'script[src*="maplibre-gl.js"]'
      );
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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMapLoaded(false);
      setMapError(`Failed to load map resources: ${errorMessage}`);
    }
  };

  // Fallback CDN loader
  const loadMapLibreFromAlternativeCDN = () => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/maplibre-gl@4/dist/maplibre-gl.js";
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        initializeMapLibre();
      }, 100);
    };
    script.onerror = () => {
      console.error("❌ Failed to load MapLibre GL JS from all CDNs");
      setMapLoaded(false);
      setMapError(
        "Failed to load map library from all available sources. Please check your internet connection."
      );
    };
    document.head.appendChild(script);
  };

  // Get map style configuration - using free styles that don't require API keys
  const getMapStyle = () => {
    const styles = {
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
      Streets: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
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
      Satellite: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution:
              "© Esri © DigitalGlobe © GeoEye © Earthstar Geographics © CNES/Airbus DS © USDA © USGS © AeroGRID © IGN © and the GIS User Community",
          },
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
          },
        ],
      },
      Terrain: {
        version: 8,
        sources: {
          terrain: {
            type: "raster",
            tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              "© OpenTopoMap (CC-BY-SA) © OpenStreetMap contributors",
            maxzoom: 15,
          },
        },
        layers: [
          {
            id: "terrain",
            type: "raster",
            source: "terrain",
          },
        ],
      },
    };
    return styles[mapStyle as keyof typeof styles] || styles.Streets;
  };

  // Initialize MapLibre
  const initializeMapLibre = async () => {
    if (!mapRef.current || typeof maplibregl === "undefined") {
      console.log(
        "⚠️ MapLibre initialization skipped - container or library not ready"
      );
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
      const mapStyle = getMapStyle();
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: [centerCoords.lng, centerCoords.lat], // MapLibre uses [lng, lat]
        zoom: zoomLevel,
        pitch: 0,
        bearing: 0,
        antialias: true,
        attributionControl: true,
        transformRequest: (url: string) => {
          // Add CORS headers for tile requests if needed
          return {
            url: url,
            headers: {
              Accept: "image/png,image/jpeg,image/webp,*/*",
            },
          };
        },
      });

      // Set up event handlers
      map.on("load", () => {
        setMapLoaded(true);

        // Add user location marker
        setTimeout(() => {
          addUserLocationMarker();
        }, 100);

        // Load nearby places
        setTimeout(() => {
          loadNearbyPlaces();
        }, 200);

        // Add zoom event listener
        map.on("zoom", () => {
          // MapLibre GL JS uses getZoom()
          if (typeof (map as any).getZoom === "function") {
            const currentZoom = Math.round((map as any).getZoom());
            setZoomLevel(currentZoom);
          }
        });
      });

      map.on("error", (e: any) => {
        // Safely log the error without circular references
        const errorInfo = {
          type: e.type || "unknown",
          message: e.error?.message || "Unknown MapLibre error",
          sourceId: e.sourceId || "unknown",
          timestamp: new Date().toISOString(),
          url: e.error?.url || "unknown",
        };

        // Only log significant errors to avoid spam
        const isTileError =
          e.error?.message?.includes("Failed to fetch") && e.sourceId;
        const isPermissionError =
          e.error?.message?.includes("403") ||
          e.error?.message?.includes("Forbidden");

        if (isPermissionError || !isTileError) {
          console.error("MapLibre error:", errorInfo);
        }

        // Handle specific error types
        if (isPermissionError || (isTileError && e.sourceId === "terrain")) {
          if (mapStyle !== "Streets") {
            setMapStyle("Streets");
          }
        }
      });

      mapLibreRef.current = map;

      // Initialize popup
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: "fuzo-map-popup",
        maxWidth: "320px",
      });
    } catch (error) {
      console.error("❌ Failed to initialize MapLibre:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: errorMessage,
        stack:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 3).join("\n")
            : "No stack trace",
      });

      setMapLoaded(false);
      setMapError(`Map initialization failed: ${errorMessage}`);

      // Retry with a simpler configuration after a delay
      setTimeout(() => {
        if (mapStyle !== "Streets") {
          setMapError(null);
          retryMapInitialization();
        }
      }, 3000);
    }
  };

  // Retry map initialization with fallback settings
  const retryMapInitialization = () => {
    if (mapStyle !== "Streets") {
      setMapStyle("Streets");
      // The useEffect will trigger re-initialization
    }
  };

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
      }
    }
  }, [currentLocation]);

  // Update markers when restaurants change
  useEffect(() => {
    if (!mapLibreRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current.clear();

    // Add new markers using MapLibre
    restaurants.forEach((restaurant) => {
      try {
        // Create custom marker element
        const markerElement = document.createElement("div");
        markerElement.className = "fuzo-map-marker";
        markerElement.innerHTML = `
          <div class="relative w-8 h-8 rounded-full border-3 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110"
               style="background-color: ${
                 restaurant.isSaved ? "#F14C35" : "#A6471E"
               }">
            <svg class="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `;

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: "bottom",
        })
          .setLngLat([restaurant.coordinates.lng, restaurant.coordinates.lat])
          .addTo(mapLibreRef.current);

        // Add click listener
        markerElement.addEventListener("click", (e) => {
          e.stopPropagation();
          onRestaurantSelect(restaurant);
          showPopup(restaurant);
        });

        markersRef.current.set(restaurant.id, marker);
      } catch (error) {
        console.error(
          "Error creating marker for restaurant:",
          restaurant.name,
          error
        );
      }
    });
  }, [restaurants, mapLoaded, onRestaurantSelect]);

  // Helper function to show popup
  const showPopup = (restaurant: any) => {
    if (!popupRef.current || !mapLibreRef.current) return;

    const popupContent = `
      <div class="p-3 max-w-xs bg-white rounded-lg shadow-lg">
        <img src="${restaurant.image}" alt="${
      restaurant.name
    }" class="w-full h-24 object-cover rounded-lg mb-2" loading="lazy">
        <h3 class="font-bold text-[#0B1F3A] text-sm mb-1">${
          restaurant.name
        }</h3>
        <div class="flex items-center space-x-2 text-xs text-gray-600 mb-2">
          <span>⭐ ${restaurant.rating}</span>
          <span>•</span>
          <span>${restaurant.distance} away</span>
        </div>
        <div class="flex flex-wrap gap-1">
          ${restaurant.cuisine
            .map(
              (c: string) =>
                `<span class="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] text-xs rounded-full">${c}</span>`
            )
            .join("")}
        </div>
      </div>
    `;

    popupRef.current
      .setLngLat([restaurant.coordinates.lng, restaurant.coordinates.lat])
      .setHTML(popupContent)
      .addTo(mapLibreRef.current!);
  };

  // Center map on selected restaurant
  useEffect(() => {
    if (selectedRestaurant && mapLibreRef.current) {
      mapLibreRef.current.flyTo({
        center: [
          selectedRestaurant.coordinates.lng,
          selectedRestaurant.coordinates.lat,
        ],
        zoom: 16,
        duration: 1000,
      });

      // Highlight selected marker
      const selectedMarker = markersRef.current.get(selectedRestaurant.id);
      if (selectedMarker) {
        try {
          const element = selectedMarker.getElement();
          const markerDiv = element.querySelector("div");
          if (markerDiv) {
            markerDiv.style.backgroundColor = "#FFD74A";
            markerDiv.style.transform = "scale(1.2)";
          }
        } catch (error) {
          console.error("Error highlighting selected marker:", error);
        }
      }

      // Show popup for selected restaurant
      showPopup(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  // Update zoom and center when changed via controls
  useEffect(() => {
    if (mapLibreRef.current) {
      mapLibreRef.current.setZoom(zoomLevel);
    }
  }, [zoomLevel]);

  useEffect(() => {
    if (mapLibreRef.current) {
      mapLibreRef.current.setCenter([centerCoords.lng, centerCoords.lat]);
      // Update user location marker
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLngLat([
          centerCoords.lng,
          centerCoords.lat,
        ]);
      }
      // Reload nearby places for new location
      if (mapLoaded) {
        loadNearbyPlaces();
      }
    }
  }, [centerCoords, mapLoaded]);

  const handleZoomIn = () => {
    const newZoom = Math.min(18, zoomLevel + 1);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(10, zoomLevel - 1);
    setZoomLevel(newZoom);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      setCenterCoords(API_CONFIG.DEFAULT_LOCATION);
      if (mapLibreRef.current) {
        mapLibreRef.current.flyTo({
          center: [
            API_CONFIG.DEFAULT_LOCATION.lng,
            API_CONFIG.DEFAULT_LOCATION.lat,
          ],
          zoom: 14,
        });
      }
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
        let errorMessage = "Failed to get location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = `Map location error: ${
              error.message || "Unknown error"
            }`;
        }

        // Fallback to default location
        setCenterCoords(API_CONFIG.DEFAULT_LOCATION);
        if (mapLibreRef.current) {
          mapLibreRef.current.flyTo({
            center: [
              API_CONFIG.DEFAULT_LOCATION.lng,
              API_CONFIG.DEFAULT_LOCATION.lat,
            ],
            zoom: 14,
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Mock map bounds for positioning pins (fallback)
  const mapBounds = {
    north: centerCoords.lat + 0.01,
    south: centerCoords.lat - 0.01,
    east: centerCoords.lng + 0.01,
    west: centerCoords.lng - 0.01,
  };

  const getRelativePosition = (restaurant: Restaurant) => {
    const latRange = mapBounds.north - mapBounds.south;
    const lngRange = mapBounds.east - mapBounds.west;

    const x = ((restaurant.coordinates.lng - mapBounds.west) / lngRange) * 100;
    const y = ((mapBounds.north - restaurant.coordinates.lat) / latRange) * 100;

    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(5, Math.min(95, y))}%`,
    };
  };

  // Add user location marker
  const addUserLocationMarker = () => {
    if (!mapLibreRef.current) return;

    // Create user location marker element
    const userLocationElement = document.createElement("div");
    userLocationElement.className = "user-location-marker";
    userLocationElement.innerHTML = `
      <div class="relative">
        <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
      </div>
    `;

    userLocationMarkerRef.current = new maplibregl.Marker({
      element: userLocationElement,
      anchor: "center",
    })
      .setLngLat([centerCoords.lng, centerCoords.lat])
      .addTo(mapLibreRef.current);
  };

  // Load nearby places from Google Places via backend
  const loadNearbyPlaces = async () => {
    try {
      const places = await mapLibreLocationService.searchNearbyPlaces(
        centerCoords,
        5000, // 5km radius
        "restaurant"
      );

      setNearbyPlaces(places);
    } catch (error) {
      console.warn("Error loading nearby places:", error);
    }
  };

  // Update map style when changed
  useEffect(() => {
    // MapLibre GL JS does support setStyle, but only if the map instance is correct
    if (mapLibreRef.current && mapLoaded) {
      try {
        const newStyle = getMapStyle();
        if (typeof (mapLibreRef.current as any).setStyle === "function") {
          (mapLibreRef.current as any).setStyle(newStyle);
        }
      } catch (error) {
        console.error("Error changing map style:", error);
        // Fallback to Streets if style change fails
        if (mapStyle !== "Streets") {
          setMapStyle("Streets");
        }
      }
    }
  }, [mapStyle]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (mapLibreRef.current) {
        mapLibreRef.current.remove();
      }
      markersRef.current.forEach((marker) => marker.remove());
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* MapLibre Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Error State */}
      {mapError && !mapLoaded && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h3 className="text-lg font-bold text-red-700 mb-2">
              Map Loading Error
            </h3>
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
    </div>
  );
}
