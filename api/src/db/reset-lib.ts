import { MikroORM } from '@mikro-orm/postgresql';
import { buildOrmConfig } from '../mikro-orm.config';
import { assertLocalDatabase } from './local-database';
import { seed } from './seed';

/** Drops every table, runs all migrations and seeds. Refuses anything but a local database. */
export async function resetDatabase(): Promise<void> {
  const orm = await MikroORM.init(buildOrmConfig());
  try {
    assertLocalDatabase(orm.config.get('clientUrl')!);
    await orm.em.getConnection().execute('drop schema public cascade; create schema public;');
    await orm.getMigrator().up();
    await seed(orm.em.fork());
  } finally {
    await orm.close(true);
  }
}
