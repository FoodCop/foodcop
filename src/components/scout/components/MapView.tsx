import { ArrowLeft, MoreVertical, Clock, Car, PersonStanding, Bike, Phone, Play, Plus, Minus, Crosshair, Route, Circle, MapPin } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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
  restaurant: Restaurant | null;
  open: boolean;
  onClose: () => void;
}

export function MapView({ restaurant, open, onClose }: MapViewProps) {
  const [activeMode, setActiveMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'half' | 'full'>('half');
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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
    driving: '12 min',
    walking: '25 min',
    cycling: '15 min',
  };

  const distanceText = restaurant.distance 
    ? `${restaurant.distance.toFixed(1)} km`
    : '0.8 km';

  const handleStartNavigation = () => {
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
          
          <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
            <MoreVertical className="text-gray-900" />
          </button>
        </div>
      </div>

      {/* Map Canvas - Placeholder with SVG route */}
      <div className="w-full h-full relative bg-gray-100">
        <svg className="w-full h-full" viewBox="0 0 400 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="street-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          <rect width="400" height="900" fill="#f9fafb"/>
          <rect width="400" height="900" fill="url(#street-grid)"/>
          
          {/* Roads */}
          <g id="roads">
            <path d="M 0 720 L 400 720" stroke="#d1d5db" strokeWidth="20" opacity="0.5"/>
            <path d="M 0 720 L 400 720" stroke="#ffffff" strokeWidth="16"/>
            <path d="M 0 720 L 400 720" stroke="#fbbf24" strokeWidth="2" strokeDasharray="10 10"/>
            
            <path d="M 60 900 L 60 0" stroke="#d1d5db" strokeWidth="18" opacity="0.5"/>
            <path d="M 60 900 L 60 0" stroke="#ffffff" strokeWidth="14"/>
            
            <path d="M 160 900 L 160 500 Q 160 450 200 420 L 280 370" stroke="#d1d5db" strokeWidth="18" opacity="0.5"/>
            <path d="M 160 900 L 160 500 Q 160 450 200 420 L 280 370" stroke="#ffffff" strokeWidth="14"/>
            
            <path d="M 280 370 L 340 320" stroke="#d1d5db" strokeWidth="18" opacity="0.5"/>
            <path d="M 280 370 L 340 320" stroke="#ffffff" strokeWidth="14"/>
          </g>
          
          {/* Buildings */}
          <g id="buildings">
            <rect x="80" y="650" width="70" height="100" fill="#cbd5e1" rx="3"/>
            <rect x="85" y="660" width="12" height="12" fill="#94a3b8" rx="1"/>
            <rect x="100" y="660" width="12" height="12" fill="#94a3b8" rx="1"/>
            
            <rect x="180" y="630" width="85" height="120" fill="#cbd5e1" rx="3"/>
            <rect x="185" y="640" width="14" height="14" fill="#94a3b8" rx="1"/>
            
            <rect x="290" y="600" width="90" height="140" fill="#cbd5e1" rx="3"/>
            <rect x="295" y="610" width="16" height="16" fill="#94a3b8" rx="1"/>
            
            <rect x="90" y="450" width="60" height="80" fill="#cbd5e1" rx="3"/>
            <rect x="180" y="420" width="70" height="110" fill="#cbd5e1" rx="3"/>
            <rect x="270" y="250" width="80" height="150" fill="#cbd5e1" rx="3"/>
          </g>
          
          {/* Route */}
          <g id="route">
            <path d="M 60 720 L 160 720 L 160 500 Q 160 450 200 420 L 280 370 L 340 320" 
                  fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" opacity="0.2"/>
            
            <path d="M 60 720 L 160 720 L 160 500 Q 160 450 200 420 L 280 370 L 340 320" 
                  fill="none" stroke="url(#route-gradient)" strokeWidth="6" strokeLinecap="round">
              <animate attributeName="stroke-dasharray" values="0 1000; 1000 0" dur="2.5s" fill="freeze"/>
            </path>
            
            <circle cx="60" cy="720" r="0" fill="#3b82f6" opacity="0.3">
              <animate attributeName="r" values="0; 25; 0" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </g>
          
          {/* Location Markers */}
          <g id="markers">
            {/* User location */}
            <circle cx="60" cy="720" r="16" fill="#10b981"/>
            <circle cx="60" cy="720" r="12" fill="white"/>
            <circle cx="60" cy="720" r="6" fill="#10b981">
              <animate attributeName="r" values="6; 8; 6" dur="2s" repeatCount="indefinite"/>
            </circle>
            
            {/* Destination */}
            <circle cx="340" cy="320" r="24" fill="#ef4444" opacity="0.15">
              <animate attributeName="r" values="24; 32; 24" dur="2s" repeatCount="indefinite"/>
            </circle>
            <path d="M 340 300 C 335 300 330 305 330 310 C 330 318 340 330 340 330 C 340 330 350 318 350 310 C 350 305 345 300 340 300 Z" 
                  fill="#ef4444" stroke="white" strokeWidth="2.5"/>
            <circle cx="340" cy="310" r="5" fill="white"/>
          </g>
          
          {/* Waypoints */}
          <circle cx="160" cy="720" r="5" fill="#3b82f6" opacity="0.6"/>
          <circle cx="160" cy="500" r="5" fill="#3b82f6" opacity="0.6"/>
          <circle cx="280" cy="370" r="5" fill="#3b82f6" opacity="0.6"/>
        </svg>
      </div>

      {/* Map Controls */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
          <Plus className="text-gray-900" />
        </button>
        <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
          <Minus className="text-gray-900" />
        </button>
        <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors mt-2">
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
          height: sheetHeight === 'collapsed' ? '120px' :
                  sheetHeight === 'half' ? '65%' :
                  'calc(100% - 5rem)'
        }}
      >
        {/* Draggable Handle */}
        <div 
          className="w-14 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-4 cursor-grab active:cursor-grabbing"
          role="button"
          tabIndex={0}
          onClick={handleHandleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleHandleClick();
            }
          }}
          aria-label="Drag to resize directions panel"
        ></div>
        
        {/* Content - Scrollable */}
        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: sheetHeight === 'collapsed' ? '80px' : 'calc(100% - 40px)' }}>
          {/* Restaurant Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{restaurant.name}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Route className="text-orange-500 w-3 h-3" />
                Via Main Street & 5th Avenue
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{distanceText}</p>
              <p className="text-xs text-gray-500">distance</p>
            </div>
          </div>

          {/* Active Travel Mode */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4">
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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activeMode === 'walking' ? 'bg-green-100' : 'bg-green-100'
              }`}>
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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activeMode === 'cycling' ? 'bg-orange-100' : 'bg-orange-100'
              }`}>
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
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-shadow"
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
        </div>
      </div>
    </div>
  );
}
