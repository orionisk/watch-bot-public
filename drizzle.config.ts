import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const env = process.env.NODE_ENV || 'development';

const configMap = {
  development: '.env.development',
  production: '.env.prod',
  beta: '.env.prod.beta'
};

config({ path: configMap[env] });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  verbose: true,
  strict: true,
  out: './drizzle'
});
