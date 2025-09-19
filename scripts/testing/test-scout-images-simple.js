// Test Scout Page Image Loading (Simple Version)
// Run with: node scripts/test-scout-images-simple.js

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing VITE_GOOGLE_MAPS_API_KEY environment variable");
  process.exit(1);
}

console.log("🔍 Testing Scout Page Image Loading (Simple Version)...\n");

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
      console.log("   🔍 Fetching place details...");
      const detailsResponse = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(
          restaurant.placeId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask": "photos,displayName,rating,formattedAddress",
          },
        }
      );

      if (!detailsResponse.ok) {
        console.error(
          `   ❌ Place Details API failed: ${detailsResponse.status}`
        );
        continue;
      }

      const detailsData = await detailsResponse.json();
      console.log(`   ✅ Place Details API success`);
      console.log(`   Name: ${detailsData.displayName?.text || "N/A"}`);
      console.log(`   Photos available: ${detailsData.photos?.length || 0}`);

      if (!detailsData.photos || detailsData.photos.length === 0) {
        console.log(
          "   ⚠️ No photos available, testing static map fallback..."
        );

        // Test static map fallback
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${restaurant.coordinates.lat},${restaurant.coordinates.lng}&zoom=15&size=400x300&markers=${restaurant.coordinates.lat},${restaurant.coordinates.lng}&key=${API_KEY}`;
        console.log(
          `   🗺️ Static Map URL: ${staticMapUrl.substring(0, 100)}...`
        );
        continue;
      }

      // Test Place Photos API
      const firstPhoto = detailsData.photos[0];
      console.log(
        `   🖼️ Testing photo: ${firstPhoto.name.substring(0, 50)}...`
      );

      const photoResponse = await fetch(
        `https://places.googleapis.com/v1/${firstPhoto.name}/media?maxWidthPx=400&maxHeightPx=300&key=${API_KEY}&skipHttpRedirect=true`
      );

      if (!photoResponse.ok) {
        console.error(`   ❌ Photo Media API failed: ${photoResponse.status}`);
        continue;
      }

      const photoData = await photoResponse.json();
      console.log(`   ✅ Photo Media API success`);
      console.log(
        `   Photo URI: ${photoData.photoUri ? "Available" : "Not available"}`
      );

      if (photoData.photoUri) {
        console.log(
          `   🎉 Image URL: ${photoData.photoUri.substring(0, 100)}...`
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
    console.log("\n💡 Next steps:");
    console.log("1. Open your browser to http://localhost:5173/");
    console.log("2. Navigate to the Scout page");
    console.log("3. Check if restaurant images are now loading");
  })
  .catch(console.error);
