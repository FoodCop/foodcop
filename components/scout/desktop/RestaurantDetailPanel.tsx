'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Heart,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { Restaurant } from '../RestaurantCard';

interface RestaurantDetailPanelProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onSave: (restaurant: Restaurant) => void;
  onViewOnMap: (restaurant: Restaurant) => void;
  onGetDirections: (restaurant: Restaurant) => void;
  onClose: () => void;
  className?: string;
}

export function RestaurantDetailPanel({
  restaurant,
  isOpen,
  onSave,
  onViewOnMap,
  onGetDirections,
  onClose,
  className = ''
}: RestaurantDetailPanelProps) {
  const getPriceLevelDisplay = (level: number) => {
    return '$'.repeat(level) + '·'.repeat(Math.max(0, 3 - level));
  };

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWebsiteVisit = (website: string) => {
    window.open(website, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && restaurant && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`restaurant-detail-panel ${className}`}
        >
          <div className="detail-panel-content">
            {/* Header */}
            <div className="detail-header">
              <h3 className="detail-title">Restaurant Details</h3>
              <button onClick={onClose} className="close-btn">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Restaurant Image */}
            <div className="detail-image-container">
              {restaurant.image ? (
                <Image
                  src={restaurant.image}
                  alt={restaurant.name}
                  width={300}
                  height={200}
                  className="detail-image"
                />
              ) : (
                <div className="detail-image-placeholder">
                  <span className="placeholder-icon">🍽️</span>
                </div>
              )}

              {/* Save Button Overlay */}
              <button
                onClick={() => onSave(restaurant)}
                className={`detail-save-btn ${restaurant.isSaved ? 'saved' : ''}`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    restaurant.isSaved ? 'text-red-500 fill-current' : 'text-white'
                  }`}
                />
              </button>

              {/* Status Badge */}
              <div
                className={`detail-status-badge ${
                  restaurant.isOpen ? 'open' : 'closed'
                }`}
              >
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="detail-info">
              {/* Name and Rating */}
              <div className="detail-main-info">
                <h2 className="restaurant-name">{restaurant.name}</h2>
                <div className="rating-section">
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`star ${
                          i < Math.floor(restaurant.rating)
                            ? 'star-filled'
                            : 'star-empty'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="rating-value">{restaurant.rating}</span>
                  <span className="rating-count">({restaurant.reviewCount} reviews)</span>
                  <span className="price-level">
                    {getPriceLevelDisplay(restaurant.priceLevel)}
                  </span>
                </div>
              </div>

              {/* Cuisine Tags */}
              <div className="cuisine-tags">
                {restaurant.cuisine.map((cuisine, index) => (
                  <span key={index} className="cuisine-tag">
                    {cuisine}
                  </span>
                ))}
              </div>

              {/* Details List */}
              <div className="detail-list">
                {/* Address */}
                <div className="detail-item">
                  <div className="detail-icon">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{restaurant.address}</span>
                  </div>
                </div>

                {/* Distance */}
                <div className="detail-item">
                  <div className="detail-icon">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Distance</span>
                    <span className="detail-value">{restaurant.distance} away</span>
                  </div>
                </div>

                {/* Hours */}
                <div className="detail-item">
                  <div className="detail-icon">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Hours</span>
                    <span
                      className={`detail-value ${
                        restaurant.isOpen ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {restaurant.openHours}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                {restaurant.phone && (
                  <div className="detail-item clickable" onClick={() => handlePhoneCall(restaurant.phone!)}>
                    <div className="detail-icon">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value link">{restaurant.phone}</span>
                    </div>
                  </div>
                )}

                {/* Website */}
                {restaurant.website && (
                  <div className="detail-item clickable" onClick={() => handleWebsiteVisit(restaurant.website!)}>
                    <div className="detail-icon">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="detail-content">
                      <span className="detail-label">Website</span>
                      <span className="detail-value link">
                        Visit website
                        <ExternalLink className="w-3 h-3 ml-1 inline" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="detail-actions">
              <button
                onClick={() => onSave(restaurant)}
                className={`action-btn primary ${restaurant.isSaved ? 'saved' : ''}`}
              >
                <Heart className={`w-4 h-4 ${restaurant.isSaved ? 'fill-current' : ''}`} />
                {restaurant.isSaved ? 'Saved to Plate' : 'Save to Plate'}
              </button>

              <button
                onClick={() => onViewOnMap(restaurant)}
                className="action-btn secondary"
              >
                <MapPin className="w-4 h-4" />
                View on Map
              </button>

              <button
                onClick={() => onGetDirections(restaurant)}
                className="action-btn secondary"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RestaurantDetailPanel;