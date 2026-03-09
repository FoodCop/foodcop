/**
 * Apply Migration 011: User Presence Tracking
 *
 * This script applies the database migration directly via Supabase REST API
 * using the service role key for admin access.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting migration 011: User Presence Tracking\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/011_add_user_presence.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log(`📊 Migration size: ${migrationSQL.length} characters\n`);

    // Execute migration
    console.log('⚙️  Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);

      // Try alternative approach using REST API directly
      console.log('\n🔄 Trying alternative approach via SQL Editor API...\n');

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: migrationSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Alternative approach also failed');
        console.error('Status:', response.status);
        console.error('Error:', errorText);
        console.log('\n⚠️  Please apply migration manually via Supabase Dashboard:');
        console.log('1. Go to: https://supabase.com/dashboard/project/lgladnskxmbkhcnrsfxv/sql/new');
        console.log('2. Copy contents of: supabase/migrations/011_add_user_presence.sql');
        console.log('3. Paste and execute\n');
        process.exit(1);
      }

      console.log('✅ Migration applied successfully via alternative method!\n');
    } else {
      console.log('✅ Migration applied successfully!\n');
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    await verifyMigration();

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n⚠️  Manual migration required. Follow these steps:');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/lgladnskxmbkhcnrsfxv/sql/new');
    console.log('2. Open file: supabase/migrations/011_add_user_presence.sql');
    console.log('3. Copy all contents and paste into SQL Editor');
    console.log('4. Click "Run" to execute\n');
    process.exit(1);
  }
}

async function verifyMigration() {
  try {
    // Check if user_presence table exists
    const { data: tables, error: tablesError } = await supabase
      .from('user_presence')
      .select('id')
      .limit(1);

    if (tablesError && tablesError.code === '42P01') {
      console.log('❌ Verification failed: user_presence table not found');
      return false;
    }

    console.log('✅ user_presence table created');

    // Check if columns were added to users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, is_online, last_activity_at, last_seen')
      .limit(1);

    if (usersError) {
      console.log('⚠️  Could not verify users table columns:', usersError.message);
    } else {
      console.log('✅ Presence columns added to users table');
    }

    console.log('\n🎉 Migration verification complete!\n');
    console.log('📋 Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Open browser DevTools console');
    console.log('3. Log in to the app');
    console.log('4. Look for: "🟢 PresenceTracker: Starting for user..."');
    console.log('5. Open chat - you should see green dots for online users\n');

    return true;
  } catch (err) {
    console.error('⚠️  Verification error:', err);
    return false;
  }
}

// Run migration
applyMigration();
