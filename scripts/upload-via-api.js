/**
 * Simple upload using the existing API endpoint
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const MASTERBOT_AVATARS = [
  { username: 'spice_scholar_anika', filename: 'anika_spice_scholar.png', name: 'Anika Kapoor' },
  { username: 'sommelier_seb', filename: 'sebastian_sommelier.png', name: 'Sebastian LeClair' },
  { username: 'coffee_pilgrim_omar', filename: 'omar_coffee_pilgrim.png', name: 'Omar Darzi' },
  { username: 'zen_minimalist_jun', filename: 'jun_zen_minimalist.png', name: 'Jun Tanaka' },
  { username: 'nomad_aurelia', filename: 'aurelia_nomad.png', name: 'Aurelia Voss' },
  { username: 'adventure_rafa', filename: 'rafael_adventure.png', name: 'Rafael Mendez' },
  { username: 'plant_pioneer_lila', filename: 'lila_plant_pioneer.png', name: 'Lila Cheng' }
];

async function uploadViaAPI() {
  console.log('🚀 Uploading masterbot avatars via API...\n');

  const localDir = path.join(__dirname, '..', 'public', 'masterbot-avatars');
  const formData = new FormData();
  let filesAdded = 0;

  // Add all files to form data
  for (const avatar of MASTERBOT_AVATARS) {
    const localFilePath = path.join(localDir, avatar.filename);
    
    if (fs.existsSync(localFilePath)) {
      const fileStream = fs.createReadStream(localFilePath);
      formData.append(avatar.username, fileStream, avatar.filename);
      console.log(`📁 Added ${avatar.name} (${avatar.filename})`);
      filesAdded++;
    } else {
      console.log(`❌ File not found: ${avatar.filename}`);
    }
  }

  if (filesAdded === 0) {
    console.log('❌ No files found to upload!');
    return;
  }

  console.log(`\n📤 Uploading ${filesAdded} files to Supabase Storage...`);

  try {
    const response = await fetch('http://localhost:3000/api/admin/upload-masterbot-avatars', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ Upload successful!');
      console.log(`📊 Results: ${result.results.length} processed`);
      
      result.results.forEach(r => {
        if (r.success) {
          console.log(`✅ ${MASTERBOT_AVATARS.find(a => a.username === r.username)?.name}: ${r.publicUrl}`);
        } else {
          console.log(`❌ ${MASTERBOT_AVATARS.find(a => a.username === r.username)?.name}: ${r.error}`);
        }
      });
      
    } else {
      console.log(`❌ Upload failed: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

uploadViaAPI().catch(console.error);