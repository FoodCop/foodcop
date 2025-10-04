'use client';

import React from 'react';
import ScoutMapContainer from './ScoutMapContainer';

/**
 * Test component for MapLibre integration
 * Tests user location detection, marker display, and map interactions
 */
export const MapLibreIntegrationTest: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '16px' }}>MapLibre Integration Test</h2>
      
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Test Features:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>✅ MapLibre GL JS rendering</li>
          <li>✅ User location detection with accuracy</li>
          <li>✅ Animated location marker with pulse effect</li>
          <li>✅ Reverse geocoding for address display</li>
          <li>✅ Map controls (navigation, scale, fullscreen)</li>
          <li>✅ Loading states and error handling</li>
          <li>✅ SSR compatibility with dynamic imports</li>
        </ul>
      </div>

      <ScoutMapContainer
        style={{ 
          width: '100%', 
          height: '600px',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        autoLocateUser={true}
        showLocationAccuracy={true}
        onLocationFound={(location) => {
          console.log('✅ Location detection successful:', location);
        }}
        onLocationError={(error) => {
          console.error('❌ Location detection failed:', error);
        }}
        onMapClick={(event) => {
          console.log('🗺️ Map clicked at:', event.lngLat);
        }}
      />
      
      <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
        <strong>Testing Instructions:</strong>
        <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>Allow location access when prompted by the browser</li>
          <li>Verify that your location marker appears with a pulsing animation</li>
          <li>Check that the location accuracy circle is displayed</li>
          <li>Confirm that your address appears in the location status indicator</li>
          <li>Test map interactions (pan, zoom, click)</li>
          <li>Check the browser console for detailed logs</li>
          <li>Look for &quot;Map Ready&quot; indicator in bottom-left corner</li>
        </ol>
      </div>
    </div>
  );
};

export default MapLibreIntegrationTest;