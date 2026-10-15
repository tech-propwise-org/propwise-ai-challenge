import { resetDatabase } from './reset-lib';

resetDatabase()
  .then(() => console.log('Database reset: tables recreated and seed data loaded.'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
