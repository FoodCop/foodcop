import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(process.cwd());
const newUiDir = resolve(root, 'new_UI');
const newUiPackageJson = resolve(newUiDir, 'package.json');

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (!existsSync(newUiPackageJson)) {
  console.log('[build:new-ui] Skipping: new_UI/package.json not found in this checkout.');
  process.exit(0);
}

console.log('[build:new-ui] Building new_UI...');
run('npm', ['--prefix', newUiDir, 'install']);
run('npm', ['--prefix', newUiDir, 'run', 'build']);
run('node', [resolve(root, 'scripts', 'copy-new-ui-dist.mjs')]);
console.log('[build:new-ui] Complete.');
