import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseProjectRef = 'lgladnskxmbkhcnrsfxv';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

async function applyMigration() {
  console.log('🚀 Applying Migration 011: User Presence System\n');
  console.log('=' .repeat(60));

  try {
    // Read the migration file
    const migrationSQL = readFileSync('./supabase/migrations/011_add_user_presence.sql', 'utf8');

    console.log('\n📝 Migration SQL loaded');
    console.log(`   Size: ${migrationSQL.length} characters\n`);

    console.log('🔄 Executing migration via Supabase Management API...\n');

    // Use Supabase Management API to execute SQL
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${supabaseProjectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          query: migrationSQL
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.log('❌ Migration failed!');
      console.log('Error:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!\n');
    console.log('Result:', JSON.stringify(result, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Migration 011 completed!');
    console.log('\n💡 Running verification...\n');

    // Import and run verification
    await import('./verify_migration.js');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
applyMigration();
