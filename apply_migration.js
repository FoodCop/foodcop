import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Robust splitter that respects $$ blocks and quotes
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next2 = sql.slice(i, i + 2);

    // Toggle dollar-quote blocks on $$
    if (!inSingle && !inDouble && next2 === '$$') {
      inDollar = !inDollar;
      current += '$$';
      i += 1; // skip next '$'
      continue;
    }

    // Handle quotes outside $$
    if (!inDollar) {
      if (ch === "'" && !inDouble) {
        const next = sql[i + 1];
        if (next === "'") {
          current += "''";
          i += 1;
          continue;
        }
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
      }
    }

    // Split on semicolon only when not inside quotes or $$
    if (ch === ';' && !inSingle && !inDouble && !inDollar) {
      const trimmed = current.trim();
      if (trimmed.length) statements.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }

  const tail = current.trim();
  if (tail.length) statements.push(tail);

  // Filter out pure comment statements
  return statements.filter((s) => s.length > 0 && !s.split(/\n/).every((line) => line.trim().startsWith('--')));
}

async function applyMigration() {
  console.log('🚀 Applying Migration 011: User Presence System\n');
  console.log('=' .repeat(60));

  try {
    // Read the migration file
    const migrationSQL = readFileSync('./supabase/migrations/011_add_user_presence.sql', 'utf8');

    console.log('\n📝 Migration SQL loaded from file');
    console.log(`   Size: ${migrationSQL.length} characters\n`);

    // Split into statements safely
    const statements = splitSqlStatements(migrationSQL);

    console.log(`📊 Found ${statements.length} SQL statements\n`);
    console.log('🔄 Executing migration...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      // Extract statement type for better logging
      const statementType = statement.split(/\s+/)[0].toUpperCase();
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');

      process.stdout.write(`   [${i + 1}/${statements.length}] ${statementType}: ${preview}...`);

      try {
        // Execute via Supabase RPC helper function
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.log(' ❌');
          console.log(`      Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(' ✅');
          successCount++;
        }
      } catch (error) {
        console.log(' ❌');
        console.log(`      Error: ${error.message}`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be normal if:');
      console.log('   - Objects already exist (IF NOT EXISTS clauses)');
      console.log('   - pg_cron extension not available');
      console.log('\n💡 Run verify_migration.js to check if migration succeeded');
    } else {
      console.log('\n✅ Migration appears successful!');
      console.log('\n💡 Running verification...\n');

      // Run verification
      const verifyMigration = (await import('./verify_migration.js')).default;
      // Verification will run automatically
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
applyMigration();
