import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("🧪 Testing environment variables...");
console.log(
  "VITE_SUPABASE_URL:",
  process.env.VITE_SUPABASE_URL ? "✅ Present" : "❌ Missing"
);
console.log(
  "VITE_SUPABASE_ANON_KEY:",
  process.env.VITE_SUPABASE_ANON_KEY ? "✅ Present" : "❌ Missing"
);

if (process.env.VITE_SUPABASE_URL) {
  console.log(
    "URL preview:",
    process.env.VITE_SUPABASE_URL.substring(0, 30) + "..."
  );
}

if (process.env.VITE_SUPABASE_ANON_KEY) {
  console.log(
    "Key preview:",
    process.env.VITE_SUPABASE_ANON_KEY.substring(0, 30) + "..."
  );
}
