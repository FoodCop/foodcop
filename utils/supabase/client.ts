import { getSupabaseClient } from "../supabase";

// Export the singleton client
const supabase = getSupabaseClient();

export default supabase;
