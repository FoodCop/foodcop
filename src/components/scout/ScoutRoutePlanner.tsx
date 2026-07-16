'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, X, Search, Loader2 } from 'lucide-react';
import { getGoogleMaps } from '@/types/scout';
import { extractSuggestionText } from '@/lib/scout/scoutLogic';

interface ScoutRoutePlannerProps {
  onCalculateRoute: (origin: string, destination: string) => Promise<void>;
  onClear: () => void;
  isCalculating: boolean;
  isVisible: boolean;
  onClose: () => void;
}

export const ScoutRoutePlanner = ({
  onCalculateRoute,
  onClear,
  isCalculating,
  isVisible,
  onClose
}: ScoutRoutePlannerProps) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originDisplay, setOriginDisplay] = useState('');
  const [destDisplay, setDestDisplay] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<Array<{ text: string; placeId: string }>>([]);
  const [destSuggestions, setDestSuggestions] = useState<Array<{ text: string; placeId: string }>>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originTimerRef = useRef<any>(null);
  const destTimerRef = useRef<any>(null);

  const fetchSuggestions = useCallback(async (input: string, setter: (s: Array<{ text: string; placeId: string }>) => void) => {
    if (!input || input.length < 2) {
      setter([]);
      return;
    }

    const google = getGoogleMaps();
    if (!google) return;

    try {
      if (typeof (google as any).importLibrary === 'function') {
        const placesLib = await (google as any).importLibrary('places') as any;
        if (placesLib?.AutocompleteSuggestion) {
          const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input });
          if (response?.suggestions) {
            const parsed = response.suggestions
              .map(extractSuggestionText)
              .filter((s: any): s is { text: string; placeId: string } => s !== null);
            setter(parsed);
          }
        }
      }
    } catch (err) {
      console.error('Route Planner autocomplete error:', err);
    }
  }, []);

  const handleOriginChange = (value: string) => {
    setOriginDisplay(value);
    setOrigin(value);
    setShowOriginDropdown(true);

    if (originTimerRef.current) clearTimeout(originTimerRef.current);
    originTimerRef.current = setTimeout(() => {
      fetchSuggestions(value, setOriginSuggestions);
    }, 300);
  };

  const handleDestChange = (value: string) => {
    setDestDisplay(value);
    setDestination(value);
    setShowDestDropdown(true);

    if (destTimerRef.current) clearTimeout(destTimerRef.current);
    destTimerRef.current = setTimeout(() => {
      fetchSuggestions(value, setDestSuggestions);
    }, 300);
  };

  const selectOrigin = (suggestion: { text: string; placeId: string }) => {
    setOriginDisplay(suggestion.text);
    setOrigin(suggestion.placeId ? `place_id:${suggestion.placeId}` : suggestion.text);
    setOriginSuggestions([]);
    setShowOriginDropdown(false);
  };

  const selectDest = (suggestion: { text: string; placeId: string }) => {
    setDestDisplay(suggestion.text);
    setDestination(suggestion.placeId ? `place_id:${suggestion.placeId}` : suggestion.text);
    setDestSuggestions([]);
    setShowDestDropdown(false);
  };

  useEffect(() => {
    return () => {
      if (originTimerRef.current) clearTimeout(originTimerRef.current);
      if (destTimerRef.current) clearTimeout(destTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      setOrigin('');
      setDestination('');
      setOriginDisplay('');
      setDestDisplay('');
      setOriginSuggestions([]);
      setDestSuggestions([]);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="scout-route-planner">
      <div className="scout-route-planner__header">
        <div className="scout-route-planner__title">
          <Navigation size={18} />
          <span>Route Planner</span>
        </div>
        <button onClick={onClose} className="scout-route-planner__close">
          <X size={16} />
        </button>
      </div>

      <div className="scout-route-planner__fields">
        {/* Origin */}
        <div className="scout-route-field">
          <div className="scout-route-field__marker" />
          <input
            type="text"
            placeholder="Starting Point"
            value={originDisplay}
            onChange={(e) => handleOriginChange(e.target.value)}
            onFocus={() => originSuggestions.length > 0 && setShowOriginDropdown(true)}
            onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
            className="scout-route-field__input"
          />
          {showOriginDropdown && originSuggestions.length > 0 && (
            <div className="scout-route-field__suggestions">
              {originSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOrigin(s)}
                  className="scout-route-field__suggestion"
                >
                  <MapPin size={14} style={{ color: '#a8a29e', flexShrink: 0 }} />
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="scout-route-field">
          <MapPin size={18} className="scout-route-field__pin" />
          <input
            type="text"
            placeholder="Destination"
            value={destDisplay}
            onChange={(e) => handleDestChange(e.target.value)}
            onFocus={() => destSuggestions.length > 0 && setShowDestDropdown(true)}
            onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
            className="scout-route-field__input"
          />
          {showDestDropdown && destSuggestions.length > 0 && (
            <div className="scout-route-field__suggestions">
              {destSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectDest(s)}
                  className="scout-route-field__suggestion"
                >
                  <MapPin size={14} style={{ color: '#a8a29e', flexShrink: 0 }} />
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="scout-route-planner__actions">
        <button
          onClick={() => {
            onClear();
            setOriginDisplay('');
            setDestDisplay('');
            setOrigin('');
            setDestination('');
          }}
          className="scout-route-planner__clear"
        >
          Clear
        </button>
        <button
          onClick={() => onCalculateRoute(origin, destination)}
          disabled={!origin || !destination || isCalculating}
          className="scout-route-planner__submit"
        >
          {isCalculating ? <Loader2 size={18} className="scout-spin" /> : <Search size={18} />}
          <span>Find Eats Along Route</span>
        </button>
      </div>
    </div>
  );
};
