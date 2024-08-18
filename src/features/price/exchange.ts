import { getSymbols } from '@/common/utils';
import { ExchangeInstance } from '@/types/types';
import { logger } from '@/logger/logger';
import { Ticker, Tickers } from 'ccxt';
import {
  checkPriceChange,
  insertPrice,
  staggeredCheckPriceChange
} from './price';
import { deleteOldPrices } from '@/db/queries/deleteOldPrices';

const exchangesThrottle: Record<string, number> = {
  Bybit: 500,
  OKX: 500
};

export const watchExchanges = (...exchanges: ExchangeInstance[]): void => {
  exchanges.forEach(exchange => watchExchange(exchange));
  exchanges.forEach(exchange =>
    setInterval(() => fallbackFetchTickers(exchange), 5000)
  );
  setInterval(() => staggeredCheckPriceChange(1000), 1000);
  setInterval(deleteOldPrices, 1000 * 60 * 5);
};

export const watchExchange = async (
  exchange: ExchangeInstance
): Promise<void> => {
  try {
    const symbols = await getSymbols(exchange);

    for (const symbol of symbols) {
      watchTicker(exchange, symbol);
    }
  } catch (error) {
    logger.error(`Error watching exchange ${exchange.name}: ${error}`);
  }
};

const watchTicker = async (
  exchange: ExchangeInstance,
  pair: string
): Promise<void> => {
  const name = exchange.name || '';
  let prev: Ticker | null = null;
  let buffer: Ticker | null = null;

  setInterval(() => {
    if (!buffer || !exchangesThrottle[name]) return;
    if (buffer.timestamp === prev?.timestamp) return;
    insertPrice(buffer, exchange.name!);
    prev = buffer;
    buffer = null;
  }, exchangesThrottle[name]);

  while (true) {
    try {
      const ticker = await exchange.watchTicker(pair);
      if (exchangesThrottle[name]) {
        buffer = ticker;
      } else {
        insertPrice(ticker, exchange.name!);
      }
    } catch (error) {
      logger.error(`Error watching ticker for pair ${pair}: ${error}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const fallbackFetchTickers = async (exchange: ExchangeInstance) => {
  try {
    const symbols = await getSymbols(exchange);
    const data = await exchange.fetchTickers(symbols);
    for (const d of Object.values(data)) {
      insertPrice(d, exchange.name!);
    }
  } catch (error) {
    logger.error(
      `Error fetching tickers for exchange ${exchange.name}: ${error}`
    );
  }
};
