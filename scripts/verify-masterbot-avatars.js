/**
 * Script to verify masterbot avatar setup
 * Run this to check if all avatar files exist and are accessible
 */

const MASTERBOT_AVATARS = [
  {
    username: 'spice_scholar_anika',
    name: 'Anika Kapoor',
    filename: 'anika_spice_scholar.png',
    description: 'Image 1: Woman with spices, cultural elements, traditional setting'
  },
  {
    username: 'sommelier_seb', 
    name: 'Sebastian LeClair',
    filename: 'sebastian_sommelier.png',
    description: 'Image 2: Man with wine glass, elegant setting, sophisticated'
  },
  {
    username: 'coffee_pilgrim_omar',
    name: 'Omar Darzi', 
    filename: 'omar_coffee_pilgrim.png',
    description: 'Image 3: Man with coffee cup, warm atmosphere, beard'
  },
  {
    username: 'zen_minimalist_jun',
    name: 'Jun Tanaka',
    filename: 'jun_zen_minimalist.png', 
    description: 'Image 4: Man with sushi, minimalist Japanese setting, peaceful'
  },
  {
    username: 'nomad_aurelia',
    name: 'Aurelia Voss',
    filename: 'aurelia_nomad.png',
    description: 'Image 5: Woman with dumpling, urban background, street food'
  },
  {
    username: 'adventure_rafa',
    name: 'Rafael Mendez',
    filename: 'rafael_adventure.png',
    description: 'Image 6: Man with food skewer, outdoor/mountain background, adventurous'
  },
  {
    username: 'plant_pioneer_lila',
    name: 'Lila Cheng',
    filename: 'lila_plant_pioneer.png',
    description: 'Image 7: Woman with plant-based food, leafy green background'
  }
];

async function checkAvatarFiles() {
  console.log('🤖 Masterbot Avatar Status Check\n');
  
  for (const avatar of MASTERBOT_AVATARS) {
    const imagePath = `/masterbot-avatars/${avatar.filename}`;
    
    try {
      const response = await fetch(imagePath);
      const status = response.ok ? '✅ Found' : '❌ Missing';
      
      console.log(`${status} ${avatar.name} (@${avatar.username})`);
      console.log(`   📁 ${avatar.filename}`);
      console.log(`   📝 ${avatar.description}`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error checking ${avatar.name}: ${error.message}`);
    }
  }
}

// Export for use in other files
export { MASTERBOT_AVATARS, checkAvatarFiles };

// Run check if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('Run checkAvatarFiles() to verify all avatar images are in place');
}