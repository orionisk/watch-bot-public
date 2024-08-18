import {
  exchanges,
  userPeriodChanges,
  users,
  usersExchanges
} from '../src/db/schema/schema';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import { addUser } from '../src/users/users';
import {
  insertUserPeriodChangesSchema,
  insertUsersExchangesSchema
} from '../src/db/schema/zod';

process.env.NODE_ENV === 'production'
  ? config({ path: '.env.prod' })
  : config({ path: '.env.development' });

if (!('DATABASE_URL' in process.env))
  throw new Error('DATABASE_URL not found on .env.development');

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

const main = async () => {
  try {
    const usersData = [
      {
        id: 123456789,
        name: 'user',
        isAdmin: true
      }
    ];

    const exchangesData = [
      {
        name: 'Binance'
      },
      {
        name: 'Bybit'
      },
      { name: 'OKX' }
    ];

    const usersExchangeData = usersData
      .map(u => {
        const a: z.infer<typeof insertUsersExchangesSchema>[] = [];
        for (const e of exchangesData) {
          a.push({ userId: u.id, exchangeName: e.name });
        }
        return a;
      })
      .flat();

    const usersPeriodChangesData = usersData
      .map(u => {
        const a: z.infer<typeof insertUserPeriodChangesSchema>[] = [];
        a.push({ userId: u.id, change: 2, period: 120 });
        a.push({ userId: u.id, change: 10, period: 1200 });
        return a;
      })
      .flat();

    console.log('Seed start');
    // insert exchanges
    await db.insert(exchanges).values(exchangesData).onConflictDoNothing();

    // insert users
    for (const user of usersData) {
      await addUser(user);
    }

    // insert user periods
    await db
      .insert(userPeriodChanges)
      .values(usersPeriodChangesData)
      .onConflictDoNothing();

    // insert user exchanges
    await db
      .insert(usersExchanges)
      .values(usersExchangeData)
      .onConflictDoNothing();
    console.log('Seed done');
    await sql.end();
  } catch (error) {
    console.error(error);
  }
};

main();
