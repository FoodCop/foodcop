'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Star, ChevronRight, ChevronUp, Utensils, X } from 'lucide-react';
import type { ScoutPlace, ScoutFilter } from '@/types/scout';
import { getMatchPercentage } from '@/lib/scout/scoutLogic';
import { SourceBadge, placeOrigin } from './SourceBadge';

interface ScoutDiscoveryPanelProps {
  places: ScoutPlace[];
  onPlaceSelect: (place: ScoutPlace) => void;
  filter: ScoutFilter;
  onFilterChange: (filter: ScoutFilter) => void;
  onDistanceChangeEnd: () => void;
  onClose: () => void;
  /** Changes when a map-legend item is tapped - opens the mobile list sheet. */
  openSignal?: number;
  /** Set when the list is filtered to one legend group (Nearby / FUZO / Saved). */
  sourceLabel?: string;
  onClearSource?: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  google: 'Nearby',
  fuzo: 'FUZO',
  saved: 'Saved',
};

export const ScoutDiscoveryPanel = ({
  places,
  onPlaceSelect,
  filter,
  onFilterChange,
  onDistanceChangeEnd,
  openSignal = 0,
  sourceLabel,
  onClearSource,
}: ScoutDiscoveryPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Open the mobile sheet when the legend asks (adjust-state-on-prop-change).
  const [seenSignal, setSeenSignal] = useState(openSignal);
  if (seenSignal !== openSignal) {
    setSeenSignal(openSignal);
    setIsExpanded(true);
  }

  const sourceChip = sourceLabel ? (
    <div className="scout-panel__source">
      <span>
        Showing: <strong>{sourceLabel}</strong>
      </span>
      {onClearSource && (
        <button type="button" onClick={onClearSource} aria-label="Show all places">
          <X size={12} /> All
        </button>
      )}
    </div>
  ) : null;
  const emptyText =
    sourceLabel === 'Saved'
      ? 'No saved places yet - tap Save on any place to keep it here.'
      : 'No spots found in this area';
  const [dragStartY, setDragStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const filterOptions: { id: ScoutFilter['type'], label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'top', label: 'Top Rated' },
    { id: 'open', label: 'Open Now' },
    { id: 'distance', label: 'Distance' }
  ];

  const handleDragStart = useCallback((clientY: number) => {
    setDragStartY(clientY);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((clientY: number) => {
    setIsDragging(false);
    const delta = dragStartY - clientY;
    if (delta > 50) {
      setIsExpanded(true);
    } else if (delta < -50) {
      setIsExpanded(false);
    }
  }, [dragStartY]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    handleDragEnd(e.changedTouches[0].clientY);
  }, [handleDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDragging) handleDragEnd(e.clientY);
  }, [isDragging, handleDragEnd]);

  const radiusSlider = (
    <input
      type="range"
      min="500"
      max="10000"
      step="500"
      value={filter.maxDistance}
      onChange={(e) => onFilterChange({ ...filter, maxDistance: parseInt(e.target.value) })}
      onMouseUp={onDistanceChangeEnd}
      onTouchEnd={onDistanceChangeEnd}
      className="scout-panel__radius-input"
    />
  );

  const filterChips = (
    <div className="scout-panel__filters scout-hide-scrollbar">
      {filterOptions.map(opt => (
        <button
          key={opt.id}
          onClick={() => onFilterChange({ ...filter, type: opt.id })}
          className={`scout-filter-chip${filter.type === opt.id ? ' is-active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile bottom sheet */}
      <div
        ref={panelRef}
        className={`scout-panel--mobile${isExpanded ? ' is-expanded' : ''}`}
      >
        <div
          className="scout-panel__handle"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={() => setIsExpanded(prev => !prev)}
        >
          <div className="scout-panel__grip" />
          <div className="scout-panel__handle-label">
            <span>{places.length} {sourceLabel ? `${sourceLabel.toLowerCase()} places` : 'places nearby'}</span>
            <ChevronUp size={14} className="scout-panel__chevron" />
          </div>
        </div>

        <div className="scout-panel__radius">
          <span className="scout-panel__radius-label">Radius: {(filter.maxDistance / 1000).toFixed(1)}km</span>
          {radiusSlider}
        </div>

        {filterChips}
        {sourceChip}

        <div className="scout-panel__list scout-hide-scrollbar">
          {places.length === 0 ? (
            <div className="scout-panel__empty">{emptyText}</div>
          ) : (
            places.map((place) => (
              <PlaceCard key={place.id} place={place} onSelect={onPlaceSelect} />
            ))
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="scout-panel--desktop">
        <div className="scout-panel__radius">
          <span className="scout-panel__radius-label">Radius: {(filter.maxDistance / 1000).toFixed(1)}km</span>
          {radiusSlider}
        </div>

        {filterChips}

        <div className="scout-panel__count">{places.length} {sourceLabel ? `${sourceLabel} places` : 'places discovered'}</div>
        {sourceChip}

        <div className="scout-panel__list scout-hide-scrollbar">
          {places.length === 0 ? (
            <div className="scout-panel__empty">{emptyText}</div>
          ) : (
            places.map((place) => (
              <PlaceCard key={place.id} place={place} onSelect={onPlaceSelect} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

// --- Place Card ---

const PlaceCard = ({ place, onSelect }: { place: ScoutPlace; onSelect: (p: ScoutPlace) => void }) => {
  const source = place.markerSource || 'google';
  const sourceLabel = SOURCE_LABELS[source] || 'Nearby';

  return (
    <button onClick={() => onSelect(place)} className="scout-place-card">
      <div className="scout-place-card__image">
        {/* Community pins / new FUZO restaurants may have no photo - never render src="". */}
        {place.img ? (
          <img
            src={place.img}
            alt={place.name}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200'; }}
          />
        ) : (
          <span className="scout-place-card__noimg" aria-hidden="true"><Utensils size={18} /></span>
        )}
        <SourceBadge origin={placeOrigin(place)} className="scout-place-card__badge" />
      </div>
      <div className="scout-place-card__body">
        <div className="scout-place-card__source">
          <span className={`scout-legend__dot scout-legend__dot--${source}`} />
          <span>{sourceLabel}</span>
        </div>
        <p className="scout-place-card__name">{place.name}</p>
        <p className="scout-place-card__cat">{place.cat}</p>
        <div className="scout-place-card__meta">
          {place.rating > 0 ? (
            <div className="scout-place-card__rating">
              <Star size={11} fill="currentColor" />
              <span>{place.rating.toFixed(1)}</span>
            </div>
          ) : (
            <span>New</span>
          )}
          {place.distanceText && <span>· {place.distanceText}</span>}
          <span className="scout-place-card__match">{getMatchPercentage(place)}%</span>
        </div>
      </div>
      <ChevronRight size={14} style={{ color: '#d6d3d1', flexShrink: 0 }} />
    </button>
  );
};
