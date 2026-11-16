import { execSync } from 'node:child_process';
import { join } from 'node:path';
import './use-test-database';

// Reset the test database in a separate process. Loading the ORM here, in Jest's outer context,
// breaks the decorator metadata the tests load later ("Map.prototype.set called on incompatible receiver").
export default function globalSetup() {
  execSync('pnpm exec tsx src/db/reset.ts', { cwd: join(__dirname, '..'), stdio: 'inherit', env: process.env });
}
