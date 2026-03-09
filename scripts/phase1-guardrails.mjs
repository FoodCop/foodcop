import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredPaths = [
  'index.tsx',
  'index.html',
  'package.json',
  'vercel.json',
  'vite.config.ts',
  'tsconfig.json',
  'src/services',
  'public',
  'supabase/functions',
];

const errors = [];

for (const relPath of requiredPaths) {
  const target = path.join(root, relPath);
  if (!fs.existsSync(target)) {
    errors.push(`Missing required path: ${relPath}`);
  }
}

const vercelPath = path.join(root, 'vercel.json');
if (fs.existsSync(vercelPath)) {
  try {
    const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    if (vercel.buildCommand !== 'npm run build') {
      errors.push('vercel.json: buildCommand must be "npm run build"');
    }
    if (vercel.outputDirectory !== 'dist') {
      errors.push('vercel.json: outputDirectory must be "dist"');
    }

    const rewrite = Array.isArray(vercel.rewrites)
      ? vercel.rewrites.find((item) => item?.source === '/(.*)')
      : null;

    if (!rewrite || rewrite.destination !== '/index.html') {
      errors.push('vercel.json: SPA rewrite /(.*) -> /index.html is required');
    }
  } catch (error) {
    errors.push(`vercel.json parse failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const vitePath = path.join(root, 'vite.config.ts');
if (fs.existsSync(vitePath)) {
  const viteConfig = fs.readFileSync(vitePath, 'utf8');
  if (!viteConfig.includes("base: '/'") && !viteConfig.includes('base: "/"')) {
    errors.push('vite.config.ts: expected Vite base to be root (/).');
  }
}

if (errors.length > 0) {
  console.error('❌ Phase 1 guardrails failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('✅ Phase 1 guardrails passed.');
