/**
 * Upload masterbot avatars to Supabase Storage
 * Run: node scripts/upload-masterbot-avatars.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Masterbot avatar mappings
const MASTERBOT_AVATARS = [
  {
    username: 'spice_scholar_anika',
    name: 'Anika Kapoor',
    filename: 'anika_spice_scholar.png'
  },
  {
    username: 'sommelier_seb',
    name: 'Sebastian LeClair',
    filename: 'sebastian_sommelier.png'
  },
  {
    username: 'coffee_pilgrim_omar',
    name: 'Omar Darzi',
    filename: 'omar_coffee_pilgrim.png'
  },
  {
    username: 'zen_minimalist_jun',
    name: 'Jun Tanaka',
    filename: 'jun_zen_minimalist.png'
  },
  {
    username: 'nomad_aurelia',
    name: 'Aurelia Voss',
    filename: 'aurelia_nomad.png'
  },
  {
    username: 'adventure_rafa',
    name: 'Rafael Mendez',
    filename: 'rafael_adventure.png'
  },
  {
    username: 'plant_pioneer_lila',
    name: 'Lila Cheng',
    filename: 'lila_plant_pioneer.png'
  }
];

async function uploadMasterbotAvatars() {
  console.log('🚀 Starting masterbot avatar upload to Supabase Storage...\n');

  const localDir = path.join(__dirname, '..', 'public', 'masterbot-avatars');
  const results = [];

  for (const avatar of MASTERBOT_AVATARS) {
    const localFilePath = path.join(localDir, avatar.filename);
    const storageFilePath = `avatars/${avatar.filename}`;

    console.log(`📤 Uploading ${avatar.name} (${avatar.filename})...`);

    try {
      // Check if file exists locally
      if (!fs.existsSync(localFilePath)) {
        console.log(`❌ File not found: ${localFilePath}`);
        results.push({ ...avatar, success: false, error: 'File not found locally' });
        continue;
      }

      // Read the file
      const fileBuffer = fs.readFileSync(localFilePath);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('master-bot-posts')
        .upload(storageFilePath, fileBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/png'
        });

      if (uploadError) {
        console.log(`❌ Upload failed: ${uploadError.message}`);
        results.push({ ...avatar, success: false, error: uploadError.message });
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('master-bot-posts')
        .getPublicUrl(storageFilePath);

      // Update user record in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('username', avatar.username)
        .eq('is_master_bot', true);

      if (updateError) {
        console.log(`❌ Database update failed: ${updateError.message}`);
        results.push({ ...avatar, success: false, error: updateError.message });
        continue;
      }

      console.log(`✅ Success! ${avatar.name} uploaded and database updated`);
      console.log(`   URL: ${publicUrl}\n`);
      
      results.push({ 
        ...avatar, 
        success: true, 
        publicUrl,
        uploadPath: uploadData.path 
      });

    } catch (error) {
      console.log(`❌ Error processing ${avatar.name}: ${error.message}`);
      results.push({ ...avatar, success: false, error: error.message });
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successful uploads: ${successful}/${results.length}`);
  console.log(`❌ Failed uploads: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed uploads:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  if (successful > 0) {
    console.log('\n✅ Successful uploads:');
    results
      .filter(r => r.success)
      .forEach(r => console.log(`   - ${r.name}: ${r.publicUrl}`));
  }

  console.log('\n🎉 Masterbot avatar upload process complete!');
  
  if (successful === results.length) {
    console.log('All masterbots now have custom avatars in Supabase Storage! 🎨');
  }
}

// Run the upload
uploadMasterbotAvatars().catch(console.error);