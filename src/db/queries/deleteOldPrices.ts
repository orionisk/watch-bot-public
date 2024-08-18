import { sql } from 'drizzle-orm';
import { db } from '../schema/drizzle';
import { pairsPrices } from '../schema/schema';

export const deleteOldPrices = async () => {
  // console.log('delete old prices');
  await db.execute(sql`
  DELETE FROM ${pairsPrices}
    WHERE created_at < NOW() AT TIME ZONE 'UTC' - INTERVAL '2 hours'`);
};
