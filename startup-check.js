#!/usr/bin/env node

/**
 * FUZO Startup Environment Check
 * Run this before starting the development server to ensure everything is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 FUZO Startup Environment Check');
console.log('==================================\n');

// Check for .env files
const envFiles = ['.env', '.env.local', '.env.development'];
const foundEnvFiles = envFiles.filter(file => fs.existsSync(file));

console.log('📁 Environment Files:');
foundEnvFiles.forEach(file => {
  console.log(`  ✅ ${file} found`);
});

if (foundEnvFiles.length === 0) {
  console.log('  ❌ No .env files found');
  console.log('  💡 Create a .env file with your Google Maps API key');
  process.exit(1);
}

// Check Google Maps API key in all found env files
let googleApiKeyFound = false;
let validKeyFound = false;

foundEnvFiles.forEach(file => {
  console.log(`\n🔍 Checking ${file}:`);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const googleKeyLine = lines.find(line => line.startsWith('VITE_GOOGLE_MAPS_API_KEY='));
    
    if (googleKeyLine) {
      googleApiKeyFound = true;
      const keyValue = googleKeyLine.split('=')[1];
      
      console.log(`  ✅ VITE_GOOGLE_MAPS_API_KEY found`);
      console.log(`  📏 Key length: ${keyValue?.length || 0} characters`);
      
      if (keyValue && keyValue.startsWith('AIza')) {
        validKeyFound = true;
        console.log(`  ✅ Key format appears valid (starts with 'AIza')`);
        console.log(`  🔑 Key preview: ${keyValue.substring(0, 12)}...`);
      } else if (keyValue === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.log(`  ⚠️  Key is placeholder - replace with actual API key`);
      } else {
        console.log(`  ❌ Key format appears invalid (should start with 'AIza')`);
      }
    } else {
      console.log(`  ❌ VITE_GOOGLE_MAPS_API_KEY not found in ${file}`);
    }
  } catch (error) {
    console.log(`  ❌ Error reading ${file}: ${error.message}`);
  }
});

console.log('\n📋 Summary:');
console.log(`  Environment files: ${foundEnvFiles.length > 0 ? '✅' : '❌'}`);
console.log(`  Google API key found: ${googleApiKeyFound ? '✅' : '❌'}`);
console.log(`  Valid key format: ${validKeyFound ? '✅' : '❌'}`);

if (!googleApiKeyFound) {
  console.log('\n❌ Setup Required:');
  console.log('  1. Add to your .env file:');
  console.log('     VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here');
  console.log('  2. Get your API key from: https://console.cloud.google.com/');
  console.log('  3. Enable Maps JavaScript API and Places API');
  process.exit(1);
}

if (!validKeyFound) {
  console.log('\n⚠️  Warning: API key format may be invalid');
  console.log('  Google Maps API keys should start with "AIza"');
  console.log('  Please verify your API key is correct');
}

console.log('\n🎉 Environment check complete!');
console.log('Ready to start FUZO development server.');
console.log('\nRun: npm run dev or yarn dev');

// Additional checks
console.log('\n🔧 Additional Recommendations:');
console.log('  - Restart your development server after env changes');
console.log('  - Clear browser cache if you experience issues');
console.log('  - Use the Environment Debug page in the app for runtime checks');