import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export default supabase;
