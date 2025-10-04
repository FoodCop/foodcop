'use client';

import { useEffect, useState, useCallback } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { 
  RouteOptions, 
  DirectionsResult, 
  Route,
  getDirections,
  routeToGeoJSON,
  getRouteBounds,
  formatDuration,
  formatRouteDistance,
  cleanInstructions,
  TRAVEL_MODE_ICONS,
  TRAVEL_MODE_LABELS
} from '@/lib/route-planning';

interface RouteDisplayProps {
  origin?: { lat: number; lng: number; name?: string };
  destination?: { lat: number; lng: number; name?: string };
  travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  onRouteLoaded?: (route: Route) => void;
  onBoundsChange?: (bounds: [[number, number], [number, number]]) => void;
  showDirections?: boolean;
  className?: string;
}

export default function RouteDisplay({
  origin,
  destination,
  travelMode = 'driving',
  onRouteLoaded,
  onBoundsChange,
  showDirections = false,
  className = ''
}: RouteDisplayProps) {
  const [route, setRoute] = useState<Route | null>(null);
  const [directionsData, setDirectionsData] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination) {
      setRoute(null);
      setDirectionsData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const routeOptions: RouteOptions = {
        origin: {
          location: origin,
          name: origin.name
        },
        destination: {
          location: destination,
          name: destination.name
        },
        travelMode,
        alternatives: true
      };

      const result = await getDirections(routeOptions);
      
      if (result.status === 'OK' && result.routes.length > 0) {
        setDirectionsData(result);
        const selectedRoute = result.routes[selectedRouteIndex] || result.routes[0];
        setRoute(selectedRoute);
        onRouteLoaded?.(selectedRoute);
        
        const bounds = getRouteBounds(selectedRoute);
        onBoundsChange?.(bounds);
      } else {
        setError(result.error_message || 'No routes found');
      }
    } catch (err) {
      console.error('Route planning error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get directions');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, travelMode, selectedRouteIndex, onRouteLoaded, onBoundsChange]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const handleRouteSelect = (index: number) => {
    if (directionsData && directionsData.routes[index]) {
      setSelectedRouteIndex(index);
      const selectedRoute = directionsData.routes[index];
      setRoute(selectedRoute);
      onRouteLoaded?.(selectedRoute);
      
      const bounds = getRouteBounds(selectedRoute);
      onBoundsChange?.(bounds);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setDirectionsData(null);
    setError(null);
    setSelectedRouteIndex(0);
  };

  // Route line styles for MapLibre
  const routeLineStyle = {
    'line-color': '#007bff',
    'line-width': 6,
    'line-opacity': 0.8,
    'line-cap': 'round' as const,
    'line-join': 'round' as const,
  };

  const routeBorderStyle = {
    'line-color': '#ffffff',
    'line-width': 8,
    'line-opacity': 0.6,
    'line-cap': 'round' as const,
    'line-join': 'round' as const,
  };

  const alternativeRouteStyle = {
    'line-color': '#6c757d',
    'line-width': 4,
    'line-opacity': 0.6,
    'line-cap': 'round' as const,
    'line-join': 'round' as const,
  };

  return (
    <div className={`route-display ${className}`}>
      {/* Route lines on map */}
      {directionsData && directionsData.routes.map((routeData, index) => {
        const geoJSON = routeToGeoJSON(routeData);
        const isSelected = index === selectedRouteIndex;
        
        return (
          <div key={`route-${index}`}>
            {/* Route border (white outline) */}
            <Source
              id={`route-border-${index}`}
              type="geojson"
              data={geoJSON}
            >
              <Layer
                id={`route-border-layer-${index}`}
                type="line"
                paint={routeBorderStyle}
                beforeId="restaurant-markers"
              />
            </Source>
            
            {/* Route line */}
            <Source
              id={`route-line-${index}`}
              type="geojson"
              data={geoJSON}
            >
              <Layer
                id={`route-line-layer-${index}`}
                type="line"
                paint={isSelected ? routeLineStyle : alternativeRouteStyle}
                beforeId="restaurant-markers"
              />
            </Source>
          </div>
        );
      })}

      {/* Route controls */}
      {(origin && destination) && (
        <div className="route-controls">
          {loading && (
            <div className="route-loading">
              <span>🔄</span> Planning route...
            </div>
          )}
          
          {error && (
            <div className="route-error">
              <span>❌</span> {error}
              <button onClick={fetchRoute} className="retry-btn">
                Retry
              </button>
            </div>
          )}
          
          {route && (
            <div className="route-summary">
              <div className="route-header">
                <span className="travel-mode-icon">
                  {TRAVEL_MODE_ICONS[travelMode]}
                </span>
                <span className="travel-mode-label">
                  {TRAVEL_MODE_LABELS[travelMode]}
                </span>
                <button onClick={clearRoute} className="clear-route-btn">
                  ✕
                </button>
              </div>
              
              <div className="route-info">
                <span className="route-duration">
                  {formatDuration(route.legs.reduce((total, leg) => total + leg.duration.value, 0))}
                </span>
                <span className="route-distance">
                  {formatRouteDistance(route.legs.reduce((total, leg) => total + leg.distance.value, 0))}
                </span>
              </div>
              
              {directionsData && directionsData.routes.length > 1 && (
                <div className="route-alternatives">
                  {directionsData.routes.map((_, index) => (
                    <button
                      key={index}
                      className={`route-alt-btn ${index === selectedRouteIndex ? 'active' : ''}`}
                      onClick={() => handleRouteSelect(index)}
                    >
                      Route {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Turn-by-turn directions panel */}
      {showDirections && route && (
        <div className="directions-panel">
          <div className="directions-header">
            <h3>Directions</h3>
            <span className="directions-summary">
              {route.summary}
            </span>
          </div>
          
          <div className="directions-steps">
            {route.legs.map((leg, legIndex) => (
              <div key={legIndex} className="directions-leg">
                {leg.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="direction-step">
                    <div className="step-icon">
                      {step.maneuver ? getManeuverIcon(step.maneuver) : '➡️'}
                    </div>
                    <div className="step-content">
                      <div className="step-instruction">
                        {cleanInstructions(step.html_instructions)}
                      </div>
                      <div className="step-details">
                        <span className="step-distance">{step.distance.text}</span>
                        <span className="step-duration">{step.duration.text}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get maneuver icons
function getManeuverIcon(maneuver: string): string {
  const icons: Record<string, string> = {
    'turn-left': '↰',
    'turn-right': '↱',
    'turn-slight-left': '↖️',
    'turn-slight-right': '↗️',
    'turn-sharp-left': '↙️',
    'turn-sharp-right': '↘️',
    'uturn-left': '🔄',
    'uturn-right': '🔄',
    'straight': '⬆️',
    'ramp-left': '↰',
    'ramp-right': '↱',
    'merge': '↗️',
    'fork-left': '↖️',
    'fork-right': '↗️',
    'ferry': '⛴️',
    'roundabout-left': '🔄',
    'roundabout-right': '🔄',
  };
  
  return icons[maneuver] || '➡️';
}