#!/usr/bin/env node

/**
 * Setup script for Master Bot environment variables
 * Creates .env.local if it doesn't exist with the correct Supabase URL
 */

import fs from "fs";

const envTemplate = `# FUZO Master Bot Environment Configuration
# This file is ignored by git - safe to store your actual keys here

# Supabase Configuration
SUPABASE_URL=https://lgladnskxmbkhcnrsfxv.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: For Supabase CLI operations
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here

# AI Services (for Master Bot content generation)
OPENAI_API_KEY=your_openai_api_key_here

# Food Services (for recipe integration)
SPOONACULAR_API_KEY=your_spoonacular_api_key_here

# Development
NODE_ENV=development
`;

const envLocalPath = ".env.local";

if (!fs.existsSync(envLocalPath)) {
  fs.writeFileSync(envLocalPath, envTemplate);
  console.log("✅ Created .env.local file");
  console.log("📝 Please edit .env.local and add your actual Supabase keys");
} else {
  console.log("⚠️ .env.local already exists");
  console.log("✅ Make sure it contains your Supabase keys");
}

console.log(`
🔧 Environment Setup Complete!

Next steps:
1. Edit .env.local with your actual keys:
   - SUPABASE_ANON_KEY (from Supabase Dashboard > Settings > API)
   - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard > Settings > API)

2. Test the MCP connection:
   npm run test:mcp

3. Or use PowerShell:
   .\\scripts\\test-mcp.ps1 health

Your Supabase URL is already set to: https://lgladnskxmbkhcnrsfxv.supabase.co
`);









