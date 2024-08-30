import {
  insertUserPeriodChangesSchema,
  insertUsersExchangesSchema
} from '../src/db/schema/zod';
import {
  exchanges,
  userPeriodChanges,
  usersExchanges
} from '../src/db/schema/schema';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { addUser } from '../src/users/users';
import { z } from 'zod';

const env = process.env.NODE_ENV || 'development';

const configMap = {
  development: '.env.development',
  production: '.env.prod',
  beta: '.env.prod.beta'
};

config({ path: configMap[env] });

if (!('DATABASE_URL' in process.env))
  throw new Error('DATABASE_URL not found on');

const generateUsersExchangeData = (
  usersData: Array<{ id: string }>,
  exchangesData: Array<{ name: string }>,
  insertUsersExchangesSchema: z.ZodSchema<any>
): z.infer<typeof insertUsersExchangesSchema>[] =>
  usersData
    .map(u => exchangesData.map(e => ({ userId: u.id, exchangeName: e.name })))
    .flat();

const generateUsersPeriodChangesData = (
  usersData: Array<{ id: string }>,
  insertUserPeriodChangesSchema: z.ZodSchema<any>
): z.infer<typeof insertUserPeriodChangesSchema>[] =>
  usersData
    .map(u => [
      { userId: u.id, change: 2, period: 120 },
      { userId: u.id, change: 10, period: 1200 }
    ])
    .flat();

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

export const seed = async (usersData, exchangesData) => {
  console.log('Seed start');
  // add exchanges
  await db.insert(exchanges).values(exchangesData).onConflictDoNothing();

  // add users
  for (const user of usersData) {
    await addUser(user);
  }

  const usersExchangeData = generateUsersExchangeData(
    usersData,
    exchangesData,
    insertUsersExchangesSchema
  );

  const usersPeriodChangesData = generateUsersPeriodChangesData(
    usersData,
    insertUserPeriodChangesSchema
  );

  // insert user exchanges
  await db
    .insert(usersExchanges)
    .values(usersExchangeData)
    .onConflictDoNothing();

  // insert user periods
  await db
    .insert(userPeriodChanges)
    .values(usersPeriodChangesData)
    .onConflictDoNothing();

  console.log('Seed done');
  return sql.end();
};
