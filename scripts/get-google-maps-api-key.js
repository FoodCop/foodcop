// Get Google Maps API Key Helper
// Run with: node scripts/get-google-maps-api-key.js

import { execSync } from "child_process";

console.log("🔑 Google Maps API Key Retrieval Helper");
console.log("=======================================");
console.log("");

try {
  // Get the current project
  const projectId = execSync("gcloud config get-value project", {
    encoding: "utf8",
  }).trim();
  console.log(`Current Google Cloud Project: ${projectId}`);
  console.log("");

  console.log("📋 Steps to get your Google Maps API Key:");
  console.log(
    `1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=${projectId}`
  );
  console.log("2. Click 'Create Credentials' > 'API Key'");
  console.log("3. Copy the generated API key");
  console.log("4. Click 'Restrict Key' and add these restrictions:");
  console.log("   - Application restrictions: HTTP referrers");
  console.log("   - Add referrer: http://localhost:*");
  console.log("   - Add referrer: https://your-domain.com/*");
  console.log("   - API restrictions: Select 'Restrict key'");
  console.log("   - Select these APIs:");
  console.log("     * Places API (New)");
  console.log("     * Maps JavaScript API");
  console.log("     * Geocoding API");
  console.log("     * Static Maps API");
  console.log("5. Save the restrictions");
  console.log("");

  console.log("🔧 After getting your API key:");
  console.log("1. Create a .env file in your project root");
  console.log("2. Add this line: VITE_GOOGLE_MAPS_API_KEY=your_api_key_here");
  console.log("3. Restart your development server");
  console.log("");

  console.log("🧪 Test your API key:");
  console.log("Run: node scripts/test-google-places-images.js");
  console.log("");

  console.log("💡 Quick .env file template:");
  console.log("VITE_GOOGLE_MAPS_API_KEY=AIzaSy...");
  console.log("VITE_SUPABASE_URL=https://lgladnskxmbkhcnrsfxv.supabase.co");
  console.log("VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  console.log("");

  console.log("🚀 Opening Google Cloud Console...");

  // Try to open the URL (works on most systems)
  try {
    const { exec } = await import("child_process");
    const platform = process.platform;
    let command;

    if (platform === "win32") {
      command = `start https://console.cloud.google.com/apis/credentials?project=${projectId}`;
    } else if (platform === "darwin") {
      command = `open https://console.cloud.google.com/apis/credentials?project=${projectId}`;
    } else {
      command = `xdg-open https://console.cloud.google.com/apis/credentials?project=${projectId}`;
    }

    exec(command);
  } catch (error) {
    console.log(
      "Could not auto-open browser. Please manually visit the URL above."
    );
  }
} catch (error) {
  console.error("❌ Error getting project ID:", error.message);
  console.log("Make sure you're logged in to Google Cloud CLI:");
  console.log("Run: gcloud auth login");
}
