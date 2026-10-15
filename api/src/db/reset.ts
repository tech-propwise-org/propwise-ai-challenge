import { resetDatabase } from './reset-lib';

resetDatabase()
  .then(() => console.log('Database reset: tables recreated and seed data loaded.'))
  .catch((error) => {
    console.error(error);
    console.error(
      '\nThe reset did not finish. If it stopped part-way, the database may be half set up: fix the error above and run `pnpm db:reset` again.',
    );
    process.exit(1);
  });
