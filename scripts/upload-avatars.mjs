// Direct upload script for masterbot avatars
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get environment variables from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const avatars = [
  { username: 'spice_scholar_anika', filename: 'anika_spice_scholar.png', name: 'Anika Kapoor' },
  { username: 'sommelier_seb', filename: 'sebastian_sommelier.png', name: 'Sebastian LeClair' },
  { username: 'coffee_pilgrim_omar', filename: 'omar_coffee_pilgrim.png', name: 'Omar Darzi' },
  { username: 'zen_minimalist_jun', filename: 'jun_zen_minimalist.png', name: 'Jun Tanaka' },
  { username: 'nomad_aurelia', filename: 'aurelia_nomad.png', name: 'Aurelia Voss' },
  { username: 'adventure_rafa', filename: 'rafael_adventure.png', name: 'Rafael Mendez' },
  { username: 'plant_pioneer_lila', filename: 'lila_plant_pioneer.png', name: 'Lila Cheng' }
];

for (const avatar of avatars) {
  const localPath = join(__dirname, '..', 'public', 'masterbot-avatars', avatar.filename);
  
  if (!existsSync(localPath)) {
    console.log(`❌ File not found: ${avatar.filename}`);
    continue;
  }

  const fileBuffer = readFileSync(localPath);
  const storagePath = `avatars/${avatar.filename}`;
  
  console.log(`📤 Uploading ${avatar.name}...`);
  
  const { data, error } = await supabase.storage
    .from('master-bot-posts')
    .upload(storagePath, fileBuffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/png'
    });

  if (error) {
    console.log(`❌ Upload failed: ${error.message}`);
    continue;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('master-bot-posts')
    .getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('username', avatar.username);

  if (updateError) {
    console.log(`❌ Database update failed: ${updateError.message}`);
    continue;
  }

  console.log(`✅ ${avatar.name} uploaded successfully!`);
  console.log(`   URL: ${publicUrl}`);
}

console.log('🎉 All avatars uploaded to Supabase Storage!');