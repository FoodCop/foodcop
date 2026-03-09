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
    persistSession: false,
  },
});

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

    // Handle quotes
    if (!inDollar) {
      if (ch === "'" && !inDouble) {
        // toggle single quotes; handle escaped ''
        const prev = sql[i - 1];
        const next = sql[i + 1];
        if (next === "'") {
          // escaped quote inside single quotes
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

async function applyFix() {
  console.log('🚀 Applying Fix for Migration 011: User Presence System');
  console.log('============================================================');

  // Read fix SQL
  const sqlPath = './fix_migration_011.sql';
  const sql = readFileSync(sqlPath, 'utf8');
  console.log(`\n📝 Loaded ${sqlPath} (size: ${sql.length} chars)`);

  const statements = splitSqlStatements(sql);
  console.log(`📊 Prepared ${statements.length} SQL statements to execute`);
  console.log('\n🔄 Executing...\n');

  let success = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const type = stmt.split(/\s+/)[0].toUpperCase();
    const preview = stmt.substring(0, 100).replace(/\n/g, ' ');

    process.stdout.write(`   [${i + 1}/${statements.length}] ${type}: ${preview}...`);

    const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });

    if (error) {
      console.log(' ❌');
      console.log(`      Error: ${error.message}`);
      errors++;
    } else {
      console.log(' ✅');
      success++;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  console.log('\n============================================================');
  console.log(`\n📊 Results: Success=${success}, Errors=${errors}`);
  if (errors > 0) {
    console.log('⚠️  Some statements failed. If indexes/comments already exist, failures are safe.');
  }
}

applyFix().catch((e) => {
  console.error('Unexpected failure:', e);
  process.exit(1);
});
