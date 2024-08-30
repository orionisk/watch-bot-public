import { logger } from '@/logger/logger';
import { addPriceToQueue } from './queue';
import { normalizeSymbol } from '@/common/utils';
import { Ticker } from 'ccxt';
import { ParsePriceData } from '@/types/types';
import { insertPriceSchema } from '@/db/zod';

export const insertPrice = async (
  data: Ticker,
  exchangeName: string
): Promise<void> => {
  const date = new Date(data.datetime!);
  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();

  if (timeDiff > 10 * 1000) {
    if (exchangeName === 'Bybit') {
      logger.error(
        `Price is too old: ${exchangeName} ${
          data.symbol
        } ${date.toISOString()} - ${now.toISOString()}`
      );
    }
    return;
  }

  const parseResult = parsePrice({
    exchange: exchangeName,
    symbol: normalizeSymbol(data.symbol),
    price: data.last,
    timestamp: data.datetime
  });

  if (!parseResult) return;

  await addPriceToQueue(parseResult);
};

export const insertPrices = async (
  data: Ticker,
  exchangeName: string
): Promise<void> => {
  const parseResult = parsePrice({
    exchange: exchangeName,
    symbol: normalizeSymbol(data.symbol),
    price: data.last,
    timestamp: data.datetime
  });

  if (!parseResult) return;

  await addPriceToQueue(parseResult);
};

export const parsePrice = (data: ParsePriceData) => {
  const parseResult = insertPriceSchema.safeParse(data);

  if (!parseResult.success) {
    logger.error(`Error parsing price data: ${parseResult.error}`);
  }

  return parseResult.data;
};
