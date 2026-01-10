import { SpoonacularService } from '../services/spoonacular';
import { YouTubeService } from '../services/youtube';

/**
 * Test API connectivity and quota status
 */
export async function testAPIs() {
  console.log('🧪 Testing APIs...\n');
  
  // Test Spoonacular
  console.log('📡 Testing Spoonacular API...');
  try {
    const recipeResult = await SpoonacularService.searchRecipes({ 
      query: 'pasta', 
      number: 3 
    });
    
    if (recipeResult.success) {
      console.log('✅ Spoonacular: SUCCESS');
      console.log(`   Found ${recipeResult.data?.results?.length || 0} recipes`);
      if (recipeResult.data?.results?.[0]) {
        console.log(`   Sample: "${recipeResult.data.results[0].title}"`);
      }
    } else {
      console.error('❌ Spoonacular: FAILED');
      console.error(`   Error: ${recipeResult.error}`);
    }
  } catch (error) {
    console.error('❌ Spoonacular: EXCEPTION');
    console.error(`   ${error}`);
  }
  
  console.log('\n');
  
  // Test YouTube
  console.log('📡 Testing YouTube API...');
  try {
    const videoResult = await YouTubeService.searchVideos('cooking pasta', 3);
    
    if (videoResult.success) {
      console.log('✅ YouTube: SUCCESS');
      console.log(`   Found ${videoResult.data?.items?.length || 0} videos`);
      if (videoResult.data?.items?.[0]) {
        console.log(`   Sample: "${videoResult.data.items[0].snippet.title}"`);
      }
    } else {
      console.error('❌ YouTube: FAILED');
      console.error(`   Error: ${videoResult.error}`);
    }
  } catch (error) {
    console.error('❌ YouTube: EXCEPTION');
    console.error(`   ${error}`);
  }
  
  console.log('\n🧪 API test complete\n');
}

// Expose to window for console testing
if (typeof window !== 'undefined') {
  (window as any).testAPIs = testAPIs;
}
