// Test Online Bites Page
// Run with: node scripts/test-online-bites.js

const PRODUCTION_URL =
  "https://finalfuzo-axt4dof6n-quantum-climbs-projects.vercel.app";

console.log("🌐 Testing Online Bites Page...\n");

async function testOnlineBites() {
  try {
    // Test 1: Check if the site is accessible
    console.log("1️⃣ Testing site accessibility...");
    const response = await fetch(PRODUCTION_URL);

    if (!response.ok) {
      console.error(`❌ Site not accessible: ${response.status}`);
      return;
    }

    console.log(`✅ Site is accessible (${response.status})`);

    // Test 2: Check if the Bites page loads
    console.log("\n2️⃣ Testing Bites page accessibility...");
    const bitesResponse = await fetch(`${PRODUCTION_URL}/bites`);

    if (!bitesResponse.ok) {
      console.error(`❌ Bites page not accessible: ${bitesResponse.status}`);
      return;
    }

    console.log(`✅ Bites page is accessible (${bitesResponse.status})`);

    // Test 3: Check if the main page loads
    console.log("\n3️⃣ Testing main page...");
    const mainResponse = await fetch(PRODUCTION_URL);
    const html = await mainResponse.text();

    if (html.includes("FUZO") && html.includes("Bites")) {
      console.log("✅ Main page contains FUZO and Bites references");
    } else {
      console.log("⚠️ Main page might not be loading correctly");
    }

    console.log("\n🎉 Online testing completed!");
    console.log(`📱 Production URL: ${PRODUCTION_URL}`);
    console.log("🍽️ Bites page should now be accessible online");
    console.log("\n📝 What to test manually:");
    console.log("   1. Navigate to the Bites page");
    console.log("   2. Check if real Spoonacular recipes are loading");
    console.log("   3. Test the search functionality");
    console.log("   4. Verify recipe images are from Spoonacular API");
    console.log("   5. Check if mock data is only shown as fallback");
  } catch (error) {
    console.error("❌ Online test failed:", error.message);
  }
}

testOnlineBites();
