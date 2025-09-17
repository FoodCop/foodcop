// Debug Environment Variables Script
// Run this in browser console to check environment variable access

console.log('🔍 Environment Variable Debug');
console.log('================================');

// Check if running in browser
console.log('Environment:', typeof window !== 'undefined' ? 'Browser' : 'Node.js');

// Try different ways to access environment variables
console.log('\n📋 Environment Variable Access Methods:');

// Method 1: import.meta.env
try {
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    console.log('✅ import.meta.env available');
    console.log('- VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? `${import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 8)}...` : 'Not found');
    console.log('- All VITE_ variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
  } else {
    console.log('❌ import.meta.env not available');
  }
} catch (error) {
  console.log('❌ import.meta.env error:', error.message);
}

// Method 2: process.env (usually Node.js)
try {
  if (typeof process !== 'undefined' && process.env) {
    console.log('✅ process.env available');
    console.log('- VITE_GOOGLE_MAPS_API_KEY:', process.env.VITE_GOOGLE_MAPS_API_KEY ? `${process.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 8)}...` : 'Not found');
  } else {
    console.log('❌ process.env not available');
  }
} catch (error) {
  console.log('❌ process.env error:', error.message);
}

// Method 3: Check if variables are bundled
console.log('\n🏗️ Build-time Variable Check:');
const testVar = '%VITE_GOOGLE_MAPS_API_KEY%';
if (testVar.includes('VITE_')) {
  console.log('❌ Variables not replaced at build time');
} else {
  console.log('✅ Variables replaced at build time');
}

console.log('\n💡 Troubleshooting Tips:');
console.log('1. Make sure .env file is in project root');
console.log('2. Variable names must start with VITE_');
console.log('3. No quotes around values in .env file');
console.log('4. Restart development server after .env changes');
console.log('5. Clear browser cache if needed');

export {};