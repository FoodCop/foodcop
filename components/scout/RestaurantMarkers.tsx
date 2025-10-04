'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { 
  RESTAURANT_CATEGORIES, 
  getCategoryFromPlaceTypes,
  createRestaurantMarkerElement,
  PRICE_LEVELS,
  getRatingStars,
  formatDistance
} from '@/lib/restaurant-markers';

export interface Restaurant {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
  };
  user_ratings_total?: number;
}

interface RestaurantMarkersProps {
  restaurants: Restaurant[];
  userLocation?: { lat: number; lng: number };
  onMarkerClick?: (restaurant: Restaurant) => void;
  onSaveToPlate?: (restaurant: Restaurant) => void;
  selectedRestaurant?: Restaurant | null;
  showClusters?: boolean;
}

export default function RestaurantMarkers({
  restaurants,
  userLocation,
  onMarkerClick,
  onSaveToPlate,
  selectedRestaurant,
  showClusters = true
}: RestaurantMarkersProps) {
  const [popupInfo, setPopupInfo] = useState<Restaurant | null>(null);
  const markersRef = useRef<Map<string, HTMLElement>>(new Map());

  // Clean up marker elements when component unmounts
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach(marker => {
        marker.remove();
      });
      markers.clear();
    };
  }, []);

  const handleMarkerClick = (restaurant: Restaurant) => {
    setPopupInfo(restaurant);
    onMarkerClick?.(restaurant);
  };

  const handleSaveToPlate = (restaurant: Restaurant) => {
    onSaveToPlate?.(restaurant);
    setPopupInfo(null);
  };

  const getDistanceFromUser = (restaurant: Restaurant): string | null => {
    if (!userLocation) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (restaurant.geometry.location.lat - userLocation.lat) * Math.PI / 180;
    const dLng = (restaurant.geometry.location.lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(restaurant.geometry.location.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return formatDistance(distance);
  };

  return (
    <>
      {restaurants.map((restaurant) => {
        const category = getCategoryFromPlaceTypes(restaurant.types);
        const categoryData = RESTAURANT_CATEGORIES[category];
        const isSelected = selectedRestaurant?.place_id === restaurant.place_id;
        
        // Create or update marker element
        let markerElement = markersRef.current.get(restaurant.place_id);
        if (!markerElement) {
          markerElement = createRestaurantMarkerElement(category, isSelected);
          markersRef.current.set(restaurant.place_id, markerElement);
        }
        
        // Update selection state
        if (isSelected) {
          markerElement.classList.add('selected');
        } else {
          markerElement.classList.remove('selected');
        }

        return (
          <Marker
            key={restaurant.place_id}
            longitude={restaurant.geometry.location.lng}
            latitude={restaurant.geometry.location.lat}
            anchor="bottom"
            onClick={() => handleMarkerClick(restaurant)}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="restaurant-marker"
              style={{ '--marker-color': categoryData.color } as React.CSSProperties}
            >
              <div className="marker-icon">
                <span className="marker-emoji">{categoryData.icon}</span>
              </div>
              <div className="marker-shadow"></div>
            </div>
          </Marker>
        );
      })}

      {popupInfo && (
        <Popup
          longitude={popupInfo.geometry.location.lng}
          latitude={popupInfo.geometry.location.lat}
          anchor="bottom"
          onClose={() => setPopupInfo(null)}
          closeButton={true}
          closeOnClick={false}
          className="restaurant-popup"
          maxWidth="280px"
        >
          <div 
            className="popup-header"
            style={{ 
              '--marker-color': RESTAURANT_CATEGORIES[
                getCategoryFromPlaceTypes(popupInfo.types)
              ].color 
            } as React.CSSProperties}
          >
            <span className="marker-emoji">
              {RESTAURANT_CATEGORIES[getCategoryFromPlaceTypes(popupInfo.types)].icon}
            </span>
          </div>
          
          <div className="popup-content">
            <h3 className="popup-title">{popupInfo.name}</h3>
            
            {popupInfo.rating && (
              <div className="popup-rating">
                <span className="popup-stars">
                  {getRatingStars(popupInfo.rating)}
                </span>
                <span className="popup-rating-text">
                  {popupInfo.rating.toFixed(1)}
                  {popupInfo.user_ratings_total && ` (${popupInfo.user_ratings_total})`}
                </span>
              </div>
            )}
            
            <div className="popup-details">
              {popupInfo.price_level !== undefined && (
                <div className="popup-price">
                  {PRICE_LEVELS[popupInfo.price_level as keyof typeof PRICE_LEVELS]?.symbol || 'N/A'}
                </div>
              )}
              
              {userLocation && (
                <div className="popup-distance">
                  {getDistanceFromUser(popupInfo)} away
                </div>
              )}
              
              <div className="popup-address">
                {popupInfo.vicinity}
              </div>
              
              {popupInfo.opening_hours && (
                <div className={`popup-status ${popupInfo.opening_hours.open_now ? 'open' : 'closed'}`}>
                  {popupInfo.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}
                </div>
              )}
            </div>
            
            <div className="popup-actions">
              <button
                className="popup-btn primary"
                onClick={() => handleSaveToPlate(popupInfo)}
                style={{ 
                  '--marker-color': RESTAURANT_CATEGORIES[
                    getCategoryFromPlaceTypes(popupInfo.types)
                  ].color 
                } as React.CSSProperties}
              >
                Save to Plate
              </button>
              <button 
                className="popup-btn"
                onClick={() => {
                  const url = `https://www.google.com/maps/place/?q=place_id:${popupInfo.place_id}`;
                  window.open(url, '_blank');
                }}
              >
                View in Maps
              </button>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}