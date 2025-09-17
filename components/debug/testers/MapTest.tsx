import React, { useState } from 'react';
import { MapView } from './MapView';
import { Button } from './ui/button';

// Simple test component to verify MapLibre works without errors
export function MapTest() {
  const [style, setStyle] = useState('OpenStreetMap');
  
  // Mock restaurants for testing
  const testRestaurants = [
    {
      id: 'test-1',
      name: 'Test Restaurant',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      rating: 4.5,
      reviewCount: 123,
      cuisine: ['Test'],
      address: 'Test Address',
      openHours: 'Open now',
      priceLevel: 2,
      distance: '0.1 mi',
      isOpen: true,
      isSaved: false,
      coordinates: { lat: 37.7749, lng: -122.4194 }
    }
  ];

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-4">MapLibre Test Page</h1>
        
        <div className="mb-4 flex gap-2">
          <Button 
            onClick={() => setStyle('OpenStreetMap')}
            variant={style === 'OpenStreetMap' ? 'default' : 'outline'}
            size="sm"
          >
            OpenStreetMap
          </Button>
          <Button 
            onClick={() => setStyle('Streets')}
            variant={style === 'Streets' ? 'default' : 'outline'}
            size="sm"
          >
            Streets
          </Button>
          <Button 
            onClick={() => setStyle('Satellite')}
            variant={style === 'Satellite' ? 'default' : 'outline'}
            size="sm"
          >
            Satellite
          </Button>
          <Button 
            onClick={() => setStyle('Terrain')}
            variant={style === 'Terrain' ? 'default' : 'outline'}
            size="sm"
          >
            Terrain
          </Button>
        </div>

        <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
          <MapView
            restaurants={testRestaurants}
            selectedRestaurant={null}
            onRestaurantSelect={(restaurant) => console.log('Selected:', restaurant)}
          />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-[#0B1F3A] mb-2">Map Status</h3>
          <p className="text-sm text-gray-600">
            Test the different map styles to ensure MapLibre loads correctly without terrain tile errors.
            The terrain style now uses OpenTopoMap instead of the deprecated Stamen tiles.
          </p>
        </div>
      </div>
    </div>
  );
}
