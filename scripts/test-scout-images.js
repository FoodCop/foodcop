// Test Scout Page Image Loading
// Run with: node scripts/test-scout-images.js

import * as dotenv from "dotenv";
import {
  getPlaceHeroUrl,
  staticMapFallback,
} from "../src/lib/google/places.ts";

// Load environment variables
dotenv.config({ path: ".env" });

const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing VITE_GOOGLE_MAPS_API_KEY environment variable");
  process.exit(1);
}

console.log("🔍 Testing Scout Page Image Loading...\n");

// Test the same logic as SafeRestaurantImage component
async function testScoutImageLoading() {
  const testRestaurants = [
    {
      name: "Test Restaurant 1",
      placeId: "ChIJQSB4GI6ipBIR0owzy0TgXoY", // Robata, Barcelona
      coordinates: { lat: 41.3851, lng: 2.1734 },
    },
    {
      name: "Test Restaurant 2",
      placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4", // Google Sydney
      coordinates: { lat: -33.8688, lng: 151.2093 },
    },
  ];

  for (const restaurant of testRestaurants) {
    console.log(`\n📍 Testing: ${restaurant.name}`);
    console.log(`   Place ID: ${restaurant.placeId}`);

    try {
      // Test Google Places API v1 (same as SafeRestaurantImage)
      console.log("   🔍 Fetching image using getPlaceHeroUrl...");
      const result = await getPlaceHeroUrl(restaurant.placeId, {
        maxWidth: 400,
        maxHeight: 300,
      });

      if (result.url) {
        console.log("   ✅ Image URL obtained successfully");
        console.log(`   🖼️ Image URL: ${result.url.substring(0, 100)}...`);
        console.log(`   📝 Attributions: ${result.attributions.length} found`);
      } else {
        console.log("   ⚠️ No image available, testing static map fallback...");

        // Test static map fallback
        const staticMapUrl = staticMapFallback(
          restaurant.coordinates.lat,
          restaurant.coordinates.lng,
          400,
          300
        );
        console.log(
          `   🗺️ Static Map URL: ${staticMapUrl.substring(0, 100)}...`
        );
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

// Test the image loading logic
testScoutImageLoading()
  .then(() => {
    console.log("\n🎉 Scout page image loading test completed!");
    console.log(
      "If you see image URLs above, the Scout page should now display restaurant images correctly."
    );
  })
  .catch(console.error);
