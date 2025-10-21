-- Migration: Add Geocoding to master_bot_posts
-- Date: October 17, 2025
-- Purpose: Enable spatial queries and location-based filtering for personalized feed
-- This is the foundation of FUZO's curated location dataset

-- =====================================================
-- 1. Add Geocoding Columns
-- =====================================================

-- Add coordinates column (PostGIS POINT type)
ALTER TABLE master_bot_posts 
ADD COLUMN IF NOT EXISTS coordinates geography(POINT, 4326);

-- Add parsed location fields for easier filtering
ALTER TABLE master_bot_posts
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_country VARCHAR(2),
ADD COLUMN IF NOT EXISTS location_state VARCHAR(100);

-- Add Google Place ID (for future integration)
-- Note: Current restaurant_id is custom format, we'll keep both
ALTER TABLE master_bot_posts
ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255);

-- Add geocoding metadata
ALTER TABLE master_bot_posts
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS geocoding_source VARCHAR(50); -- 'google', 'manual', 'approximate', etc.

-- =====================================================
-- 2. Create Spatial Indexes
-- =====================================================

-- GIST index for spatial queries (nearby restaurants)
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_coordinates 
ON master_bot_posts USING GIST(coordinates);

-- Index for location text filtering
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_location 
ON master_bot_posts(location_city, location_country);

-- Index for Google Place ID lookups
CREATE INDEX IF NOT EXISTS idx_master_bot_posts_google_place_id 
ON master_bot_posts(google_place_id) 
WHERE google_place_id IS NOT NULL;

-- =====================================================
-- 3. Parse Existing Location Data
-- =====================================================

-- Parse restaurant_location into city and country
-- Format: "City, Country Code" or "District, City, Country Code"
UPDATE master_bot_posts
SET 
  location_country = CASE 
    WHEN restaurant_location LIKE '%,%' THEN 
      TRIM(SPLIT_PART(restaurant_location, ',', ARRAY_LENGTH(STRING_TO_ARRAY(restaurant_location, ','), 1)))
    ELSE NULL
  END,
  location_city = CASE 
    WHEN restaurant_location LIKE '%,%,%' THEN 
      TRIM(SPLIT_PART(restaurant_location, ',', 2))
    WHEN restaurant_location LIKE '%,%' THEN 
      TRIM(SPLIT_PART(restaurant_location, ',', 1))
    ELSE NULL
  END
WHERE restaurant_location IS NOT NULL;

-- =====================================================
-- 4. Add Approximate City Coordinates
-- =====================================================

-- For now, add approximate city-center coordinates for major cities
-- This gives us immediate proximity filtering while we work on precise geocoding

-- Mumbai, India
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('IN', 'INDIA') 
  AND LOWER(location_city) LIKE '%mumbai%'
  AND coordinates IS NULL;

-- Barcelona, Spain
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(2.1734, 41.3851), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('ES', 'SPAIN') 
  AND LOWER(location_city) LIKE '%barcelona%'
  AND coordinates IS NULL;

-- London, UK
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('GB', 'UK', 'UNITED KINGDOM') 
  AND LOWER(location_city) LIKE '%london%'
  AND coordinates IS NULL;

-- Paris, France
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('FR', 'FRANCE') 
  AND LOWER(location_city) LIKE '%paris%'
  AND coordinates IS NULL;

-- New York, USA
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('US', 'USA', 'UNITED STATES') 
  AND LOWER(location_city) LIKE '%new york%'
  AND coordinates IS NULL;

-- Hong Kong
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(114.1694, 22.3193), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('HK', 'HONG KONG') 
  AND coordinates IS NULL;

-- Tokyo, Japan
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(139.6917, 35.6762), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('JP', 'JAPAN') 
  AND LOWER(location_city) LIKE '%tokyo%'
  AND coordinates IS NULL;

-- Bangkok, Thailand
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('TH', 'THAILAND') 
  AND LOWER(location_city) LIKE '%bangkok%'
  AND coordinates IS NULL;

-- Mexico City, Mexico
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('MX', 'MEXICO') 
  AND LOWER(restaurant_location) LIKE '%mexico city%'
  AND coordinates IS NULL;

-- Singapore
UPDATE master_bot_posts
SET 
  coordinates = ST_SetSRID(ST_MakePoint(103.8198, 1.3521), 4326)::geography,
  geocoding_source = 'approximate_city_center',
  geocoded_at = NOW()
WHERE UPPER(location_country) IN ('SG', 'SINGAPORE') 
  AND coordinates IS NULL;

-- =====================================================
-- 5. Create Helper Functions
-- =====================================================

-- Function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 NUMERIC,
  lng1 NUMERIC,
  lat2 NUMERIC,
  lng2 NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  ) / 1000.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get nearby restaurants
CREATE OR REPLACE FUNCTION get_nearby_posts(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km INTEGER DEFAULT 50,
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  restaurant_name TEXT,
  restaurant_location TEXT,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mbp.id,
    mbp.restaurant_name,
    mbp.restaurant_location,
    (ST_Distance(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      mbp.coordinates
    ) / 1000.0)::NUMERIC as distance_km
  FROM master_bot_posts mbp
  WHERE mbp.coordinates IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      mbp.coordinates,
      radius_km * 1000.0  -- Convert km to meters
    )
    AND mbp.is_published = true
  ORDER BY mbp.coordinates <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Add Comments
-- =====================================================

COMMENT ON COLUMN master_bot_posts.coordinates IS 'Geographic coordinates (lat/lng) for spatial queries. Core of FUZO curated location dataset.';
COMMENT ON COLUMN master_bot_posts.location_city IS 'Parsed city name from restaurant_location';
COMMENT ON COLUMN master_bot_posts.location_country IS 'Parsed country code from restaurant_location';
COMMENT ON COLUMN master_bot_posts.google_place_id IS 'Google Places API Place ID for precise location data';
COMMENT ON COLUMN master_bot_posts.geocoding_source IS 'How coordinates were obtained: google, manual, approximate, snap_user_generated';
COMMENT ON COLUMN master_bot_posts.geocoded_at IS 'Timestamp when geocoding was performed';

-- =====================================================
-- 7. Verification Queries
-- =====================================================

-- Check geocoding coverage
SELECT 
  geocoding_source,
  COUNT(*) as count,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM master_bot_posts) * 100, 2) as percentage
FROM master_bot_posts
WHERE coordinates IS NOT NULL
GROUP BY geocoding_source
ORDER BY count DESC;

-- Check location distribution
SELECT 
  location_country,
  location_city,
  COUNT(*) as post_count,
  COUNT(CASE WHEN coordinates IS NOT NULL THEN 1 END) as geocoded_count
FROM master_bot_posts
GROUP BY location_country, location_city
ORDER BY post_count DESC
LIMIT 20;

-- Sample geocoded records
SELECT 
  id,
  restaurant_name,
  restaurant_location,
  location_city,
  location_country,
  ST_AsText(coordinates::geometry) as coordinates_text,
  geocoding_source,
  geocoded_at
FROM master_bot_posts
WHERE coordinates IS NOT NULL
LIMIT 5;
