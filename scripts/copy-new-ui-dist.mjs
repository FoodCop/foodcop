import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const newUiDist = resolve(root, 'new_UI', 'dist');
const publicNewUi = resolve(root, 'public', 'new_UI');

if (!existsSync(newUiDist)) {
  throw new Error(`new_UI dist not found at ${newUiDist}. Run new_UI build first.`);
}

rmSync(publicNewUi, { recursive: true, force: true });
mkdirSync(publicNewUi, { recursive: true });
cpSync(newUiDist, publicNewUi, { recursive: true });

console.log(`Copied new_UI build to ${publicNewUi}`);
