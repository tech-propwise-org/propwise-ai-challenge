#!/usr/bin/env node
// One-time setup: installs the three apps, creates the env files, starts Postgres and loads the seed data.
// Safe to run again: existing env files are kept, the database is reset to the seed data.

import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function step(title, command, cwd = root) {
  console.log(`\n▶ ${title}\n  $ ${command}`);
  const result = spawnSync(command, { cwd, shell: true, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\n✗ "${title}" failed. Fix the error above and run \`pnpm run bootstrap\` again.`);
    process.exit(result.status ?? 1);
  }
}

function copyIfMissing(from, to) {
  if (existsSync(join(root, to))) {
    console.log(`  kept existing ${to}`);
    return;
  }
  copyFileSync(join(root, from), join(root, to));
  console.log(`  created ${to}`);
}

console.log('\n▶ Env files');
copyIfMissing('api/.env.example', 'api/.env');
copyIfMissing('web/.env.example', 'web/.env.local');

step('Install API packages', 'pnpm install', join(root, 'api'));
step('Install web packages', 'pnpm install', join(root, 'web'));
step('Install mobile packages', 'pnpm install', join(root, 'mobile'));
step('Start Postgres', 'docker compose up -d --wait');
step('Create tables and load seed data', 'pnpm db:reset', join(root, 'api'));

console.log('\n✓ Setup done. Next: put your ANTHROPIC_API_KEY in api/.env, then `pnpm dev:api` and `pnpm dev:web`.');
