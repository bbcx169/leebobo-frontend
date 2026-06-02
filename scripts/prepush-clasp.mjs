import { existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const rootDir = process.cwd();
const claspConfigPath = join(rootDir, '.clasp.json');
const gasDir = join(rootDir, 'gas');

if (process.env.SKIP_GAS_PUSH === '1') {
  console.log('[pre-push] SKIP_GAS_PUSH=1, skipping clasp push.');
  process.exit(0);
}

if (!existsSync(claspConfigPath)) {
  console.error('[pre-push] Missing .clasp.json.');
  console.error('[pre-push] Copy .clasp.json.example to .clasp.json and set the Apps Script scriptId.');
  console.error('[pre-push] To bypass once: SKIP_GAS_PUSH=1 git push');
  process.exit(1);
}

if (!existsSync(gasDir) || !readdirSync(gasDir).some(fileName => fileName.endsWith('.gs'))) {
  console.log('[pre-push] No gas/*.gs files found, skipping clasp push.');
  process.exit(0);
}

console.log('[pre-push] Pushing gas/*.gs to Apps Script with clasp...');
try {
  execSync('npm run gas:push', { stdio: 'inherit', shell: true });
} catch (error) {
  console.error('[pre-push] clasp push failed. Git push stopped so GAS does not drift from the repo.');
  if (error.message) {
    console.error('[pre-push] ' + error.message);
  }
  console.error('[pre-push] To bypass once: SKIP_GAS_PUSH=1 git push');
  process.exit(error.status || 1);
}
