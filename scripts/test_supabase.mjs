import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, count, error } = await supabase.from('recipes').select('*', { count: 'exact' }).range(0, 11);
  console.log("Error:", error);
  console.log("Count:", count);
  console.log("Data length:", data?.length);
}

test();
