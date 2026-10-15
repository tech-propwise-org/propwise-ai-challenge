import { MikroORM } from '@mikro-orm/postgresql';
import { buildOrmConfig } from '../mikro-orm.config';
import { assertLocalDatabase } from './local-database';
import { seed } from './seed';

async function main() {
  const orm = await MikroORM.init(buildOrmConfig());
  try {
    assertLocalDatabase(orm.config.get('clientUrl')!);
    await seed(orm.em.fork());
    console.log('Seed data loaded.');
  } finally {
    await orm.close(true);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
