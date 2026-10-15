import { MikroORM } from '@mikro-orm/postgresql';
import { buildOrmConfig } from '../mikro-orm.config';

// Compares the entities with the database and writes a migration for the difference.
// Run `pnpm db:migrate` first so the database is up to date.
async function main() {
  const orm = await MikroORM.init(buildOrmConfig());
  try {
    const result = await orm.getMigrator().createMigration();
    console.log(result.fileName ? `Created ${result.fileName}` : 'No changes: the entities match the database.');
  } finally {
    await orm.close(true);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
