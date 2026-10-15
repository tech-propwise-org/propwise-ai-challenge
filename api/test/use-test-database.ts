import 'dotenv/config';

// End-to-end tests run against their own database, never the one `pnpm dev` uses.
if (!process.env.DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST is not set. Copy api/.env.example to api/.env.');
}
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
