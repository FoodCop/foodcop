# Scout Map Integration - MapLibre Migration Plan

**Date**: September 29, 2025  
**Phase**: 7  
**Status**: Planning Complete - Ready for Implementation

## 🎯 Project Objectives

Migrate the Scout page from expensive Google Maps JavaScript API to MapLibre GL JS while enhancing mapping capabilities and maintaining all existing functionality. The goal is to create a Google Maps clone experience with:

- Interactive MapLibre-based map display
- User location pinpointing with custom markers
- Restaurant discovery with distance calculations
- Route planning with Google Directions API integration
- Polyline to GeoJSON conversion for route display
- Zero breaking changes to existing functionality

---

## 📋 Current State Analysis

### Existing Functionality (Phase 6)
✅ **Current Scout Implementation:**
- Basic page structure with placeholder map area (`app/scout/page.tsx`)
- ScoutDebug component with comprehensive restaurant search
- Google Places API integration for restaurant discovery
- Geolocation services with reverse geocoding
- Save-to-plate functionality with authentication
- 9 restaurant categories with filtering capabilities
- Distance calculations and rating-based search

### Current Google Maps Dependencies
- **Google Places API**: Restaurant search and discovery (KEEP - Cost effective)
- **Google Maps API**: Reverse geocoding for location to address conversion (KEEP)
- **Google Maps JavaScript API**: Referenced in specs but not implemented (REPLACE)
- **Google Directions API**: Planned but not implemented (ADD)

### Files Currently Involved
- `app/scout/page.tsx` - Basic Scout page with map placeholder
- `components/debug/ScoutDebug.tsx` - Restaurant search and testing
- `app/api/scout-debug/restaurant-search/route.ts` - Restaurant discovery API
- `app/api/save-restaurant/route.ts` - Restaurant saving functionality
- `app/api/debug/saved-restaurants/route.ts` - Saved restaurant retrieval
- `specs/SCOUT_SPEC.md` - Original Scout page specification

---

## 🗺️ MapLibre GL JS Integration Strategy

### Why MapLibre GL JS?
- **Cost-Effective**: Open source, no usage limits or API costs
- **SSR Compatible**: Works with Next.js server-side rendering
- **Performance**: WebGL-based rendering for smooth interactions
- **Customizable**: Complete control over map styling and appearance
- **Standards-Based**: Uses vector tiles and open standards
- **No Vendor Lock-in**: Open source alternative to commercial mapping solutions

### MapLibre Capabilities for Our Use Case
- **Vector Tiles**: Fast, scalable map rendering with crisp visuals
- **Custom Markers**: Full control over restaurant markers with category icons
- **Interactive Popups**: Rich info windows for restaurant details
- **User Location**: Built-in geolocation support with accuracy indicators
- **Route Display**: Native GeoJSON support for displaying directions
- **Custom Controls**: Add search, filter, and navigation controls
- **Mobile Optimized**: Touch gestures and responsive design

### Technical Requirements
```json
{
  "dependencies": {
    "maplibre-gl": "^3.6.0",
    "react-map-gl": "^7.1.0",
    "@types/maplibre-gl": "^2.4.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "next": "^15.0.0"
  }
}
```

---

## 🏗️ Proposed Architecture

### Component Structure
```
ScoutPage (Enhanced)
├── ScoutMapContainer (New - MapLibre wrapper)
│   ├── MapLibreMap (Core map component)
│   ├── UserLocationMarker (User position with accuracy circle)
│   ├── RestaurantMarkers (Restaurant pins with category icons)
│   ├── RouteLayer (Direction polylines with turn indicators)
│   ├── MapControls (Zoom, style toggle, fullscreen)
│   └── SearchControl (Integrated map search)
├── RestaurantSearch (Enhanced search interface)
├── RestaurantDetails (Side panel/modal for restaurant info)
├── RoutePanel (Directions interface with turn-by-turn)
├── FilterPanel (Advanced filtering controls)
└── ScoutDebug (Maintained for debugging - unchanged)
```

### File Structure Plan
```
components/scout/
├── ScoutMapContainer.tsx       # Main map wrapper component
├── MapLibreMap.tsx            # Core MapLibre integration
├── UserLocationMarker.tsx     # User position marker
├── RestaurantMarkers.tsx      # Restaurant marker system
├── RouteLayer.tsx             # Route display component
├── MapControls.tsx            # Map control buttons
├── RestaurantDetails.tsx      # Restaurant info panel
├── RoutePanel.tsx             # Directions panel
└── FilterPanel.tsx            # Search and filter controls

lib/scout/
├── mapLibreConfig.ts          # Map configuration and styles
├── polylineDecoder.ts         # Google polyline decoding utility
├── geoJsonConverter.ts        # GeoJSON conversion utilities
├── markerIcons.ts             # Restaurant category icons
└── routeUtils.ts              # Route calculation utilities

app/api/scout/
├── directions/route.ts        # Google Directions API endpoint
├── map-styles/route.ts        # Custom map styling endpoint
└── restaurant-search/route.ts # Enhanced restaurant search (moved from debug)
```

### API Endpoint Strategy
```
/api/scout/
├── directions/               # New - Google Directions integration
│   └── route.ts             # Get directions and return GeoJSON
├── restaurant-search/        # Enhanced from existing debug endpoint
│   └── route.ts             # Restaurant discovery with map integration
└── map-styles/              # New - Custom map styling
    └── route.ts             # Serve custom map styles
```

---

## 🛤️ Google Directions API Integration Plan

### 1. Directions API Endpoint (`/api/scout/directions/route.ts`)
**Purpose**: Get directions and return GeoJSON-ready data for MapLibre

**Request Flow**:
```typescript
interface DirectionsRequest {
  origin: { lat: number, lng: number };
  destination: { lat: number, lng: number };
  travelMode?: 'driving' | 'walking' | 'transit' | 'bicycling';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

interface DirectionsResponse {
  success: boolean;
  route?: {
    geoJson: GeoJSON.Feature;
    distance: string;
    duration: string;
    steps: DirectionStep[];
  };
  error?: string;
}
```

**Implementation Process**:
1. Accept origin/destination coordinates from frontend
2. Call Google Directions API with travel preferences
3. Extract encoded polyline from Google response
4. Decode polyline to coordinate array using Google's algorithm
5. Convert coordinates to GeoJSON LineString format
6. Extract turn-by-turn directions for display
7. Return structured data for MapLibre consumption

### 2. Polyline Decoding Implementation
```typescript
// lib/scout/polylineDecoder.ts
export function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Google's polyline algorithm implementation
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]); // [longitude, latitude] for GeoJSON
  }

  return coordinates;
}
```

### 3. GeoJSON Conversion Utility
```typescript
// lib/scout/geoJsonConverter.ts
export function createRouteGeoJSON(
  coordinates: [number, number][],
  properties: Record<string, any>
): GeoJSON.Feature {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: coordinates
    },
    properties: {
      ...properties,
      stroke: "#329937",      // Brand green color
      "stroke-width": 4,
      "stroke-opacity": 0.8
    }
  };
}
```

### 4. MapLibre Route Display Integration
```typescript
// Implementation in RouteLayer.tsx
const addRouteToMap = (map: MapLibreGL.Map, routeGeoJSON: GeoJSON.Feature) => {
  // Remove existing route if present
  if (map.getSource('route')) {
    map.removeLayer('route');
    map.removeSource('route');
  }

  // Add route source
  map.addSource('route', {
    type: 'geojson',
    data: routeGeoJSON
  });

  // Add route layer with custom styling
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#329937',
      'line-width': 4,
      'line-opacity': 0.8
    }
  });

  // Add route waypoint markers
  map.addLayer({
    id: 'route-waypoints',
    type: 'circle',
    source: 'route',
    paint: {
      'circle-radius': 6,
      'circle-color': '#329937'
    }
  });
};
```

---

## 📝 Detailed Implementation Plan

### Phase 7A: MapLibre Foundation (Week 1)

#### Day 1-2: Package Installation & Basic Setup
**Tasks:**
- Install MapLibre GL JS and React Map GL packages
- Set up TypeScript definitions and configure Next.js for MapLibre
- Create basic `ScoutMapContainer` component with default map style
- Ensure SSR compatibility using dynamic imports

**Deliverables:**
```typescript
// components/scout/ScoutMapContainer.tsx
export default function ScoutMapContainer() {
  return (
    <div className="map-container">
      <Map
        initialViewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 14
        }}
        style={{ width: '100%', height: '400px' }}
        mapStyle="https://demotiles.maplibre.org/style.json"
      >
        {/* Map content will go here */}
      </Map>
    </div>
  );
}
```

#### Day 3-4: Map Configuration & Styling
**Tasks:**
- Configure map styles (street, satellite, dark mode options)
- Add zoom controls and style toggle functionality
- Implement map center and viewport management
- Add fullscreen control and mobile optimization

**Deliverables:**
- `lib/scout/mapLibreConfig.ts` - Map configuration file
- `components/scout/MapControls.tsx` - Control buttons component
- Custom CSS for map styling and responsiveness

#### Day 5-7: User Location Integration
**Tasks:**
- Port existing geolocation logic from ScoutDebug to map component
- Add user location marker with custom icon and accuracy circle
- Implement "center on user location" functionality
- Add location permission handling and error states

**Deliverables:**
- `components/scout/UserLocationMarker.tsx` - User position component
- Integration with existing geolocation services
- Location accuracy visualization on map

### Phase 7B: Restaurant Integration (Week 2)

#### Day 8-9: Restaurant Marker System
**Tasks:**
- Create custom restaurant markers using category icons
- Implement marker clustering for performance with 100+ restaurants
- Add click handlers for restaurant selection and highlighting
- Create popup/info window component for basic restaurant info

**Deliverables:**
```typescript
// components/scout/RestaurantMarkers.tsx
interface RestaurantMarker {
  restaurant: ProcessedRestaurant;
  isSelected: boolean;
  onClick: (restaurant: ProcessedRestaurant) => void;
}
```

#### Day 10-11: Search Integration
**Tasks:**
- Connect existing restaurant search API to map display
- Filter and display search results as markers on map
- Maintain all existing search categories (9 restaurant types)
- Update search to work with map viewport and bounds

**Deliverables:**
- Enhanced restaurant search with map integration
- Viewport-based search filtering
- Real-time marker updates as user pans/zooms

#### Day 12-14: Restaurant Details Panel
**Tasks:**
- Create slide-out restaurant details panel or modal
- Include restaurant photos, ratings, hours, contact info
- Maintain existing save-to-plate functionality with visual feedback
- Add "Get Directions" button integration

**Deliverables:**
- `components/scout/RestaurantDetails.tsx` - Detailed info panel
- Integration with existing save-to-plate API
- Enhanced UI for restaurant information display

### Phase 7C: Route Planning (Week 3)

#### Day 15-16: Google Directions API Integration
**Tasks:**
- Create `/api/scout/directions` endpoint
- Implement Google Directions API calls with error handling
- Build polyline decoding utility function
- Convert directions response to GeoJSON format

**Deliverables:**
```typescript
// app/api/scout/directions/route.ts
export async function POST(request: Request) {
  const { origin, destination, travelMode } = await request.json();
  
  // Call Google Directions API
  const directionsResponse = await getDirections(origin, destination, travelMode);
  
  // Decode polyline and convert to GeoJSON
  const geoJSON = convertToGeoJSON(directionsResponse.routes[0]);
  
  return NextResponse.json({
    success: true,
    route: {
      geoJson: geoJSON,
      distance: directionsResponse.routes[0].legs[0].distance.text,
      duration: directionsResponse.routes[0].legs[0].duration.text,
      steps: extractTurnByTurnDirections(directionsResponse)
    }
  });
}
```

#### Day 17-18: Route Display on Map
**Tasks:**
- Add route layer to MapLibre map with custom styling
- Display route polyline with brand colors (#329937 green)
- Show route distance and estimated travel time
- Add route waypoint markers (start, end, turns)

**Deliverables:**
- `components/scout/RouteLayer.tsx` - Route display component
- Custom route styling with brand consistency
- Interactive route features (hover effects, click details)

#### Day 19-21: Turn-by-Turn Directions
**Tasks:**
- Create directions panel component with collapsible interface
- Display step-by-step instructions with icons
- Add route management (clear route, recalculate, alternative routes)
- Implement route sharing functionality

**Deliverables:**
- `components/scout/RoutePanel.tsx` - Directions interface
- Turn-by-turn instruction display
- Route management controls

### Phase 7D: Enhanced Features (Week 4)

#### Day 22-23: Advanced Map Features
**Tasks:**
- Implement multiple map styles (street, satellite, terrain, dark mode)
- Add restaurant density heatmap layer (optional)
- Create custom map styling for brand consistency
- Add map theme switching functionality

**Deliverables:**
- Custom map styles matching app branding
- Style switcher component
- Enhanced visual features

#### Day 24-25: Performance Optimization
**Tasks:**
- Implement efficient marker clustering for 100+ restaurants
- Add result virtualization for large datasets
- Optimize API calls with intelligent caching
- Ensure smooth performance on mobile devices

**Deliverables:**
- Marker clustering implementation
- Performance monitoring and optimization
- Mobile-first responsive design

#### Day 26-28: UI/UX Enhancements & Testing
**Tasks:**
- Implement responsive design for mobile and desktop
- Add touch gestures and keyboard navigation support
- Create loading states and comprehensive error handling
- Add accessibility improvements (ARIA labels, screen reader support)
- Comprehensive testing and bug fixes

**Deliverables:**
- Fully responsive Scout page with MapLibre integration
- Accessibility compliance
- Complete test coverage

---

## 🔧 Technical Implementation Details

### MapLibre Configuration
```typescript
// lib/scout/mapLibreConfig.ts
export const mapConfig = {
  defaultStyle: 'https://demotiles.maplibre.org/style.json',
  styles: {
    street: 'https://demotiles.maplibre.org/style.json',
    satellite: 'https://tiles.openfreemap.org/satellite.json',
    dark: 'https://tiles.openfreemap.org/dark.json'
  },
  defaultViewState: {
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12,
    pitch: 0,
    bearing: 0
  },
  controls: {
    navigation: true,
    scale: true,
    fullscreen: true,
    geolocate: true
  }
};
```

### Custom Restaurant Markers
```typescript
// components/scout/RestaurantMarkers.tsx
const RestaurantMarker: React.FC<RestaurantMarkerProps> = ({ 
  restaurant, 
  isSelected, 
  onClick 
}) => {
  const markerIcon = getRestaurantIcon(restaurant.types[0]);
  
  return (
    <Marker
      longitude={restaurant.longitude}
      latitude={restaurant.latitude}
      anchor="bottom"
      onClick={() => onClick(restaurant)}
    >
      <div className={`restaurant-marker ${isSelected ? 'selected' : ''}`}>
        <div className="marker-icon" style={{ backgroundColor: markerIcon.color }}>
          {markerIcon.icon}
        </div>
        <div className="marker-label">{restaurant.name}</div>
      </div>
    </Marker>
  );
};
```

### Route GeoJSON Integration
```typescript
// components/scout/RouteLayer.tsx
export const RouteLayer: React.FC<RouteLayerProps> = ({ routeData }) => {
  const layerStyle: LayerProps = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#329937',
      'line-width': 4,
      'line-opacity': 0.8
    }
  };

  if (!routeData) return null;

  return (
    <Source id="route" type="geojson" data={routeData.geoJson}>
      <Layer {...layerStyle} />
    </Source>
  );
};
```

### SSR Compatibility Implementation
```typescript
// components/scout/ScoutMapContainer.tsx
import dynamic from 'next/dynamic';

const MapLibreMap = dynamic(() => import('./MapLibreMap'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="loading-spinner">Loading Map...</div>
    </div>
  )
});

export default function ScoutMapContainer(props: ScoutMapProps) {
  return (
    <div className="scout-map-container">
      <MapLibreMap {...props} />
    </div>
  );
}
```

---

## 🚨 Risk Mitigation & Solutions

### Potential Issues & Mitigation Strategies

#### 1. **SSR Compatibility Issues**
- **Risk**: MapLibre may not work with Next.js server-side rendering
- **Solution**: Use dynamic imports with `ssr: false` for map components
- **Fallback**: Provide loading placeholder while map initializes client-side
- **Testing**: Verify build and deployment process with map components

#### 2. **Performance on Mobile Devices**
- **Risk**: Heavy map rendering and marker clustering on mobile devices
- **Solution**: Implement efficient marker clustering with distance-based grouping
- **Optimization**: Reduce marker complexity, use CSS transforms for animations
- **Testing**: Test on various mobile devices and connection speeds

#### 3. **Map Styling Consistency**
- **Risk**: Default map styles may not match app branding
- **Solution**: Create custom map styles using MapLibre style specification
- **Alternative**: Use MapTiler or similar service for branded map styles
- **Fallback**: Overlay custom CSS styling on default map styles

#### 4. **Google API Rate Limits**
- **Risk**: Hitting rate limits on Google Directions or Places API
- **Solution**: Implement intelligent caching and request batching
- **Monitoring**: Add API usage tracking and rate limit monitoring
- **Fallback**: Graceful degradation when API limits are reached

#### 5. **Polyline Decoding Accuracy**
- **Risk**: Incorrect route display due to polyline decoding errors
- **Solution**: Use proven Google polyline algorithm implementation
- **Testing**: Validate against known routes and edge cases
- **Fallback**: Display simplified route if decoding fails

#### 6. **User Location Privacy**
- **Risk**: Users may deny location permissions
- **Solution**: Provide manual location selection and address search
- **UI/UX**: Clear messaging about location usage and benefits
- **Fallback**: Default to city center or last known location

### Error Handling Strategy
```typescript
// Error handling patterns for map integration
export const handleMapError = (error: Error, context: string) => {
  console.error(`Map error in ${context}:`, error);
  
  // Track errors for monitoring
  trackError('map_error', { context, error: error.message });
  
  // Show user-friendly error message
  showToast(`Unable to load ${context}. Please try again.`, 'error');
  
  // Attempt recovery if possible
  if (context === 'route_calculation') {
    // Fallback to simple point-to-point line
    return createFallbackRoute();
  }
};
```

---

## 📊 Success Metrics & Validation

### Functionality Requirements
- ✅ **Interactive Map Display**: MapLibre map with user location and restaurant markers
- ✅ **Restaurant Discovery**: All existing search functionality with map integration
- ✅ **Route Planning**: Google Directions integration with polyline display
- ✅ **Save-to-Plate**: Maintain all existing save functionality without changes
- ✅ **Mobile Experience**: Responsive design with touch-optimized controls
- ✅ **Performance**: Fast loading and smooth interactions on all devices

### Performance Targets
| Metric | Target | Current Baseline | Measurement Method |
|--------|--------|-----------------|-------------------|
| Map Load Time | < 2 seconds | N/A (placeholder) | Time to interactive |
| Marker Rendering | < 500ms for 50+ restaurants | N/A | Rendering performance |
| Route Calculation | < 3 seconds | N/A | API response time |
| Mobile Performance | 60fps interactions | N/A | Frame rate monitoring |
| Bundle Size | < 500KB added | N/A | Bundle analyzer |

### Cost Savings Analysis
| Service | Current Cost | New Cost | Savings |
|---------|-------------|----------|---------|
| Google Maps JavaScript API | ~$200/month | $0 | $200/month |
| Google Places API | ~$50/month | ~$50/month | $0 (kept) |
| Google Directions API | $0 (not implemented) | ~$30/month | -$30/month |
| **Total Monthly Savings** | | | **$170/month** |

### User Experience Metrics
- **Map Interaction Rate**: % of users who interact with map features
- **Route Usage**: Number of direction requests per session
- **Restaurant Discovery**: Restaurants viewed per search session
- **Save Rate**: % of viewed restaurants saved to plate
- **Mobile Usage**: % of users accessing Scout on mobile devices

---

## 🔄 Backward Compatibility & Migration Strategy

### Preservation Requirements
- **✅ ScoutDebug Component**: Keep existing debug functionality unchanged
- **✅ API Endpoints**: No changes to existing restaurant search APIs
- **✅ Authentication**: Maintain existing auth flow and user sessions
- **✅ Save-to-Plate**: Preserve all existing save functionality
- **✅ Database Schema**: No database migrations required
- **✅ UI Components**: Maintain existing UI patterns and styling

### Migration Approach
1. **Parallel Development**: Build MapLibre components alongside existing code
2. **Feature Flags**: Use environment variables to toggle between implementations
3. **Gradual Rollout**: Test with development/staging before production
4. **Rollback Plan**: Maintain ability to revert to placeholder map if needed

### Testing Strategy

#### Unit Testing
```typescript
// Test coverage for map components
describe('ScoutMapContainer', () => {
  it('renders map with user location', () => {
    render(<ScoutMapContainer userLocation={mockLocation} />);
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('displays restaurant markers', () => {
    render(<ScoutMapContainer restaurants={mockRestaurants} />);
    expect(screen.getAllByRole('button')).toHaveLength(mockRestaurants.length);
  });
});
```

#### Integration Testing
- Restaurant search integration with map display
- Route calculation and display workflow
- Save-to-plate functionality from map interface
- Error handling and recovery scenarios

#### End-to-End Testing
```typescript
// E2E test scenarios
test('Complete restaurant discovery workflow', async ({ page }) => {
  await page.goto('/scout');
  
  // Allow location permission
  await page.grantPermissions(['geolocation']);
  
  // Wait for map to load
  await expect(page.locator('.maplibregl-map')).toBeVisible();
  
  // Search for restaurants
  await page.fill('[data-testid=restaurant-search]', 'pizza');
  await page.click('[data-testid=search-button]');
  
  // Verify markers appear
  await expect(page.locator('.restaurant-marker')).toHaveCount.greaterThan(0);
  
  // Click marker and verify details
  await page.click('.restaurant-marker').first();
  await expect(page.locator('[data-testid=restaurant-details]')).toBeVisible();
  
  // Save to plate
  await page.click('[data-testid=save-to-plate]');
  await expect(page.locator('.save-success')).toBeVisible();
});
```

#### Performance Testing
- Load testing with 100+ restaurant markers
- Mobile device testing across different screen sizes
- Network condition testing (slow 3G, offline scenarios)
- Memory usage monitoring during extended map sessions

---

## 🚀 Deployment & Launch Strategy

### Environment Configuration
```env
# Required environment variables for Scout Map integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_DIRECTIONS_API_KEY=your_directions_key  # New
MAPLIBRE_STYLE_URL=your_custom_style_url      # Optional
SCOUT_DEBUG_MODE=true                         # Development only
```

### Feature Flag Implementation
```typescript
// lib/featureFlags.ts
export const scoutFeatureFlags = {
  useMapLibre: process.env.NEXT_PUBLIC_USE_MAPLIBRE === 'true',
  enableRouting: process.env.NEXT_PUBLIC_ENABLE_ROUTING === 'true',
  debugMode: process.env.SCOUT_DEBUG_MODE === 'true'
};
```

### Rollout Plan
1. **Development Testing** (Week 1-2): Internal testing with feature flags
2. **Staging Deployment** (Week 3): Full feature testing in staging environment
3. **Beta Release** (Week 4): Limited production rollout with monitoring
4. **Full Launch** (Week 5): Complete migration with performance monitoring
5. **Optimization** (Week 6): Performance tuning based on real usage data

### Monitoring & Analytics
```typescript
// Analytics tracking for Scout map usage
export const trackScoutEvent = (eventName: string, properties: Record<string, any>) => {
  analytics.track(`scout_${eventName}`, {
    ...properties,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`
  });
};

// Key events to track
// - map_loaded, marker_clicked, route_requested, restaurant_saved
// - error_occurred, performance_issue, mobile_interaction
```

---

## 📚 Additional Resources & References

### Documentation Links
- **MapLibre GL JS**: https://maplibre.org/maplibre-gl-js-docs/
- **React Map GL**: https://visgl.github.io/react-map-gl/
- **Google Directions API**: https://developers.google.com/maps/documentation/directions
- **GeoJSON Specification**: https://geojson.org/
- **Polyline Algorithm**: https://developers.google.com/maps/documentation/utilities/polylinealgorithm

### Design Resources
- **Map Icons**: https://www.flaticon.com/categories/maps-and-locations
- **Custom Map Styles**: https://www.mapbox.com/maps/
- **Color Palette**: Brand colors from existing app design system

### Development Tools
- **MapLibre Style Editor**: https://maputnik.github.io/
- **GeoJSON Validator**: https://geojsonlint.com/
- **Polyline Decoder**: https://developers.google.com/maps/documentation/utilities/polylinealgorithm

---

## 🎯 Next Steps for Implementation

### Immediate Actions Required
1. **Review and Approve Plan**: Stakeholder review of this comprehensive plan
2. **Environment Setup**: Prepare development environment with required API keys
3. **Team Assignment**: Assign developers to specific implementation phases
4. **Timeline Confirmation**: Confirm 4-week implementation schedule

### Development Kickoff Checklist
- [ ] Install required packages (`maplibre-gl`, `react-map-gl`)
- [ ] Set up TypeScript configuration for MapLibre
- [ ] Create feature branch for Scout map integration
- [ ] Configure development environment variables
- [ ] Set up monitoring and analytics tracking
- [ ] Prepare testing environment for map functionality

### Success Criteria
- **Functionality**: All existing Scout features work with MapLibre
- **Performance**: Map loads in <2 seconds, smooth 60fps interactions
- **Cost**: Eliminate $200/month Google Maps JavaScript API costs
- **User Experience**: Improved restaurant discovery and route planning
- **Compatibility**: Works across all supported devices and browsers

---

*This document serves as the complete reference for Phase 7 Scout Map Integration. All implementation details, technical specifications, and success metrics are defined to ensure successful migration from Google Maps to MapLibre GL JS while maintaining and enhancing existing functionality.*

**Document Version**: 1.0  
**Last Updated**: September 29, 2025  
**Next Review**: Implementation kickoff meeting