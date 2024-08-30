import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  config({ path: '.env.development' });
}

if (env === 'production') {
  config({ path: '.env.prod' });
}

if (env === 'beta') {
  config({ path: '.env.prod.beta' });
}

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
