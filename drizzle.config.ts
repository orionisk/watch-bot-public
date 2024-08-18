import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const env =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';

env === 'production'
  ? config({ path: '.env.prod' })
  : config({ path: '.env.development' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  verbose: true,
  strict: true,
  out: './drizzle'
});
