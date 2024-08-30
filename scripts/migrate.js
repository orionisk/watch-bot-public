// src/migrate.ts

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
const env = process.env.NODE_ENV || 'development';

const configMap = {
  development: '.env.development',
  production: '.env.prod',
  beta: '.env.prod.beta'
};

config({ path: configMap[env] });

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migration completed');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

await main();

await sql.end();
