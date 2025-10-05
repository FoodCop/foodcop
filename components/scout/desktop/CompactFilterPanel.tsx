'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface CompactFilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCuisine: string;
  selectedPriceRange: number[];
  sortBy: 'distance' | 'rating' | 'price';
  onCuisineChange: (cuisine: string) => void;
  onPriceChange: (prices: number[]) => void;
  onSortChange: (sort: 'distance' | 'rating' | 'price') => void;
}

export function CompactFilterPanel({
  isOpen,
  onToggle,
  selectedCuisine,
  selectedPriceRange,
  sortBy,
  onCuisineChange,
  onPriceChange,
  onSortChange
}: CompactFilterPanelProps) {
  const cuisines = [
    'All',
    'Italian',
    'Asian',
    'Mexican',
    'American',
    'Mediterranean',
    'Indian',
    'Thai'
  ];

  const priceRanges = [1, 2, 3, 4];

  const sortOptions = [
    { id: 'distance', label: 'Distance' },
    { id: 'rating', label: 'Rating' },
    { id: 'price', label: 'Price' }
  ];

  const handlePriceToggle = (price: number) => {
    if (selectedPriceRange.includes(price)) {
      onPriceChange(selectedPriceRange.filter(p => p !== price));
    } else {
      onPriceChange([...selectedPriceRange, price]);
    }
  };

  return (
    <div className="compact-filter-panel">
      {/* Filter Toggle Header */}
      <button
        onClick={onToggle}
        className="filter-toggle-btn"
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Collapsible Filter Content */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="filter-content"
      >
        <div className="filter-sections">
          {/* Cuisine Filter */}
          <div className="filter-section">
            <label className="filter-label">Cuisine</label>
            <div className="filter-chips">
              {cuisines.slice(0, 6).map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => onCuisineChange(selectedCuisine === cuisine ? '' : cuisine)}
                  className={`filter-chip ${
                    selectedCuisine === cuisine ? 'active' : ''
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <label className="filter-label">Price Range</label>
            <div className="filter-chips">
              {priceRanges.map((price) => (
                <button
                  key={price}
                  onClick={() => handlePriceToggle(price)}
                  className={`filter-chip ${
                    selectedPriceRange.includes(price) ? 'active' : ''
                  }`}
                >
                  {'$'.repeat(price)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="filter-section">
            <label className="filter-label">Sort by</label>
            <div className="filter-chips">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSortChange(option.id as any)}
                  className={`filter-chip ${
                    sortBy === option.id ? 'active' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CompactFilterPanel;