import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials. Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const shouldRun = process.argv.includes('--yes');
if (!shouldRun) {
  console.error('Refusing to run without confirmation. Re-run with: tsx scripts/purgeAllUsers.ts --yes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const APP_TABLES_TO_CLEAR = [
  'user_points_ledger',
  'saved_items',
  'friend_requests',
  'user_swipe_history',
  'user_presence',
  'dm_messages',
  'dm_conversations',
  'users',
];

const clearAppTables = async () => {
  console.log('Clearing application tables...');

  for (const table of APP_TABLES_TO_CLEAR) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) {
      console.warn(`- ${table}: skipped (${error.message})`);
      continue;
    }
    console.log(`- ${table}: cleared`);
  }
};

const listAllAuthUserIds = async (): Promise<string[]> => {
  const ids: string[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list auth users on page ${page}: ${error.message}`);
    }

    const users = data?.users || [];
    ids.push(...users.map((user) => user.id));

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return ids;
};

const deleteAuthUsers = async () => {
  console.log('Deleting auth users...');
  const userIds = await listAllAuthUserIds();

  if (userIds.length === 0) {
    console.log('- auth.users: no users found');
    return;
  }

  let deleted = 0;
  for (const userId of userIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`- auth user ${userId}: failed (${error.message})`);
      continue;
    }
    deleted += 1;
  }

  console.log(`- auth.users: deleted ${deleted}/${userIds.length}`);
};

const main = async () => {
  console.log('Starting full user/data purge...');
  await clearAppTables();
  await deleteAuthUsers();
  await clearAppTables();
  console.log('Purge complete.');
};

main().catch((error) => {
  console.error('Purge failed:', error);
  process.exit(1);
});
