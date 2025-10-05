'use client';

import React, { useState } from 'react';
import { MapPin, Loader } from 'lucide-react';
import { Restaurant } from '../RestaurantCard';
import CompactFilterPanel from './CompactFilterPanel';
import RestaurantListCompact from './RestaurantListCompact';
import RestaurantDetailPanel from './RestaurantDetailPanel';

interface GeolocationResult {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  method: 'browser' | 'ip_geolocation' | 'default';
}

interface ScoutSidebarProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  loading: boolean;
  currentLocation: { lat: number; lng: number; city?: string; country?: string } | null;
  geolocation: GeolocationResult | null;
  refreshingLocation: boolean;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onSaveRestaurant: (restaurant: Restaurant) => void;
  onViewOnMap: (restaurant: Restaurant) => void;
  onGetDirections: (restaurant: Restaurant) => void;
  onLocationRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    selectedCuisine: string;
    selectedPriceRange: number[];
    sortBy: 'distance' | 'rating' | 'price';
  };
  onFilterChange: (filters: {
    selectedCuisine: string;
    selectedPriceRange: number[];
    sortBy: 'distance' | 'rating' | 'price';
  }) => void;
  className?: string;
}

export function ScoutSidebar({
  restaurants,
  selectedRestaurant,
  loading,
  currentLocation,
  geolocation,
  refreshingLocation,
  onRestaurantSelect,
  onSaveRestaurant,
  onViewOnMap,
  onGetDirections,
  onLocationRefresh,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  className = ''
}: ScoutSidebarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    onRestaurantSelect(restaurant);
    setShowDetailPanel(true);
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
    // Clear restaurant selection when closing detail panel
  };

  const handleViewOnMap = (restaurant: Restaurant) => {
    onViewOnMap(restaurant);
    setShowDetailPanel(false);
  };

  const handleGetDirections = (restaurant: Restaurant) => {
    onGetDirections(restaurant);
  };

  const handleCuisineChange = (cuisine: string) => {
    onFilterChange({
      ...filters,
      selectedCuisine: cuisine
    });
  };

  const handlePriceChange = (prices: number[]) => {
    onFilterChange({
      ...filters,
      selectedPriceRange: prices
    });
  };

  const handleSortChange = (sort: 'distance' | 'rating' | 'price') => {
    onFilterChange({
      ...filters,
      sortBy: sort
    });
  };

  return (
    <div className={`scout-sidebar-container ${className}`}>
      {/* Header Section */}
      <div className="sidebar-header">
        <div className="header-content">
          <h1 className="sidebar-title">🍽️ Food Scout</h1>
          <p className="sidebar-subtitle">Discover restaurants near you</p>
        </div>
      </div>

      {/* Location Status Card */}
      {geolocation && (
        <div className="location-status-card">
          <div className="location-content">
            <div className="location-icon">
              <MapPin className={`w-4 h-4 text-blue-500 ${refreshingLocation ? 'animate-pulse' : ''}`} />
            </div>
            <div className="location-info">
              <span className="location-name">
                {geolocation.city
                  ? `${geolocation.city}, ${geolocation.region}`
                  : 'Current Location'}
              </span>
              <div className="location-method">
                {geolocation.method === 'browser' && '📍 GPS Location (Most Accurate)'}
                {geolocation.method === 'ip_geolocation' && '🌐 IP-based Location'}
                {geolocation.method === 'default' && '📌 Default Location'}
              </div>
            </div>
            <button
              onClick={onLocationRefresh}
              disabled={refreshingLocation}
              className="location-refresh-btn"
            >
              {refreshingLocation ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <CompactFilterPanel
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        selectedCuisine={filters.selectedCuisine}
        selectedPriceRange={filters.selectedPriceRange}
        sortBy={filters.sortBy}
        onCuisineChange={handleCuisineChange}
        onPriceChange={handlePriceChange}
        onSortChange={handleSortChange}
      />

      {/* Restaurant List */}
      <div className="restaurant-list-section">
        <RestaurantListCompact
          restaurants={restaurants}
          selectedRestaurant={selectedRestaurant}
          onRestaurantSelect={handleRestaurantSelect}
          onSaveRestaurant={onSaveRestaurant}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>

      {/* Detail Panel */}
      <RestaurantDetailPanel
        restaurant={selectedRestaurant}
        isOpen={showDetailPanel}
        onSave={onSaveRestaurant}
        onViewOnMap={handleViewOnMap}
        onGetDirections={handleGetDirections}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

export default ScoutSidebar;