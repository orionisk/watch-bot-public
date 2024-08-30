import { db } from '@/db/drizzle';
import { pairsPrices } from '@/db/schema/schema';
import { insertPriceSchema } from '@/db/zod';
import { z } from 'zod';
import { logger } from '@/logger/logger';
import { PriceChangeData } from '@/types/types';
import { SQLWrapper } from 'drizzle-orm';

export const insertPricesBatch = async (
  prices: z.infer<typeof insertPriceSchema>[]
) => {
  try {
    await db.insert(pairsPrices).values(prices);
  } catch (error) {
    logger.error(`Error inserting prices batch: ${error}`);
  }
};

export const executePriceChangeQuery = async (
  query: SQLWrapper
): Promise<PriceChangeData[]> => {
  try {
    return await db.execute(query);
  } catch (error) {
    logger.error(`Error executing price change query: ${error}`);
    throw error;
  }
};
