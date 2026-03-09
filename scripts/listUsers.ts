import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function listAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, username')
        .order('email');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\nTotal users: ${data?.length || 0}\n`);
    data?.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.display_name}`);
        console.log(`   Username: @${user.username}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
    });
}

listAllUsers();
