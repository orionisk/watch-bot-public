import { z } from 'zod';
import { logger } from '@/logger/logger';
import { insertPriceSchema } from '@/db/schema/zod';
import { insertPricesBatch } from '@/db/db';

const priceQueue: z.infer<typeof insertPriceSchema>[] = [];
const batchSize = 300;
// const maxQueueSize = 3000;

export const addPriceToQueue = async (
  priceData: z.infer<typeof insertPriceSchema>
): Promise<void> => {
  try {
    // if (priceQueue.length >= maxQueueSize) {
    //   priceQueue.splice(0, batchSize);
    // }
    priceQueue.push(priceData);
  } catch (error) {
    logger.error(`Error adding price to queue: ${error}`);
  }
};

const processBatch = async () => {
  if (priceQueue.length > 0) {
    const prices = priceQueue.splice(0, batchSize);
    try {
      // console.log('insert', prices.length, new Date().getSeconds());
      await insertPricesBatch(prices);
    } catch (error) {
      logger.error(`Error inserting prices batch: ${error}`);
    }
  }
};

let processing = false;

const processQueue = async (): Promise<void> => {
  if (!processing) {
    processing = true;
    await processBatch();
    processing = false;
  }
};

setInterval(processQueue, 100);
