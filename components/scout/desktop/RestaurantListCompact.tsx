'use client';

import React from 'react';
import { Loader, Search } from 'lucide-react';
import { RestaurantCard, Restaurant } from '../RestaurantCard';

interface RestaurantListCompactProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onSaveRestaurant: (restaurant: Restaurant) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export function RestaurantListCompact({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  onSaveRestaurant,
  loading,
  searchQuery,
  onSearchChange,
  className = ''
}: RestaurantListCompactProps) {
  // Filter restaurants based on search query
  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.some((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`restaurant-list-compact ${className}`}>
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Restaurant Count */}
      <div className="restaurant-count">
        {loading ? (
          <span className="count-loading">Finding restaurants...</span>
        ) : (
          <span className="count-text">
            {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
          </span>
        )}
      </div>

      {/* Restaurant List */}
      <div className="restaurant-list-container">
        {loading ? (
          <div className="loading-state">
            <Loader className="loading-spinner" />
            <span className="loading-text">Finding nearby restaurants...</span>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <p className="empty-title">No restaurants found</p>
                <p className="empty-subtitle">
                  Try adjusting your search or browse all restaurants
                </p>
                <button
                  onClick={() => onSearchChange('')}
                  className="clear-search-btn"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="empty-title">No restaurants nearby</p>
                <p className="empty-subtitle">
                  Try expanding your search radius or check your location
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="restaurant-cards-list">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                variant="compact"
                selected={selectedRestaurant?.id === restaurant.id}
                onClick={() => onRestaurantSelect(restaurant)}
                onSave={() => onSaveRestaurant(restaurant)}
                className="list-card-item"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RestaurantListCompact;