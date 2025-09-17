import 'dotenv/config';
// Use explicit .ts extension for ts-node ESM resolution per tsconfig allowImportingTsExtensions
import { seedMasterBots } from '../src/lib/seedMasterBots.ts';

(async () => {
  const started = Date.now();
  console.log('Seeding Master Bots...');
  try {
    await seedMasterBots();
    console.log(`✅ Done in ${Date.now() - started}ms`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
})();
