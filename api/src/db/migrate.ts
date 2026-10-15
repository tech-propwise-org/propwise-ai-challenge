import { MikroORM } from '@mikro-orm/postgresql';
import { buildOrmConfig } from '../mikro-orm.config';

async function main() {
  const orm = await MikroORM.init(buildOrmConfig());
  try {
    const applied = await orm.getMigrator().up();
    console.log(applied.length ? `Applied ${applied.map((m) => m.name).join(', ')}` : 'No pending migrations.');
  } finally {
    await orm.close(true);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
