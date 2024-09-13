import { getSymbols } from '@/common/utils';
import { ExchangeInstance } from '@/types/types';
import { logger } from '@/logger/logger';
import { insertPrice } from './insert-price';

const separateWatch: Record<string, boolean> = {
  Binance: true,
  Bybit: true,
  OKX: false
};

const fallbackFetchInterval: Record<string, number> = {
  Binance: 5000,
  Bybit: 3000,
  OKX: 3000
};

export const watchExchanges = (...exchanges: ExchangeInstance[]): void => {
  exchanges.forEach(exchange => watchExchange(exchange));
  exchanges.forEach(exchange =>
    setInterval(
      () => fallbackFetchTickers(exchange),
      fallbackFetchInterval[exchange.name!] || 5000
    )
  );
};

export const watchExchange = async (
  exchange: ExchangeInstance
): Promise<void> => {
  try {
    const symbols = await getSymbols(exchange);

    if (separateWatch[exchange.name!]) {
      for (const symbol of symbols) {
        watchTicker(exchange, symbol);
      }
    } else {
      watchTickers(exchange, symbols);
    }
  } catch (error) {
    logger.error(`Error watching exchange ${exchange.name}: ${error}`);
  }
};

const watchTicker = async (
  exchange: ExchangeInstance,
  pair: string
): Promise<void> => {
  while (true) {
    try {
      const ticker = await exchange.watchTicker(pair);
      insertPrice(ticker, exchange.name!);
    } catch (error) {
      logger.error(
        `${exchange.name}: Error watching ticker for pair ${pair}: ${error}`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const watchTickers = async (
  exchange: ExchangeInstance,
  pairs: string[]
): Promise<void> => {
  while (true) {
    try {
      const tickers = await exchange.watchTickers(pairs);
      insertPrice(Object.values(tickers)[0], exchange.name!);
    } catch (error) {
      logger.error(
        `${exchange.name}: Error watching ticker for pair ${pairs[0]}: ${error}`
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const fallbackFetchTickers = async (exchange: ExchangeInstance) => {
  try {
    const symbols = await getSymbols(exchange);
    const data = await exchange.fetchTickers(symbols);

    if (!data) return;

    for (const d of Object.values(data)) {
      insertPrice(d, exchange.name!);
    }
  } catch (error) {
    logger.error(
      `Error fetching tickers for exchange ${exchange.name}: ${error}`
    );
  }
};
