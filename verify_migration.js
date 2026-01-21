import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Verifying Migration 011: User Presence System\n');
  console.log('=' .repeat(60));

  // 1. Check users table columns
  console.log('\n1️⃣ Checking presence columns in users table...');
  const { data: userColumns, error: userColumnsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN ('is_online', 'last_activity_at', 'last_seen')
      ORDER BY column_name;
    `
  });

  // Try alternative method using direct query
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('is_online, last_activity_at, last_seen')
    .limit(1);

  if (usersError) {
    console.log('   ❌ Users table presence columns check failed:');
    console.log('      Error:', usersError.message);
    if (usersError.message.includes('column') && usersError.message.includes('does not exist')) {
      console.log('      ⚠️  Migration 011 has NOT been applied!');
    }
  } else {
    console.log('   ✅ Users table has presence columns (is_online, last_activity_at, last_seen)');
  }

  // 2. Check user_presence table
  console.log('\n2️⃣ Checking user_presence table...');
  const { data: presenceData, error: presenceError } = await supabase
    .from('user_presence')
    .select('id')
    .limit(1);

  if (presenceError) {
    console.log('   ❌ user_presence table check failed:');
    console.log('      Error:', presenceError.message);
    if (presenceError.message.includes('does not exist')) {
      console.log('      ⚠️  user_presence table does NOT exist!');
    }
  } else {
    console.log('   ✅ user_presence table exists');
  }

  // 3. Check helper functions
  console.log('\n3️⃣ Checking helper functions...');

  // Try calling update_user_activity with a test (it should fail gracefully if user doesn't exist)
  const testUserId = '00000000-0000-0000-0000-000000000000';
  const { error: funcError } = await supabase.rpc('update_user_activity', {
    p_user_id: testUserId,
    p_session_id: 'test-session',
    p_device_info: { browser: 'test' }
  });

  if (funcError) {
    if (funcError.message.includes('function') && funcError.message.includes('does not exist')) {
      console.log('   ❌ Function update_user_activity does NOT exist');
    } else {
      // Function exists but failed for other reasons (expected)
      console.log('   ✅ Function update_user_activity exists');
    }
  } else {
    console.log('   ✅ Function update_user_activity exists and executed');
  }

  // Check mark_user_offline
  const { error: offlineError } = await supabase.rpc('mark_user_offline', {
    p_user_id: testUserId
  });

  if (offlineError) {
    if (offlineError.message.includes('function') && offlineError.message.includes('does not exist')) {
      console.log('   ❌ Function mark_user_offline does NOT exist');
    } else {
      console.log('   ✅ Function mark_user_offline exists');
    }
  } else {
    console.log('   ✅ Function mark_user_offline exists and executed');
  }

  // Check cleanup_stale_presence
  const { error: cleanupError } = await supabase.rpc('cleanup_stale_presence');

  if (cleanupError) {
    if (cleanupError.message.includes('function') && cleanupError.message.includes('does not exist')) {
      console.log('   ❌ Function cleanup_stale_presence does NOT exist');
    } else {
      console.log('   ✅ Function cleanup_stale_presence exists');
    }
  } else {
    console.log('   ✅ Function cleanup_stale_presence exists and executed');
  }

  // Summary
  console.log('\n' + '='.repeat(60));

  const hasUsersColumns = !usersError;
  const hasPresenceTable = !presenceError;
  const hasFunctions = !funcError?.message?.includes('does not exist') &&
                       !offlineError?.message?.includes('does not exist') &&
                       !cleanupError?.message?.includes('does not exist');

  if (hasUsersColumns && hasPresenceTable && hasFunctions) {
    console.log('\n✅ Migration 011 is FULLY APPLIED!');
    console.log('\n🎉 Your presence system is ready to use!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Log in to the app');
    console.log('  3. Open chat - you should see online status indicators');
  } else {
    console.log('\n⚠️  Migration 011 is PARTIALLY or NOT applied!');
    console.log('\nMissing components:');
    if (!hasUsersColumns) console.log('  - Users table presence columns');
    if (!hasPresenceTable) console.log('  - user_presence table');
    if (!hasFunctions) console.log('  - Helper functions');
    console.log('\n💡 Action needed: Apply migration manually via Supabase SQL Editor');
    console.log('   Copy contents of: supabase/migrations/011_add_user_presence.sql');
    console.log('   Paste in: https://supabase.com/dashboard/project/lgladnskxmbkhcnrsfxv/sql/new');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run verification
verifyMigration().catch(console.error);
