// Check bot_posts table structure
// Run with: node scripts/check-bot-posts.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBotPosts() {
  try {
    console.log('🔍 Checking bot_posts table structure...\n');
    
    // Check bot_posts table
    const { data: posts, error: postsError } = await supabase
      .from('bot_posts')
      .select('*')
      .limit(3);
    
    if (postsError) {
      console.error('❌ Error fetching bot_posts:', postsError);
      return;
    }
    
    console.log('📝 Bot Posts:');
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.title}`);
      console.log(`      bot_id: ${post.bot_id}`);
      console.log(`      user_id: ${post.user_id}`);
      console.log(`      created_at: ${post.created_at}`);
      console.log('');
    });
    
    // Check if there are any users in the users table
    console.log('👤 Checking users table...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, display_name, is_master_bot')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`✅ Total users found: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ${user.display_name} (@${user.username}) - Master Bot: ${user.is_master_bot}`);
      });
    }
    
    // Check if there are any users with these bot_ids
    const botIds = posts.map(p => p.bot_id).filter(Boolean);
    if (botIds.length > 0) {
      console.log('\n🔍 Checking users for bot_ids:', botIds);
      
      const { data: botUsers, error: botUsersError } = await supabase
        .from('users')
        .select('id, username, display_name, is_master_bot')
        .in('id', botIds);
      
      if (botUsersError) {
        console.error('❌ Error fetching bot users:', botUsersError);
      } else {
        console.log(`✅ Bot users found: ${botUsers.length}`);
        botUsers.forEach(user => {
          console.log(`   - ${user.display_name} (@${user.username}) - Master Bot: ${user.is_master_bot}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBotPosts();
