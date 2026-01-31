import { ArrowLeft, MoreVertical, Clock, Car, PersonStanding, Bike, Phone, Play, Plus, Minus, Crosshair, Route as RouteIcon, Circle, MapPin } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { GoogleMapView } from '../../maps/GoogleMapView';
import { getDirections, type Route, type TravelMode } from '../../../services/googleDirections';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  phone?: string;
}

interface MapViewProps {
  readonly restaurant: Restaurant | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function MapView({ restaurant, open, onClose }: Readonly<MapViewProps>) {
  const [activeMode, setActiveMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'half' | 'full'>('half');
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeData, setRouteData] = useState<Route | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Get user location
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to San Francisco if location unavailable
          setUserLocation({ lat: 37.7849, lng: -122.4094 });
        }
      );
    }
  }, [open]);

  // Fetch route when restaurant or mode changes
  useEffect(() => {
    if (!restaurant || !userLocation || !open) return;

    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        const travelModeMap: Record<string, TravelMode> = {
          driving: 'DRIVING',
          walking: 'WALKING',
          cycling: 'BICYCLING',
        };

        const response = await getDirections(
          userLocation,
          { lat: restaurant.lat, lng: restaurant.lng },
          travelModeMap[activeMode],
          false
        );

        if (response.routes && response.routes.length > 0) {
          setRouteData(response.routes[0]);
        } else {
          setRouteData(null);
        }
      } catch (error) {
        console.error('Failed to fetch route:', error);
        setRouteData(null);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [restaurant, userLocation, activeMode, open]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const diff = e.clientY - startY;
    
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  }, [startY]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    setIsDragging(false);
    
    const diff = e.clientY - startY;
    
    if (diff > 100) {
      // Dragged down
      if (sheetHeight === 'full') {
        setSheetHeight('half');
      } else if (sheetHeight === 'half') {
        setSheetHeight('collapsed');
      }
    } else if (diff < -100) {
      // Dragged up
      if (sheetHeight === 'collapsed') {
        setSheetHeight('half');
      } else if (sheetHeight === 'half') {
        setSheetHeight('full');
      }
    }
  }, [startY, sheetHeight]);

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      globalThis.addEventListener('mouseup', handleMouseUp);
      return () => {
        globalThis.removeEventListener('mousemove', handleMouseMove);
        globalThis.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!restaurant || !open) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    // Prevent default to stop page scroll while dragging
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY;
    
    // Determine new height based on drag distance
    if (diff > 100) {
      // Dragged down
      if (sheetHeight === 'full') {
        setSheetHeight('half');
      } else if (sheetHeight === 'half') {
        setSheetHeight('collapsed');
      }
    } else if (diff < -100) {
      // Dragged up
      if (sheetHeight === 'collapsed') {
        setSheetHeight('half');
      } else if (sheetHeight === 'half') {
        setSheetHeight('full');
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartY(e.clientY);
    setIsDragging(true);
  };

  const handleHandleClick = () => {
    // Toggle between collapsed, half, and full on tap
    if (sheetHeight === 'collapsed') {
      setSheetHeight('half');
    } else if (sheetHeight === 'half') {
      setSheetHeight('full');
    } else {
      setSheetHeight('half');
    }
  };

  const travelTimes = {
    driving: routeData?.legs?.[0]?.duration?.text || '12 min',
    walking: '25 min',
    cycling: '15 min',
  };

  const formatDistance = (distanceKm: number | undefined): string => {
    if (!distanceKm) return '0m';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(1)}km`;
  };

  const distanceText = routeData?.legs?.[0]?.distance?.text || formatDistance(restaurant.distance);

  const handleStartNavigation = () => {
    // Navigation already shown in-app with route display
    // User can see turn-by-turn directions in the bottom sheet
    // Optionally, you could add a step-by-step navigation view here
    console.log('Navigation started for:', restaurant.name);
  };

  const handleSendToGoogleMaps = () => {
    // Open in Google Maps with directions
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}&travelmode=${activeMode === 'cycling' ? 'bicycling' : activeMode}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="text-gray-900" />
          </button>
          
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2">
            <Clock className="text-orange-500 w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500">ETA</p>
              <p className="text-sm font-bold text-gray-900">{travelTimes[activeMode]}</p>
            </div>
          </div>
          
          <button className="w-11 h-11 bg-[var(--button-bg-active)] rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--button-bg-hover)] transition-colors">
            <MoreVertical className="text-gray-900" />
          </button>
        </div>
      </div>

      {/* Map Canvas - Google Maps with Route */}
      <div className="w-full h-full relative bg-gray-100">
        {userLocation && restaurant ? (
          <GoogleMapView
            center={userLocation}
            zoom={14}
            userLocation={userLocation}
            markers={[
              {
                id: restaurant.id,
                position: { lat: restaurant.lat, lng: restaurant.lng },
                title: restaurant.name,
                data: restaurant,
              },
            ]}
            route={routeData?.overviewPolyline}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <button className="w-11 h-11 bg-[var(--button-bg-active)] rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--button-bg-hover)] transition-colors">
          <Plus className="text-gray-900" />
        </button>
        <button className="w-11 h-11 bg-[var(--button-bg-active)] rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--button-bg-hover)] transition-colors">
          <Minus className="text-gray-900" />
        </button>
        <button className="w-11 h-11 bg-[var(--button-bg-active)] rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--button-bg-hover)] transition-colors mt-2">
          <Crosshair className="text-orange-500" />
        </button>
      </div>

      {/* Bottom Sheet */}
      <div 
        className={`absolute left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20 transition-all duration-300 ${
          sheetHeight === 'full' ? 'top-20' : ''
        }`}
        style={{
          bottom: 0,
          height: (() => {
            if (sheetHeight === 'collapsed') return '120px';
            if (sheetHeight === 'half') return '65%';
            return 'calc(100% - 5rem)';
          })()
        }}
      >
        {/* Draggable Handle */}
        <button
          type="button"
          className="w-14 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4 cursor-grab active:cursor-grabbing border-0"
          onClick={handleHandleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          aria-label="Drag to resize directions panel"
        ></button>
        
        {/* Content - Scrollable */}
        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: sheetHeight === 'collapsed' ? '80px' : 'calc(100% - 40px)' }}>
          {/* Restaurant Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{restaurant.name}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <RouteIcon className="text-orange-500 w-3 h-3" />
                Via Main Street & 5th Avenue
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{distanceText}</p>
              <p className="text-xs text-gray-500">distance</p>
            </div>
          </div>

          {/* Active Travel Mode */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  {activeMode === 'driving' && <Car className="text-white w-5 h-5" />}
                  {activeMode === 'walking' && <PersonStanding className="text-white w-5 h-5" />}
                  {activeMode === 'cycling' && <Bike className="text-white w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{activeMode}</p>
                  <p className="text-xs text-gray-600">Fastest route</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{travelTimes[activeMode]}</p>
                <p className="text-xs text-gray-500">{distanceText}</p>
              </div>
            </div>
          </div>

          {/* Travel Mode Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setActiveMode('walking')}
              className={`rounded-xl p-3 flex items-center gap-3 transition-colors ${
                activeMode === 'walking' ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                <PersonStanding className="text-green-600 w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">25 min</p>
                <p className="text-xs text-gray-500">Walking</p>
              </div>
            </button>
            
            <button
              onClick={() => setActiveMode('cycling')}
              className={`rounded-xl p-3 flex items-center gap-3 transition-colors ${
                activeMode === 'cycling' ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100">
                <Bike className="text-orange-600 w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">15 min</p>
                <p className="text-xs text-gray-500">Cycling</p>
              </div>
            </button>
          </div>

          {/* Step-by-step Directions */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Circle className="text-green-500 w-3 h-3 fill-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Your Location</p>
                <p className="text-xs text-gray-500">Downtown, Los Angeles</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 7v10c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7l-8-5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Turn right on Main Street</p>
                <p className="text-xs text-gray-500">In 200 meters</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="text-red-500 w-3 h-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{restaurant.name}</p>
                <p className="text-xs text-gray-500">{restaurant.address.split(',')[0]}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleStartNavigation}
              className="flex-1 bg-linear-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-shadow"
            >
              <Play className="w-5 h-5" />
              Start Navigation
            </button>
            
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Phone className="text-gray-700 w-5 h-5" />
              </a>
            )}
          </div>

          {/* Send to Google Maps Button */}
          <button
            onClick={handleSendToGoogleMaps}
            className="w-full bg-[var(--button-bg-default)] text-[var(--button-text)] font-semibold py-4 rounded-full hover:bg-[var(--button-bg-hover)] active:bg-[var(--button-bg-active)] transition-colors flex items-center justify-center gap-2 mt-3"
          >
            <MapPin className="w-5 h-5" />
            Send to Google Maps
          </button>
        </div>
      </div>
    </div>
  );
}
