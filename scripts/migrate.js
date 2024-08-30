// src/migrate.ts

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
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
