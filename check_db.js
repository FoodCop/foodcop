// Test script to check Supabase database tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase database...');
  console.log('URL:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

  try {
    // Try to get all tables in the public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('❌ Error fetching tables:', error);
      return;
    }

    console.log('✅ Found', tables?.length || 0, 'tables:');
    tables?.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });

    // Check specifically for chat-related tables
    const chatTables = tables?.filter(t => 
      t.table_name.includes('chat') || 
      t.table_name.includes('message') || 
      t.table_name.includes('conversation')
    );

    console.log('\n💬 Chat-related tables:');
    if (chatTables?.length) {
      chatTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('  No chat-related tables found');
    }

    // Check if specific tables exist
    const requiredTables = ['users', 'user_relationships', 'master_bots'];
    console.log('\n🔍 Checking required tables:');
    for (const tableName of requiredTables) {
      const exists = tables?.some(t => t.table_name === tableName);
      console.log(`  - ${tableName}: ${exists ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase();