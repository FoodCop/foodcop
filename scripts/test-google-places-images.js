// Test Google Places API Image Fetching
// Run with: node scripts/test-google-places-images.js

import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("❌ Missing VITE_GOOGLE_MAPS_API_KEY environment variable");
  process.exit(1);
}

console.log("🔍 Testing Google Places API Image Fetching...\n");

// Test place IDs (real restaurants from different cities)
const testPlaces = [
  {
    name: "Robata (Barcelona)",
    placeId: "ChIJQSB4GI6ipBIR0owzy0TgXoY",
    expected: "Should have photos",
  },
  {
    name: "Wasabi by Morimoto (Mumbai)",
    placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    expected: "Should have photos",
  },
  {
    name: "Random Place (Test)",
    placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    expected: "Should work",
  },
];

async function testPlaceDetails(placeId, placeName) {
  console.log(`\n📍 Testing: ${placeName}`);
  console.log(`   Place ID: ${placeId}`);

  try {
    // Test Place Details API
    console.log("   🔍 Fetching place details...");
    const detailsResponse = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
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
      const errorText = await detailsResponse.text();
      console.error(
        `   ❌ Place Details API failed: ${detailsResponse.status}`
      );
      console.error(`   Error: ${errorText}`);
      return {
        success: false,
        error: `Details API: ${detailsResponse.status}`,
      };
    }

    const detailsData = await detailsResponse.json();
    console.log(`   ✅ Place Details API success`);
    console.log(`   Name: ${detailsData.displayName?.text || "N/A"}`);
    console.log(`   Address: ${detailsData.formattedAddress || "N/A"}`);
    console.log(`   Rating: ${detailsData.rating || "N/A"}`);
    console.log(`   Photos available: ${detailsData.photos?.length || 0}`);

    if (!detailsData.photos || detailsData.photos.length === 0) {
      console.log("   ⚠️ No photos available for this place");
      return { success: true, hasPhotos: false };
    }

    // Test Place Photos API
    const firstPhoto = detailsData.photos[0];
    console.log(`   🖼️ Testing photo: ${firstPhoto.name}`);

    const photoResponse = await fetch(
      `https://places.googleapis.com/v1/${firstPhoto.name}/media?maxWidthPx=400&maxHeightPx=300&key=${API_KEY}&skipHttpRedirect=true`
    );

    if (!photoResponse.ok) {
      const errorText = await photoResponse.text();
      console.error(`   ❌ Photo Media API failed: ${photoResponse.status}`);
      console.error(`   Error: ${errorText}`);
      return { success: false, error: `Photo API: ${photoResponse.status}` };
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

    return {
      success: true,
      hasPhotos: true,
      photoUri: photoData.photoUri,
      attributions: firstPhoto.authorAttributions || [],
    };
  } catch (error) {
    console.error(`   ❌ Error testing ${placeName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testStaticMapFallback() {
  console.log(`\n🗺️ Testing Static Map Fallback...`);

  try {
    const lat = 40.7128;
    const lng = -74.006;

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x300&markers=${lat},${lng}&key=${API_KEY}`;

    console.log(`   📍 Testing coordinates: ${lat}, ${lng}`);
    console.log(`   🔗 Static Map URL: ${staticMapUrl.substring(0, 100)}...`);

    // Test if the URL is accessible
    const response = await fetch(staticMapUrl, { method: "HEAD" });

    if (response.ok) {
      console.log(`   ✅ Static Map API working`);
      return { success: true };
    } else {
      console.error(`   ❌ Static Map API failed: ${response.status}`);
      return { success: false, error: `Static Map: ${response.status}` };
    }
  } catch (error) {
    console.error(`   ❌ Static Map error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`🌐 API Base: https://places.googleapis.com/v1`);

  const results = [];

  // Test each place
  for (const place of testPlaces) {
    const result = await testPlaceDetails(place.placeId, place.name);
    results.push({ place: place.name, ...result });
  }

  // Test static map fallback
  const staticMapResult = await testStaticMapFallback();
  results.push({ place: "Static Map Fallback", ...staticMapResult });

  // Summary
  console.log(`\n📊 Test Results Summary:`);
  console.log(`=====================================`);

  const successful = results.filter((r) => r.success).length;
  const withPhotos = results.filter((r) => r.hasPhotos).length;

  console.log(`✅ Successful API calls: ${successful}/${results.length}`);
  console.log(`🖼️ Places with photos: ${withPhotos}/${testPlaces.length}`);

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const photos = result.hasPhotos ? "🖼️" : "📷";
    console.log(`${status} ${result.place} ${result.hasPhotos ? photos : ""}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  if (successful === results.length) {
    console.log(
      `\n🎉 All tests passed! Google Places API image fetching is working correctly.`
    );
  } else {
    console.log(`\n⚠️ Some tests failed. Check the errors above.`);
  }
}

runTests().catch(console.error);
